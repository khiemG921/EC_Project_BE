const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middle');
const { getAllCustomers, updateFavoriteServices, addRefundToCleanPay, getAmountCleanPay, subtractAmountCleanPay } = require('../controllers/customer.controller');

// GET /api/customers - Lấy danh sách tất cả khách hàng
router.get('/customers', getAllCustomers);

// POST /api/customer/favorite_services - Cập nhật dịch vụ yêu thích
router.post('/customer/favorite_services', updateFavoriteServices);

// GET /api/customers/reward-points - Lấy số điểm thưởng của khách hàng
router.get('/customer/reward-points', verifyToken, getAmountCleanPay);

// POST /api/customer/refund - Xử lý yêu cầu hoàn tiền
router.post('/customer/refund', verifyToken, addRefundToCleanPay);

// POST /api/customer/substract-cleanpay - Xử lý yêu cầu trừ tiền từ ví CleanPay
router.post('/customer/substract-cleanpay', verifyToken, subtractAmountCleanPay);

module.exports = router;