const { verifyAccessToken } = require('../utils/jwt');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Malformed authorization header' });

  const scheme = parts[0];
  const token = parts[1];
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Malformed authorization header' });

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // contains id, role, tokenVersion
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};