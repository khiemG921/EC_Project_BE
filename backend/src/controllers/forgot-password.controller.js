const crypto = require('crypto');
const codeStore = new Map(); // { email: { code, expires, verified, token } }
const transporter = require('../config/nodemailer');
const admin = require("../config/firebase");

// Gửi mã xác thực về email
async function sendResetCode(req, res) {
  const { email } = req.body;
  console.log('[ForgotPassword] Received request to send reset code for email:', email);
  if (!email) return res.status(400).json({ message: "Email là bắt buộc" });
  // Sinh code 6 số
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 120 * 1000; // 2 phút
  codeStore.set(email, { code, expires, verified: false });
  console.log(`[ForgotPassword] Generated code: ${code}, expires at: ${new Date(expires).toISOString()}`);
  console.log('[ForgotPassword] Transporter config:', transporter.options || transporter);
  try {
    const info = await transporter.sendMail({
      from: `"EC App" <${process.env.AUTH_USER}>`,
      to: email,
      subject: 'EC App - Mã xác thực đặt lại mật khẩu',
      html: `
        <div style="max-width:480px;margin:auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <div style="background:#e53935;padding:24px 0;text-align:center;">
            <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Mail" width="48" style="margin-bottom:8px;" />
          </div>
          <div style="padding:32px 24px 24px 24px;">
            <h2 style="color:#e53935;text-align:center;margin-bottom:16px;">Xác thực đặt lại mật khẩu</h2>
            <p style="font-size:16px;text-align:center;margin-bottom:24px;">
              Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản EC App.<br>
              Vui lòng sử dụng mã bên dưới để tiếp tục. Mã có hiệu lực trong <b>2 phút</b>.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:#e53935;color:#fff;font-size:2rem;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;">
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
    console.log('[ForgotPassword] Email sent:', info);
    res.json({ message: "Đã gửi mã xác thực về email." });
  } catch (err) {
    console.error('[ForgotPassword] Error sending email:', err);
    res.status(500).json({ message: "Không thể gửi email xác thực." });
  }
}

// Xác thực code
async function verifyResetCode(req, res) {
  const { email, code } = req.body;
  const entry = codeStore.get(email);
  if (!entry || entry.code !== code) return res.status(400).json({ message: "Mã xác thực không đúng." });
  if (Date.now() > entry.expires) return res.status(400).json({ message: "Mã đã hết hạn." });

  // Sinh token tạm thời (random string)
  const token = crypto.randomBytes(32).toString('hex');
  codeStore.set(email, { ...entry, verified: true, token });
  res.json({ token });
}

// Đổi mật khẩu
async function resetPassword(req, res) {
  const { email, token, password } = req.body;
  const entry = codeStore.get(email);
  if (!entry || !entry.verified || entry.token !== token) return res.status(400).json({ message: "Token không hợp lệ." });
  try {
    // Tìm user theo email
    const user = (await admin.auth().getUserByEmail(email));
    await admin.auth().updateUser(user.uid, { password });
    codeStore.delete(email);
    res.json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Không thể đổi mật khẩu." });
  }
}

module.exports = {sendResetCode, verifyResetCode, resetPassword}