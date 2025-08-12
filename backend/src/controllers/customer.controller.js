const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

// Lấy danh sách tất cả khách hàng
const getAllCustomers = async (req, res) => {
    try {
        const customers = await sequelize.query(
            'SELECT customer_id, name, email, phone FROM customer ORDER BY name ASC',
            { type: QueryTypes.SELECT }
        );

        return res.json({
            success: true,
            data: customers,
            total: customers.length,
        });
    } catch (error) {
        console.error('❌ Lỗi get all customers:', error);
        return res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách khách hàng.',
        });
    }
};

const updateFavoriteServices = async (req, res) => {
    const { customer_id, service_name, action } = req.body;
    if (!customer_id || !service_name || !['add', 'remove'].includes(action)) {
        return res.status(400).json({ error: 'Thông tin không hợp lệ' });
    }

    try {
        // 1. Lấy chuỗi hiện tại
        const rows = await sequelize.query(
            'SELECT favorite_services FROM customer WHERE customer_id = :cid',
            {
                replacements: { cid: customer_id },
                type: QueryTypes.SELECT,
            }
        );
        const current = rows[0]?.favorite_services || '';
        // 2. Chuyển thành mảng, loại bỏ các phần tử rỗng
        const list = current.split(';').filter((s) => s.trim());
        // 3. Thêm hoặc loại bỏ
        if (action === 'add') {
            if (!list.includes(service_name)) list.push(service_name);
        } else {
            // action === 'remove'
            const idx = list.indexOf(service_name);
            if (idx !== -1) list.splice(idx, 1);
        }
        // 4. Ghép lại chuỗi
        const updated = list.join(';');
        // 5. Cập nhật vào DB
        await sequelize.query(
            'UPDATE customer SET favorite_services = :fav WHERE customer_id = :cid',
            {
                replacements: { fav: updated, cid: customer_id },
                type: QueryTypes.UPDATE,
            }
        );
        return res.json({ customer_id, favorite_services: updated });
    } catch (err) {
        console.error('❌ Lỗi update favorite_services:', err);
        return res.status(500).json({ error: 'Lỗi server.' });
    }
};

const addRefundToCleanPay = async (req, res) => {
    const { customer_id, amount } = req.body;
    if (!customer_id || !amount) {
        return res.status(400).json({ error: 'Thông tin không hợp lệ' });
    }

    try {
        // 1. Lấy thông tin khách hàng
        const row = await sequelize.query(
            'SELECT reward_points FROM customer WHERE customer_id = :cid',
            {
                replacements: { cid: customer_id },
                type: QueryTypes.SELECT,
            }
        );

        let currentRewardPoints = row?.reward_points || 0;

        // 2. Cập nhật Reward Points
        const newRewardPoints = currentRewardPoints + amount;
        await sequelize.query(
            'UPDATE customer SET reward_points = :rp WHERE customer_id = :cid',
            {
                replacements: { rp: newRewardPoints, cid: customer_id },
                type: QueryTypes.UPDATE,
            }
        );

        return res.json({ customer_id, reward_points: newRewardPoints });
    } catch (err) {
        console.error('❌ Lỗi add refund to clean pay:', err);
        return res.status(500).json({ error: 'Lỗi server.' });
    }
};

module.exports = {
    getAllCustomers,
    updateFavoriteServices,
    addRefundToCleanPay,
};
