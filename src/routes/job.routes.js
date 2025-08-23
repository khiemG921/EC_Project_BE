const express = require('express');
const router = express.Router();
const {verifyToken} = require('../middleware/auth.middle');  // hoặc verifyToken
const { createJob, loadJobs, cancelJob } = require('../controllers/job.controller');

router.post('/job/create', verifyToken, createJob);
router.get('/job/load', verifyToken, loadJobs);
router.post('/job/cancel/:id', verifyToken, cancelJob);

module.exports = router;