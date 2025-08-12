const express = require('express');
const router = express.Router();
const { checkoutHourly, checkoutPeriodic, checkoutACCleaning, checkoutUpholstery, checkoutBusinessCleaning } = require('../controllers/checkout.controller');

// Endpoint cho "Giúp Việc Ca Lẻ"
router.post('/booking/hourly/checkout', checkoutHourly);

// Endpoint cho "Dọn Dẹp Định Kỳ"
router.post('/booking/periodic/checkout', checkoutPeriodic);

// Endpoint cho "Vệ sinh Máy Lạnh"
router.post('/booking/ac-cleaning/checkout', checkoutACCleaning);

// Endpoint cho "Vệ sinh Sofa, Đệm, Rèm, Thảm"
router.post('/booking/upholstery/checkout', checkoutUpholstery);

// Endpoint cho "Dọn Dẹp Doanh Nghiệp"
router.post('/booking/business-cleaning/checkout', checkoutBusinessCleaning);

module.exports = router;