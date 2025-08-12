module.exports = (req, res, next) => {
  const required = process.env.CRON_SECRET;
  if (!required) return next();
  const got = req.header('x-cron-key');
  if (got && got === required) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};
