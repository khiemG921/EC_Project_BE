const { Op } = require('sequelize');
const Job = require('../models/job');
const Service = require('../models/service');
const ServiceDetail = require('../models/service_detail');
const Tasker = require('../models/tasker');
const Transaction = require('../models/transaction');

// Thông tin liên hệ hỗ trợ (lấy từ UX hủy của khách hàng: 1900 8888)
const SUPPORT_CONTACT = {
    phone: '1900 8888',
    email: 'support@cleannow.vn',
};

// Chuẩn hóa địa chỉ tự do sang mã thành phố và kiểm tra có thuộc thành phố không
function isLocationInCity(location, cityCode) {
    if (!location || !cityCode) return false;
    const s = String(location).toLowerCase();
    const checks = {
        hcm: [
            'tp hcm',
            'tp.hcm',
            'hcm',
            'tp ho chi minh',
            'tp hồ chí minh',
            'ho chi minh',
            'hồ chí minh',
            'sai gon',
            'sài gòn',
            'sg',
            'tphcm',
        ],
        hanoi: ['hà nội', 'ha noi', 'hn'],
        danang: ['đà nẵng', 'da nang', 'dn'],
    };
    const variants = checks[cityCode] || [];
    return variants.some((v) => s.includes(v));
}

function toCityCode(cityParam) {
    if (!cityParam) return null;
    const c = String(cityParam).toLowerCase();
    if (['hcm', 'tphcm', 'tp.hcm', 'ho-chi-minh', 'ho_chi_minh'].includes(c))
        return 'hcm';
    if (['hanoi', 'ha-noi', 'ha_noi', 'hn'].includes(c)) return 'hanoi';
    if (['danang', 'da-nang', 'da_nang', 'dn'].includes(c)) return 'danang';
    return null;
}

async function getEstimatedEarnings(service_id, job_id) {
    try {
        let commission; // Mặc định là 10%
        if (service_id === 1 || service_id === 2) {
            commission = 0.15;
        } else if (service_id === 4 || service_id === 5 || service_id === 8) {
            commission = 0.2;
        } else {
            commission = 0.1;
        }

        const transactionRecord = await Transaction.findOne({
            where: {
                job_id: job_id,
            },
            attributes: ['amount', 'clean_coins'],
        });

        const amountValue = transactionRecord && transactionRecord.amount ? parseFloat(transactionRecord.amount) : 0;
        const cleanCoinsValue = transactionRecord && transactionRecord.clean_coins ? parseFloat(transactionRecord.clean_coins) : 0;
        const earning = (amountValue + cleanCoinsValue) * parseFloat(commission);

        if (isNaN(earning)) return 200000; // fallback to default earning
        return earning.toFixed(2);
    } catch {}
    return 200000; // fallback
}

