const Job = require('../models/job');
const Customer = require('../models/customer');
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

const createJob = async (req, res) => {
    try {
        // Lấy Firebase UID từ middleware
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) {
            return res.status(401).json({ error: 'Chưa đăng nhập!' });
        }
        // Tìm customer tương ứng
        const customer = await Customer.findOne({
            where: { firebase_id: firebaseUid },
        });
        if (!customer) {
            return res
                .status(404)
                .json({ error: 'Không tìm thấy khách hàng!' });
        }

        // Lấy payload từ body
        const { serviceId, serviceDetailId, location } = req.body;

        // Tạo record mới
        const job = await Job.create({
            customer_id: customer.customer_id,
            service_id: serviceId,
            service_detail_id: serviceDetailId || null,
            location: location || null,
        });

        return res.status(201).json(job);
    } catch (err) {
        console.error('❌ createJob error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const loadJobs = async (req, res) => {
    try {
        // 1) Lấy thông tin customer từ Firebase UID
        const firebaseUid = req.user.uid;
        const customer = await Customer.findOne({
            where: { firebase_id: firebaseUid },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy customer' });
        }

        // 2) Lấy danh sách job kèm các quan hệ
        const rows = await sequelize.query(
            `SELECT 
                j.job_id,
                j.customer_id,
                j.tasker_id,
                j.service_id,
                j.service_detail_id,
                j.location,
                j.status,
                j.created_at,
                j.completed_at,
                j.noted,
                tx.amount,
                tx.currency,
                s.name AS service_name,
                t.name AS tasker_name
            FROM job j
            JOIN transaction tx ON j.job_id = tx.job_id
            JOIN service s ON j.service_id = s.service_id
            LEFT JOIN tasker t ON j.tasker_id = t.tasker_id
            WHERE j.customer_id = :customerId
            ORDER BY j.job_id DESC`,
            {
                replacements: { customerId: customer.customer_id },
                type: QueryTypes.SELECT,
            }
        );

        const result = rows.map((row) => ({
            job_id: row.job_id,
            customer_id: row.customer_id,
            tasker_id: row.tasker_id,
            service_id: row.service_id,
            service_detail_id: row.service_detail_id,
            location: row.location,
            status: row.status,
            created_at: row.created_at,
            completed_at: row.completed_at,
            noted: row.noted,
            price: row.amount,
            currency: row.currency,
            service: { name: row.service_name },
            tasker: row.tasker_name ? { name: row.tasker_name } : null,
        }));

        return res.json(result);
    } catch (error) {
        console.error('loadJobs error:', error);
        return res.status(500).json({ error: error.message });
    }
};

const cancelJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Chỉ cho phép hủy nếu job chưa được hoàn thành
        if (job.status === 'completed') {
            return res
                .status(400)
                .json({ error: 'Công việc đã hoàn thành không thể hủy' });
        }

        // Cập nhật trạng thái job
        job.status = 'cancelled';
        await job.save();

        return res.json({ message: 'Công việc đã được hủy thành công' });
    } catch (error) {
        console.error('cancelJob error:', error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createJob,
    loadJobs,
    cancelJob,
};
