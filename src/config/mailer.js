const nodemailer = require('nodemailer');
let sendgridClient = null;
let useSendGrid = false;

if (process.env.SENDGRID_API_KEY) {
  try {
    sendgridClient = require('@sendgrid/mail');
    sendgridClient.setApiKey(process.env.SENDGRID_API_KEY);
    useSendGrid = true;
    console.log('[MAILER] Using SendGrid transport');
  } catch (e) {
    console.warn('[MAILER] SendGrid package not installed or failed to initialize, falling back to SMTP');
    useSendGrid = false;
  }
}

// Create nodemailer transporter when needed
let smtpTransporter = null;
function createSmtpTransport() {
  if (smtpTransporter) return smtpTransporter;
  smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.AUTH_USER, pass: process.env.AUTH_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  // do not exit process here; allow app to run and return errors when sending
  smtpTransporter.verify().then(() => {
    console.log('[MAILER] SMTP transporter verified');
  }).catch((err) => {
    console.warn('[MAILER] SMTP transporter verify failed:', err && err.code ? err.code : err);
  });
  return smtpTransporter;
}

async function sendMail({ from, to, subject, text, html }) {
  if (useSendGrid && sendgridClient) {
    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM || process.env.AUTH_USER,
      subject,
      text,
      html,
    };
    return sendgridClient.send(msg);
  }

  const transporter = createSmtpTransport();
  return transporter.sendMail({ from: from || `"EC App" <${process.env.AUTH_USER}>`, to, subject, text, html });
}

module.exports = { sendMail };
