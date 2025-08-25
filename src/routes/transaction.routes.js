const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth.middle');
const { createTransaction } = require('../controllers/transaction.controller');

router.post('/transaction/create', verifyToken, createTransaction);

module.exports = router;