const express = require('express');
const router = express.Router();
const adminVoucherController = require('../../controllers/admin/admin.voucher.controller');

// ============== ADMIN VOUCHER ENDPOINTS ==============

// Test endpoint - để debug
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Admin voucher routes are working (NO AUTH REQUIRED)',
    timestamp: new Date().toISOString(),
    note: 'Mock admin access - authentication bypassed'
  });
});

// Test vouchers endpoint - no auth required
router.get('/debug', async (req, res) => {
  try {
    // ...debug logic here...
    res.json({ success: true, message: 'Debug vouchers endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/debug-stats', async (req, res) => {
  try {
    // ...debug stats logic here...
    res.json({ success: true, message: 'Debug stats endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', adminVoucherController.getAllVouchers);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mock admin access - NO AUTH REQUIRED',
    mockUser: {
      email: 'admin@mock.com',
      roles: ['admin'],
      uid: 'mock-admin-123'
    },
    timestamp: new Date().toISOString()
  });
});

// Stats: GET /api/admin/vouchers/stats
router.get('/stats', adminVoucherController.getVoucherStats);

// Search: GET /api/admin/vouchers/search?query=...
router.get('/search', adminVoucherController.searchVouchers);

// Create: POST /api/admin/vouchers
router.post('/', adminVoucherController.createVoucher);

// Update: PUT /api/admin/vouchers/:voucher_code
router.put('/:voucher_code', adminVoucherController.updateVoucher);

// Delete: DELETE /api/admin/vouchers/:voucher_code
router.delete('/:voucher_code', adminVoucherController.deleteVoucher);

module.exports = router;
