const express = require("express");
const router = express.Router();

const {
  sendResetCode,
  verifyResetCode,
  resetPassword
} = require("../controllers/forgot-password.controller");

router.post("/send-reset-code", sendResetCode);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

module.exports = router;