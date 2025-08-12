const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/newsImport.controller');
const cronKey = require('../middleware/cronKey');

router.post('/import-latest', cronKey, ctrl.importLatestCsv);

module.exports = router;
