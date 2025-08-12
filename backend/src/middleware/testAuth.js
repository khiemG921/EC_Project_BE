module.exports = (req, res, next) => {
  // Nếu có header "x-user-id" thì set req.user
  const userId = req.header('x-user-id');
  const testId = 2;
  if (userId) {
    req.user = { id: Number(userId) };
  }
  else if (testId) {
    req.user = { id: testId };
  }
  next();
};