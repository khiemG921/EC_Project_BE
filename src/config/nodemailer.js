const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.AUTH_USER, pass: process.env.AUTH_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('SMTP verify: OK — credentials + network reachable');
  } catch (err) {
    console.error('SMTP verify failed:', err);
    process.exit(1);
  }
}

main();