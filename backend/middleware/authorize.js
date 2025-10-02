module.exports = function authorize(allowed = []) {
  // allowed can be a single role string or an array
  if (typeof allowed === 'string') allowed = [allowed];

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (allowed.length && !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};