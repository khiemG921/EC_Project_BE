const express = require("express");
const admin = require("../config/firebase");
const Customer = require("../models/customer");
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
router.post("/session", async (req, res) => {
  const { idToken } = req.body;
  console.log("[DEBUG] Backend received idToken:", idToken);
  console.log("Received idToken for session:", idToken ? "Token received" : "No token");

  res.cookie("token", idToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 60 * 60 * 1000, // 1 giờ
  });

  // Cập nhật trạng thái active = true khi tạo session
  try {
    if (idToken) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      await Customer.update({ active: true }, { where: { firebase_id: uid } });
      console.log(`[AUTH] Marked customer ${uid} as active`);
    }
  } catch (e) {
    console.error("[AUTH] Failed to mark active on session create:", e?.message || e);
  }

  res.json({ message: "Đã lưu cookie" });
});

// Xóa session (logout)
router.delete("/session", async (req, res) => {
  // Lấy token hiện có (trước khi xóa) để xác định người dùng
  const headerToken = req.headers.authorization?.split(' ')[1];
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  // Đánh dấu active = false
  try {
    if (token) {
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;
      await Customer.update({ active: false }, { where: { firebase_id: uid } });
      console.log(`[AUTH] Marked customer ${uid} as inactive`);
    }
  } catch (e) {
    console.error("[AUTH] Failed to mark inactive on session delete:", e?.message || e);
  }

  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 0,
  });
  res.json({ message: "Đã đăng xuất" });
});

module.exports = router;