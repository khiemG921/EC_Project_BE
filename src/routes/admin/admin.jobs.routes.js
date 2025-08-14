const express = require('express');
const router = express.Router();
const {loadAllJobs} = require('../../controllers/admin/admin.jobs.controller');

router.get('/', loadAllJobs);

module.exports = router;