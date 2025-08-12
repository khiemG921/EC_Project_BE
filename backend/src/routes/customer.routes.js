const express = require('express');
const router = express.Router();
const { getAllCustomers, updateFavoriteServices, addRefundToCleanPay } = require('../controllers/customer.controller');

// GET /api/customers - Lấy danh sách tất cả khách hàng
router.get('/customers', getAllCustomers);

// POST /api/customer/favorite_services - Cập nhật dịch vụ yêu thích
router.post('/customer/favorite_services', updateFavoriteServices);

// POST /api/customer/refund - Xử lý yêu cầu hoàn tiền
router.post('/customer/refund', addRefundToCleanPay);

module.exports = router;