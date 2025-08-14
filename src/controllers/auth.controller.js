const admin = require("../config/firebase");
const Customer = require("../models/customer");
const transporter = require("../config/nodemailer");
const crypto = require("crypto");

// Simple in-memory store for verification codes (email: { code, expires, verified })
const codeStore = new Map();

const registerUser = async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    // 1. Tạo user trên Firebase
    const user = await admin.auth().createUser({ email, password });
    // 2. Set role mặc định là "customer"
    await admin.auth().setCustomUserClaims(user.uid, { role: "customer" });

    // 3. Sinh mã xác thực 6 số
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 120 * 1000; // 2 phút
    codeStore.set(email, { code, expires, verified: false, name, phone });

    // 4. Gửi email mã xác thực
    console.log("Sending email with config:", {
      user: process.env.AUTH_USER,
      pass: process.env.AUTH_PASS ? "***SET***" : "NOT_SET"
    });
    
    await transporter.sendMail({
      from: `"EC App" <${process.env.AUTH_USER}>`,
      to: email,
      subject: "EC App - Mã xác thực đăng ký tài khoản",
      html: `
        <div style="max-width:480px;margin:auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <div style="background:#009688;padding:24px 0;text-align:center;">
            <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Mail" width="48" style="margin-bottom:8px;" />
          </div>
          <div style="padding:32px 24px 24px 24px;">
            <h2 style="color:#009688;text-align:center;margin-bottom:16px;">Xác thực đăng ký tài khoản</h2>
            <p style="font-size:16px;text-align:center;margin-bottom:24px;">
              Cảm ơn bạn đã đăng ký tài khoản EC App.<br>
              Vui lòng sử dụng mã bên dưới để xác thực email. Mã có hiệu lực trong <b>2 phút</b>.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:#009688;color:#fff;font-size:2rem;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;">
                ${code}
              </span>
            </div>
            <p style="font-size:14px;color:#888;text-align:center;">
              Nếu bạn không đăng ký, vui lòng bỏ qua email này.<br>
              <b>Đội ngũ EC App</b>
            </p>
          </div>
        </div>
      `
    });

    res.json({
      uid: user.uid,
      message: "Đăng ký thành công. Đã gửi mã xác thực về email.",
      needVerify: true
    });
    console.log("User registered successfully:", user.uid);
    console.log("Verification code sent to:", email, code);
  } catch (err) {
    console.error("Registration error:", err);
    
    // Nếu Firebase user đã tồn tại, vẫn gửi OTP để xác thực
    if (err.code === 'auth/email-already-exists') {
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        console.log("Email already exists, sending OTP for verification:", email);
        
        // Sinh mã xác thực 6 số cho user đã tồn tại
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 120 * 1000; // 2 phút
        codeStore.set(email, { code, expires, verified: false, name, phone, existingUid: existingUser.uid });

        // Gửi email mã xác thực
        console.log("Sending OTP email for existing user:", {
          user: process.env.AUTH_USER,
          pass: process.env.AUTH_PASS ? "***SET***" : "NOT_SET"
        });
        
        await transporter.sendMail({
          from: `"EC App" <${process.env.AUTH_USER}>`,
          to: email,
          subject: "EC App - Mã xác thực đăng nhập",
          html: `
            <div style="max-width:480px;margin:auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;">
              <div style="background:#009688;padding:24px 0;text-align:center;">
                <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Mail" width="48" style="margin-bottom:8px;" />
              </div>
              <div style="padding:32px 24px 24px 24px;">
                <h2 style="color:#009688;text-align:center;margin-bottom:16px;">Xác thực tài khoản</h2>
                <p style="font-size:16px;text-align:center;margin-bottom:24px;">
                  Email này đã được đăng ký trước đó.<br>
                  Vui lòng sử dụng mã bên dưới để xác thực và hoàn tất đăng nhập. Mã có hiệu lực trong <b>2 phút</b>.
                </p>
                <div style="text-align:center;margin-bottom:24px;">
                  <span style="display:inline-block;background:#009688;color:#fff;font-size:2rem;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;">
                    ${code}
                  </span>
                </div>
                <p style="font-size:14px;color:#888;text-align:center;">
                  Nếu bạn không yêu cầu, vui lòng bỏ qua email này.<br>
                  <b>Đội ngũ EC App</b>
                </p>
              </div>
            </div>
          `
        });

        return res.json({
          uid: existingUser.uid,
          message: "Email đã tồn tại. Đã gửi mã xác thực để hoàn tất đăng nhập.",
          needVerify: true,
          isExistingUser: true
        });
      } catch (syncError) {
        console.error("Sync error:", syncError);
      }
    }
    
    res.status(500).json({ 
      error: "Đăng ký thất bại", 
      details: err.message 
    });
  }
};

