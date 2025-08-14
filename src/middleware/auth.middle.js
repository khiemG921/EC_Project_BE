const admin = require("../config/firebase");

/**
 * Middleware: xác thực Firebase ID Token
 * Gắn req.user = { uid, email, roles }
 */
async function verifyToken(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles: decoded.roles || ["customer"],
    };
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
}

/**
 * Middleware: yêu cầu user có role admin
 */
function requireAdmin(req, res, next) {
  console.log(req.user.roles)
  if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  return next();
}

/**
 * Middleware tổ hợp: xác thực + bắt buộc admin
 */
const adminOnly = [verifyToken, requireAdmin];

module.exports = {
  verifyToken,
  authenticateToken: verifyToken,
  authMiddleware: verifyToken, 
  requireAdmin,
  adminOnly,
};