const express = require('express');
const router = express.Router();
const { getPriceList } = require('../controllers/price_list.controller');

router.post('/booking/price_list', getPriceList);

module.exports = router;