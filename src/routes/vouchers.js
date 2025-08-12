const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');

// Customer voucher 
router.get('/vouchers', voucherController.getVouchers);

module.exports = router;
