const express = require('express');
const router = express.Router();
const {verifyToken} = require('../middleware/auth.middle');  // hoặc verifyToken
const { createJob, loadJobs, cancelJob, countPendingJobsCustomer } = require('../controllers/job.controller');

router.post('/job/create', verifyToken, createJob);
router.get('/job/load', verifyToken, loadJobs);
router.post('/job/cancel/:id', verifyToken, cancelJob);
router.get('/job/customer/count-pending', verifyToken, countPendingJobsCustomer);

module.exports = router;