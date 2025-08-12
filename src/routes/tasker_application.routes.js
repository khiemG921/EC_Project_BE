const express = require('express');
const router = express.Router();
const {
    createTaskerApplication,
    getTaskerApplications,
    approveTaskerApplication,
    rejectTaskerApplication,
    getMyApplicationStatus
} = require('../controllers/tasker_application.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middle');

// Routes cho customer
router.post('/apply', authenticateToken, createTaskerApplication);
router.get('/my-status', authenticateToken, getMyApplicationStatus);

// Routes cho admin - tạm thời bỏ requireAdmin để test
router.get('/', getTaskerApplications);  // Bỏ auth tạm thời
router.put('/:id/approve', approveTaskerApplication);  // Bỏ auth tạm thời  
router.put('/:id/reject', rejectTaskerApplication);  // Bỏ auth tạm thời

module.exports = router;
