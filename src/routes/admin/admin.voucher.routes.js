const express = require('express');
const router = express.Router();
const adminVoucherController = require('../../controllers/admin/admin.voucher.controller');
const { adminOnly } = require('../../middleware/auth.middle');

// ============== ADMIN VOUCHER ENDPOINTS ==============

// Debug endpoints chỉ bật khi NODE_ENV !== 'production'
if (process.env.NODE_ENV !== 'production') {
  router.get('/ping', (req, res) => {
    res.json({
      success: true,
      message: 'Admin voucher routes are working',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  router.get('/debug', async (req, res) => {
    try {
      res.json({ success: true, message: 'Debug vouchers endpoint' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/debug-stats', async (req, res) => {
    try {
      res.json({ success: true, message: 'Debug stats endpoint' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Áp dụng bảo vệ admin cho tất cả endpoint còn lại
router.use(adminOnly);

router.get('/', adminVoucherController.getAllVouchers);
router.get('/stats', adminVoucherController.getVoucherStats);
router.get('/search', adminVoucherController.searchVouchers);
router.post('/', adminVoucherController.createVoucher);
router.put('/:voucher_code', adminVoucherController.updateVoucher);
router.delete('/:voucher_code', adminVoucherController.deleteVoucher);

module.exports = router;
