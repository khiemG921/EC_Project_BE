const Customer = require('../models/customer');
const Tasker = require('../models/tasker');
const sequelize = require('../config/db');
const { updateUserClaims } = require('../config/firebase');

// Tạo đơn đăng ký làm tasker
const createTaskerApplication = async (req, res) => {
    try {
        const { skills } = req.body;
        const firebase_id = req.user.uid;

        // Tìm customer
        const customer = await Customer.findOne({
            where: { firebase_id }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        // Kiểm tra xem đã có đơn đăng ký pending chưa
        if (customer.tasker_application_status === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã có đơn đăng ký đang chờ xét duyệt'
            });
        }

        // Cập nhật trạng thái đăng ký
        await customer.update({
            tasker_application_status: 'pending',
            tasker_skills: skills.trim(),
            tasker_application_date: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Đơn đăng ký đã được gửi thành công',
            data: {
                id: customer.customer_id,
                firebase_id: customer.firebase_id,
                name: customer.name,
                email: customer.email,
                avatar_url: customer.avatar_url,
                skills: skills.trim(),
                application_date: customer.tasker_application_date,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Error creating tasker application:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đơn đăng ký'
        });
    }
};

// Lấy danh sách đơn đăng ký (admin) - từ bảng customer
const getTaskerApplications = async (req, res) => {
    try {
        const { status, search } = req.query;
        
        let whereCondition = {};
        
        // Filter theo status nếu có
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            whereCondition.tasker_application_status = status;
        } else {
            // Nếu không có status, lấy tất cả trừ 'none'
            const { Op } = require('sequelize');
            whereCondition.tasker_application_status = {
                [Op.ne]: 'none'
            };
        }

        // Filter theo search nếu có
        if (search) {
            const { Op } = require('sequelize');
            whereCondition[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const customers = await Customer.findAll({
            where: whereCondition,
            order: [['tasker_application_date', 'DESC']]
        });

        // Transform data để match interface TaskerApplication
        const applications = customers.map(customer => ({
            id: customer.customer_id.toString(),
            firebase_id: customer.firebase_id,
            name: customer.name,
            email: customer.email,
            avatar_url: customer.avatar_url,
            skills: customer.tasker_skills,
            application_date: customer.tasker_application_date,
            status: customer.tasker_application_status
        }));

        res.json({
            success: true,
            data: applications
        });
    } catch (error) {
        console.error('Error getting tasker applications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đơn đăng ký'
        });
    }
};

// Duyệt đơn đăng ký (admin)
const approveTaskerApplication = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm customer theo customer_id
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đăng ký'
            });
        }

        if (customer.tasker_application_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Đơn đăng ký đã được xử lý trước đó'
            });
        }

        if (!customer.firebase_id) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản này thiếu thông tin firebase_id'
            });
        }

        // Kiểm tra xem đã là tasker chưa
        const existingTasker = await Tasker.findOne({
            where: { firebase_id: customer.firebase_id },
            attributes: ['tasker_id']
        });

        if (existingTasker) {
            return res.status(400).json({
                success: false,
                message: 'User đã là tasker rồi'
            });
        }

        // Fallback an toàn cho name/skills
        const safeName = customer.name && customer.name.trim()
          ? customer.name.trim()
          : (customer.email ? String(customer.email).split('@')[0] : `Tasker ${customer.customer_id}`);
        const safeSkills = customer.tasker_skills && String(customer.tasker_skills).trim() !== ''
          ? String(customer.tasker_skills).trim()
          : null;

        // Ghi DB trong transaction 
        await sequelize.transaction(async (t) => {
                        await Tasker.create(
                            {
                                firebase_id: customer.firebase_id,
                                name: safeName,
                                avatar_url: customer.avatar_url || null,
                                skills: safeSkills,
                                job_completed: 0,
                                rating: 0,
                                ranking: 'bronze',
                                active: true,
                            },
                            {
                                transaction: t,
                                fields: [
                                    'firebase_id',
                                    'name',
                                    'avatar_url',
                                    'skills',
                                    'job_completed',
                                    'rating',
                                    'ranking',
                                    'active',
                                ],
                            }
                        );

            await customer.update({
                tasker_application_status: 'approved'
            }, { transaction: t });
        });

        // Cập nhật Firebase custom claims 
        try {
            await updateUserClaims(customer.firebase_id, { roles: ['customer', 'tasker'] });
        } catch (firebaseError) {
            console.error('Error updating Firebase claims:', firebaseError);
        }

        res.json({
            success: true,
            message: 'Đã duyệt đơn đăng ký thành công'
        });
    } catch (error) {
        console.error('Error approving tasker application:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi duyệt đơn đăng ký'
        });
    }
};

// Từ chối đơn đăng ký (admin)
const rejectTaskerApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đăng ký'
            });
        }

        if (customer.tasker_application_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Đơn đăng ký đã được xử lý trước đó'
            });
        }

        await customer.update({ 
            tasker_application_status: 'rejected' 
        });


        res.json({
            success: true,
            message: 'Đã từ chối đơn đăng ký'
        });
    } catch (error) {
        console.error('Error rejecting tasker application:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi từ chối đơn đăng ký'
        });
    }
};

// Kiểm tra trạng thái đơn đăng ký của user
const getMyApplicationStatus = async (req, res) => {
    try {
        const firebase_id = req.user.uid;

        const customer = await Customer.findOne({
            where: { firebase_id }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        // Chỉ trả về data nếu có application
        if (customer.tasker_application_status === 'none') {
            return res.json({
                success: true,
                data: null
            });
        }

        const applicationData = {
            id: customer.customer_id.toString(),
            firebase_id: customer.firebase_id,
            name: customer.name,
            email: customer.email,
            avatar_url: customer.avatar_url,
            skills: customer.tasker_skills,
            application_date: customer.tasker_application_date,
            status: customer.tasker_application_status
        };

        res.json({
            success: true,
            data: applicationData
        });
    } catch (error) {
        console.error('Error getting application status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra trạng thái đăng ký'
        });
    }
};

module.exports = {
    createTaskerApplication,
    getTaskerApplications,
    approveTaskerApplication,
    rejectTaskerApplication,
    getMyApplicationStatus
};