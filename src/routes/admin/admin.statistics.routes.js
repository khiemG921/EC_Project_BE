const { countUsers, countServices, countJobs } = require('../../controllers/admin/admin.statistics.controller');
const { adminOnly } = require('../../middleware/auth.middle');
const express = require('express');
const router = express.Router();

router.use(adminOnly);

router.get('/countUsers', countUsers);
router.get('/countServices', countServices);
router.get('/countJobs', countJobs);

module.exports = router;