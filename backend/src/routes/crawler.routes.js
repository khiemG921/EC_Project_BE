const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/crawler.controller');
const cronKey = require('../middleware/cronKey');

router.get('/status', ctrl.getStatus);
router.put('/config', cronKey, ctrl.updateConfig);
router.post('/run', cronKey, ctrl.runNow);
router.get('/download/:file', ctrl.downloadCsv);

module.exports = router;
