const express = require('express');
const router = express.Router();
const {verifyToken} = require('../middleware/auth.middle');  // hoặc verifyToken
const { createJob, loadJobs, jobStatus, cancelJob, countPendingJobsCustomer, completeJobTasker, confirmJobCustomer } = require('../controllers/job.controller');

router.get('/job/status/:id', jobStatus);
router.get('/job/load', verifyToken, loadJobs);
router.get('/job/customer/count-pending', verifyToken, countPendingJobsCustomer);

router.post('/job/cancel/:id', cancelJob);
router.post('/job/create', verifyToken, createJob);
router.post('/job/tasker/complete/:id', completeJobTasker);
router.post('/job/customer/confirm/:id', confirmJobCustomer);

module.exports = router;