// API: GET /api/tasker/jobs?city=hcm|hanoi|danang
exports.listJobsByCity = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid)
            return res.status(401).json({ message: 'Unauthorized' });
        const tasker = await Tasker.findOne({
            where: { firebase_id: firebaseUid },
            attributes: ['tasker_id'],
        });
        if (!tasker)
            return res
                .status(403)
                .json({ message: 'Chỉ tasker mới được truy cập' });

        const cityCode = toCityCode(req.query.city) || 'hcm';

    // Lấy các job trạng thái:
    // - pending 
    // - in_progress 
    // - completed 
        const jobs = await Job.findAll({
            where: {
                [Op.or]: [
                    { status: 'pending' },
            { status: 'in_progress', tasker_id: tasker.tasker_id },
            { status: 'completed', tasker_id: tasker.tasker_id },
                ],
            },
            include: [{ model: Service, as: 'service' }],
            order: [['created_at', 'DESC']],
        });

        const filtered = [];
        for (const j of jobs) {
            if (!isLocationInCity(j.location, cityCode)) continue;
            const accepted =
                j.tasker_id === tasker.tasker_id && j.status === 'in_progress';
            const est = await getEstimatedEarnings(j.service_id, j.job_id);
            filtered.push({
                job_id: j.job_id,
                service: {
                    name: j.service?.name,
                    service_id: String(j.service_id),
                },
                location: j.location,
                created_at: j.created_at,
                noted: j.noted,
                status: j.status,
                accepted,
                estimated_earnings: est,
            });
        }

        return res.json({ city: cityCode, data: filtered });
    } catch (err) {
        console.error('listJobsByCity error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// API: POST /api/tasker/jobs/:jobId/accept
exports.acceptJob = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid)
            return res.status(401).json({ message: 'Unauthorized' });
        const tasker = await Tasker.findOne({
            where: { firebase_id: firebaseUid },
            attributes: ['tasker_id'],
        });
        if (!tasker)
            return res
                .status(403)
                .json({ message: 'Chỉ tasker mới được truy cập' });

        const { jobId } = req.params;
        const job = await Job.findByPk(jobId);
        if (!job)
            return res
                .status(404)
                .json({ message: 'Không tìm thấy công việc' });
        if (job.status !== 'pending' || job.tasker_id) {
            return res
                .status(400)
                .json({ message: 'Công việc không ở trạng thái có thể nhận' });
        }

        await job.update({
            tasker_id: tasker.tasker_id,
            status: 'in_progress',
        });
        return res.json({
            message: 'Nhận việc thành công',
            job_id: job.job_id,
        });
    } catch (err) {
        console.error('acceptJob error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// API: GET /api/tasker/jobs/:jobId
// Xem chi tiết một công việc cụ thể.
// - Nếu job ở trạng thái pending (mọi tasker đều xem được)
// - Nếu job ở trạng thái in_progress và đã được gán cho tasker đang đăng nhập
exports.getJobDetail = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid)
            return res.status(401).json({ message: 'Unauthorized' });
        const tasker = await Tasker.findOne({
            where: { firebase_id: firebaseUid },
            attributes: ['tasker_id'],
        });
        if (!tasker)
            return res
                .status(403)
                .json({ message: 'Chỉ tasker mới được truy cập' });

        const { jobId } = req.params;
        const job = await Job.findByPk(jobId);
        if (!job)
            return res
                .status(404)
                .json({ message: 'Không tìm thấy công việc' });

        const isAssignedToMe = job.tasker_id === tasker.tasker_id;
        if (!(
            job.status === 'pending' ||
            (job.status === 'in_progress' && isAssignedToMe) ||
            (job.status === 'completed' && isAssignedToMe)
        )) {
            return res
                .status(403)
                .json({
                    message: 'Bạn không có quyền xem chi tiết công việc này',
                });
        }
        
        const estimated_earnings = await getEstimatedEarnings(job.service_id, job.job_id);
        const detail = {
            job_id: job.job_id,
            status: job.status,
            created_at: job.created_at,
            completed_at: job.completed_at,
            location: job.location,
            noted: job.noted,
            accepted: isAssignedToMe && job.status === 'in_progress',
            description: job.description || null,
            duration: job.total_duration || null,
            estimated_earnings,
        };

        return res.json({ data: detail });
    } catch (err) {
        console.error('getJobDetail error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// API: GET /api/tasker/regulations
// Trả về quy chế nhận và hủy việc dành cho đối tác (Tasker)
exports.getTaskerRegulations = async (_req, res) => {
    const policy = {
        version: '1.0',
        effective_from: '2025-08-12',
        title: 'Quy chế nhận và hủy việc dành cho đối tác (Tasker)',
        rules: [
            'Khi bấm "Nhận việc", đối tác xác nhận đã đọc kỹ mô tả công việc, địa điểm và yêu cầu dịch vụ.',
            'Sau khi nhận, đối tác phải chủ động thực hiện công việc đúng thời gian và địa điểm đã thỏa thuận.',
            'Đối tác KHÔNG được hủy công việc sau khi đã bấm nhận.',
            `Trường hợp bất khả kháng cần hỗ trợ, vui lòng liên hệ tổng đài ${SUPPORT_CONTACT.phone} để được hướng dẫn.`,
        ],
        cancellation: {
            can_cancel_after_accept: false,
            contact_phone: SUPPORT_CONTACT.phone,
            contact_email: SUPPORT_CONTACT.email,
            instruction: `Nếu có sự cố ngoài ý muốn, liên hệ ${SUPPORT_CONTACT.phone} để được hỗ trợ xử lý thay vì tự ý hủy.`,
        },
    };
    return res.json(policy);
};

// API: POST /api/tasker/jobs/:jobId/cancel
// Endpoint bảo vệ: Không cho phép tasker hủy việc qua API, luôn trả về hướng dẫn gọi tổng đài
exports.requestCancelJob = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid)
            return res.status(401).json({ message: 'Unauthorized' });
        const tasker = await Tasker.findOne({
            where: { firebase_id: firebaseUid },
            attributes: ['tasker_id'],
        });
        if (!tasker)
            return res
                .status(403)
                .json({ message: 'Chỉ tasker mới được truy cập' });

        const { jobId } = req.params;
        const job = await Job.findByPk(jobId);
        if (!job)
            return res
                .status(404)
                .json({ message: 'Không tìm thấy công việc' });

        // Always deny and guide to hotline
        return res.status(403).json({
            message: `Đối tác không được hủy công việc sau khi đã nhận. Vui lòng liên hệ ${SUPPORT_CONTACT.phone} để được hỗ trợ.`,
            contact: SUPPORT_CONTACT,
        });
    } catch (err) {
        console.error('requestCancelJob error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
