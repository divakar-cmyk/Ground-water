const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.', code: 'NO_TOKEN' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Access denied. Malformed token.', code: 'MALFORMED_TOKEN' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeychangeitinproduction');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', code: 'INVALID_TOKEN' });
  }
}

function hasRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.', code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Admins only', code: 'FORBIDDEN' });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  isAdmin: hasRole(['admin']),
  isResearcherOrAdmin: hasRole(['researcher', 'admin']),
  hasRole
};
