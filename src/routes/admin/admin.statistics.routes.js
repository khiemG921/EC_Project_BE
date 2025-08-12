const {countUsers, countServices, countJobs} = require('../../controllers/admin/admin.statistics.controller');

const express = require('express');
const router = express.Router();

router.get('/countUsers', countUsers);
router.get('/countServices', countServices);
router.get('/countJobs', countJobs);

module.exports = router;