// API xác thực mã (verify code)
const verifyRegisterCode = async (req, res) => {
  const { email, code } = req.body;
  const entry = codeStore.get(email);
  
  if (!entry || entry.code !== code) {
    return res.status(400).json({ message: "Mã xác thực không đúng." });
  }
  
  if (Date.now() > entry.expires) {
    return res.status(400).json({ message: "Mã đã hết hạn." });
  }

  try {
    // Lấy Firebase user
    const firebaseUser = await admin.auth().getUserByEmail(email);
    
    // Kiểm tra xem customer record đã tồn tại chưa
    let customer = await Customer.findOne({
      where: { firebase_id: firebaseUser.uid }
    });

    if (!customer) {
      // Tạo customer record từ thông tin đã lưu hoặc Firebase
      const customerData = {
        firebase_id: firebaseUser.uid,
        name: entry.name || firebaseUser.displayName || email.split('@')[0] || 'Người dùng',
        email: email,
        phone: entry.phone || null,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name || firebaseUser.displayName || email.split('@')[0])}&background=14b8a6&color=fff`,
      };
      
      customer = await Customer.create(customerData);
      console.log("Customer record created after verification:", customer.customer_id);
    } else {
      // Customer đã tồn tại, có thể cập nhật thông tin nếu cần
      console.log("Customer already exists:", customer.customer_id);
      
      // Cập nhật thông tin nếu có name hoặc phone mới
      if (entry.name && entry.name !== customer.name) {
        customer.name = entry.name;
      }
      if (entry.phone && entry.phone !== customer.phone) {
        customer.phone = entry.phone;
      }
      await customer.save();
    }

    // Mark as verified and cleanup
    codeStore.delete(email);
    
    res.json({ 
      message: "Xác thực thành công.",
      customer_id: customer.customer_id,
      uid: firebaseUser.uid,
      isExistingUser: !!entry.existingUid
    });
  } catch (error) {
    console.error("Error during verification:", error);
    res.status(500).json({ message: "Lỗi xác thực" });
  }
};
const becomeTasker = async (req, res) => {
  const { uid } = req.body;

  try {
    const userRecord = await admin.auth().getUser(uid);
    let roles = [];
    if (userRecord.customClaims && Array.isArray(userRecord.customClaims.roles)) {
      roles = userRecord.customClaims.roles;
    }

    if (!roles.includes('tasker')) {
      roles.push('tasker');
    }

    await admin.auth().setCustomUserClaims(uid, {
      roles
    });

    res.json({
      message: "Đã trở thành tasker",
      roles: roles
    });
  } catch (err) {
    console.error("Become tasker error:", err);
    res.status(500).json({ error: "Không thể cập nhật vai trò" });
  }
};

// Verify token và trả về thông tin user đầy đủ
const verifyUserToken = async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  console.log('Verify token request:', {
    hasCookieToken: !!req.cookies.token,
    hasHeaderToken: !!req.headers.authorization,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'null'
  });

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token decoded successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      customClaims: decodedToken
    });
    
    // Lấy thông tin customer từ database
    const customer = await Customer.findOne({
      where: { firebase_id: decodedToken.uid }
    });

    if (!customer) {
      console.log('Customer not found in database for uid:', decodedToken.uid);
      return res.status(404).json({ error: "Customer not found", uid: decodedToken.uid });
    }

    console.log('Customer found:', {
      id: customer.customer_id,
      name: customer.name,
      email: customer.email
    });

    // Xử lý roles: ưu tiên customClaims.roles (array), fallback role (string), mặc định ['customer']
    let roles = ['customer'];
    if (Array.isArray(decodedToken.roles)) {
      roles = decodedToken.roles;
    } else if (typeof decodedToken.role === 'string') {
      roles = [decodedToken.role];
    }

    res.json({
      valid: true,
      user: {
        id: customer.customer_id.toString(),
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar_url,
        roles,
        firebase_id: decodedToken.uid,
        phone: customer.phone,
        reward_points: customer.reward_points,
        ranking: customer.ranking
      }
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ valid: false, error: "Invalid token", details: error.message });
  }
};

// Google register - cho user đã tồn tại trong Firebase nhưng chưa có trong database
const googleRegisterUser = async (req, res) => {
  const { email, name, avatar, firebaseId } = req.body;

  try {
    // Kiểm tra xem user đã tồn tại trong database chưa
    let customer = await Customer.findOne({
      where: { firebase_id: firebaseId }
    });

    if (customer) {
      // User đã tồn tại, trả về thông tin
      return res.json({
        customer_id: customer.customer_id,
        message: "User đã tồn tại"
      });
    }

    // Tạo record mới trong database cho Google user
    customer = await Customer.create({
      firebase_id: firebaseId,
      name: name || 'Google User',
      email: email,
      phone: '', // Google không cung cấp phone
      avatar_url: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=14b8a6&color=fff`,
    });

    res.json({
      customer_id: customer.customer_id,
      message: "Đăng ký Google thành công"
    });
    console.log("Google user registered:", customer.customer_id);
  } catch (err) {
    console.error("Google registration error:", err);
    res.status(500).json({ error: "Đăng ký Google thất bại" });
  }
};

