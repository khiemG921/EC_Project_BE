const express = require('express');
const verifySession = require('../middleware/auth.middle').verifyToken; // hoặc verifyToken
const { createPaypalOrder, capturePaypalOrder, createMoMoOrder, createZaloPayOrder } = require('../controllers/payment.controller');

const router = express.Router();
router.post('/payment/paypal/create-order', verifySession, createPaypalOrder);
router.post('/payment/paypal/capture-order', verifySession, capturePaypalOrder);

router.post('/payment/momo/create-order', verifySession, createMoMoOrder);

router.post('/payment/zalo/create-order', verifySession, createZaloPayOrder);

module.exports = router;