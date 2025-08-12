const express = require('express');
const router  = express.Router();
const verifySession      = require('../middleware/auth.middle');
const { createTransaction } = require('../controllers/transaction.controller');

router.post('/transaction/create', verifySession, createTransaction);

module.exports = router;