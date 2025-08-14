const express = require("express");
const router = express.Router();
const verifyToken = require('../middleware/auth.middle').verifyToken;

router.get("/", verifyToken, (req, res) => {
  user = req.user;
  res.json({
    uid: user.uid,
    email: user.email,
    role: user.role,
  });
});

module.exports = router;