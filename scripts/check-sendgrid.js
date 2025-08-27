// Quick script to verify SendGrid / mailer integration
// Usage:
// SENDGRID_API_KEY=... SENDGRID_TEST_TO=you@domain.com node scripts/check-sendgrid.js

const mailer = require('../src/config/mailer');

(async () => {
  const to = process.env.SENDGRID_TEST_TO || process.env.AUTH_USER;
  if (!to) {
    console.error('No recipient set. Set SENDGRID_TEST_TO or AUTH_USER.');
    process.exit(1);
  }

  try {
    console.log('Sending test mail to', to);
    await mailer.sendMail({
      to,
      subject: 'EC App - SendGrid test',
      html: `<p>This is a test message from EC Project backend at ${new Date().toISOString()}</p>`
    });
    console.log('Test mail sent (or accepted by provider)');
  } catch (err) {
    console.error('Test mail failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
