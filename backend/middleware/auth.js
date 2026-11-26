const jwt = require('jsonwebtoken');

// Verifies the JWT and puts { id, companyId, role } on req.user.
// Every protected route uses req.user.companyId to isolate tenant data.
module.exports = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Please login first' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please login again' });
  }
};
