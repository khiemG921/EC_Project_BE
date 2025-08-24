const express = require('express');
const verifySession = require('../middleware/auth.middle').verifyToken; // hoặc verifyToken
const { createPaypalOrder, capturePaypalOrder, createMoMoOrder, createZaloPayOrder } = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth.middle');

const router = express.Router();
router.post('/payment/paypal/create-order', verifyToken, createPaypalOrder);
router.post('/payment/paypal/capture-order', verifyToken, capturePaypalOrder);

router.post('/payment/momo/create-order', verifyToken, createMoMoOrder);

router.post('/payment/zalo/create-order', verifyToken, createZaloPayOrder);

module.exports = router;