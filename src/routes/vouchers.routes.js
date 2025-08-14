const express = require('express');
const router = express.Router();
const {getVouchers, getVoucherStats, getVoucherSummary} = require('../controllers/voucher.controller');

// Customer voucher 
router.get('/', getVouchers);
router.get('/stats', getVoucherStats);
router.get('/summary', getVoucherSummary);

module.exports = router;
