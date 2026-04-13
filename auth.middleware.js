// backend/middleware/auth.middleware.js
// Verifies the JWT token on every protected route

const jwt = require('jsonwebtoken');

// Attach decoded user info to req.user
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, profileId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// Role guard – use after verifyToken
// Example: router.get('/admin-only', verifyToken, requireRole('admin'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