// Sync Firebase users to database (utility function)
const syncFirebaseUsers = async (req, res) => {
  try {
    // Lấy thông tin từ token hiện tại
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Kiểm tra xem user này đã có customer record chưa
    let customer = await Customer.findOne({
      where: { firebase_id: decodedToken.uid }
    });

    if (!customer) {
      // Tạo customer record từ Firebase user info
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);
      
      customer = await Customer.create({
        firebase_id: decodedToken.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Người dùng',
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || null,
        avatar_url: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=14b8a6&color=fff`,
      });

      console.log("Synced Firebase user to database:", {
        firebase_uid: decodedToken.uid,
        customer_id: customer.customer_id
      });
    }

    res.json({
      success: true,
      customer_id: customer.customer_id,
      message: "User synced successfully"
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Sync failed", details: error.message });
  }
};

// Hoàn tất registration sau khi Firebase client đã tạo user
const completeRegistration = async (req, res) => {
  const { firebaseUid, email, name, phone } = req.body;
  
  try {
    console.log('Completing registration for Firebase user:', firebaseUid);
    
    // Verify ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Firebase token verified for user:', decodedToken.uid);
      
      // Make sure the UID matches
      if (decodedToken.uid !== firebaseUid) {
        return res.status(400).json({ error: 'Firebase UID mismatch' });
      }
      
      // Set role mặc định using the verified token
      await admin.auth().setCustomUserClaims(decodedToken.uid, {
        roles: ["customer"]
      });
      
      console.log('Custom claims set successfully');
      
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Invalid Firebase token' });
    }
    
    // Tạo record trong database
    const customerData = {
      firebase_id: firebaseUid,
      name: name || email.split('@')[0] || 'Người dùng',
      email: email,
      phone: phone && phone.trim() !== '' ? phone : null,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=14b8a6&color=fff`,
    };

    const customer = await Customer.create(customerData);

    res.json({
      uid: firebaseUid,
      customer_id: customer.customer_id,
      message: "Đăng ký thành công"
    });
    
    console.log("Registration completed successfully:", {
      firebase_uid: firebaseUid,
      customer_id: customer.customer_id,
      email: email,
      name: customerData.name
    });
  } catch (err) {
    console.error("Complete registration error:", err);
    res.status(500).json({ 
      error: "Không thể hoàn tất đăng ký", 
      details: err.message 
    });
  }
};

module.exports = { 
  registerUser, 
  verifyRegisterCode, 
  completeRegistration, 
  becomeTasker, 
  verifyUserToken, 
  googleRegisterUser, 
  syncFirebaseUsers 
};
