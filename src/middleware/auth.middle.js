const admin = require("../config/firebase");

/**
 * Middleware để verify JWT token từ Firebase
 */
async function verifyToken(req, res, next) {
  console.log("=== AUTH MIDDLEWARE ===");
  
  // Lấy token từ cookie hoặc Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  console.log("Token source:", req.cookies.token ? "Cookie" : req.headers.authorization ? "Header" : "None");
  console.log("Authorization header:", req.headers.authorization);
  console.log("Token value:", token ? token.substring(0, 20) + '...' : 'Empty');

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("Token verified for user:", {
      uid: decoded.uid,
      email: decoded.email,
      roles: decoded.roles
    });

    // Gắn user info vào request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles: decoded.roles || ["customer"], // Lấy roles từ custom claims
    };

    console.log("User authenticated:", req.user.email, "Roles:", req.user.roles);
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(403).json({ message: "Token không hợp lệ" });
  }
}

/**
 * Middleware để kiểm tra quyền admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  next();
}

const authenticateToken = verifyToken;

module.exports = verifyToken;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;