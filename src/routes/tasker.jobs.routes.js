const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middle').verifyToken;
const { listJobsByCity, acceptJob, getJobDetail, getTaskerRegulations, requestCancelJob } = require('../controllers/tasker.jobs.controller');

router.use(verifyToken);

// Only taskers can access; controller re-checks role via Tasker model
router.get('/jobs', listJobsByCity); // /api/tasker/jobs?city=hcm
router.post('/jobs/:jobId/accept', acceptJob);
router.get('/jobs/:jobId', getJobDetail);
router.get('/regulations', getTaskerRegulations);
router.post('/jobs/:jobId/cancel', requestCancelJob);

module.exports = router;
