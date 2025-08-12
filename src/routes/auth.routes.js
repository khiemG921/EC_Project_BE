const express = require("express");
const admin = require("../config/firebase");
const router = express.Router();

const { 
  registerUser, 
  verifyRegisterCode, 
  completeRegistration, 
  becomeTasker, 
  verifyUserToken, 
  googleRegisterUser, 
  syncFirebaseUsers 
} = require("../controllers/auth.controller");
// Xác thực mã xác thực đăng ký
router.post("/verify-register-code", verifyRegisterCode);

// Đăng ký và gán role mặc định
router.post("/register", registerUser);

// Hoàn tất đăng ký sau khi client SDK tạo user
router.post("/complete-registration", completeRegistration);

// Đăng ký cho Google users
router.post("/google-register", googleRegisterUser);

// Sync Firebase users to database
router.post("/sync-user", syncFirebaseUsers);

// Nâng cấp lên tasker
router.post("/become-tasker", becomeTasker);

// Verify token và lấy thông tin user
router.get("/verify", verifyUserToken);

// Lưu idToken vào cookie
router.post("/session", (req, res) => {
  const { idToken } = req.body;
  console.log("[DEBUG] Backend received idToken:", idToken);
  console.log("Received idToken for session:", idToken ? "Token received" : "No token");

  res.cookie("token", idToken, {
    httpOnly: true,
    secure: false, // Đặt false cho localhost
    sameSite: "lax",
    maxAge: 60 * 60 * 1000, // 1 giờ
  });

  res.json({ message: "Đã lưu cookie" });
});

// Xóa session (logout)
router.delete("/session", (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.json({ message: "Đã đăng xuất" });
});

module.exports = router;