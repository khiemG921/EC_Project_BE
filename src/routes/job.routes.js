const express = require('express');
const router = express.Router();
const verifySession = require('../middleware/auth.middle').verifyToken;  // hoặc verifyToken
const { createJob, loadJobs, cancelJob } = require('../controllers/job.controller');

router.post('/job/create', verifySession, createJob);
router.get('/job/load', verifySession, loadJobs);
router.post('/job/cancel/:id', verifySession, cancelJob);

module.exports = router;