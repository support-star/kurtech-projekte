const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'kurtech_jwt_secret_change_in_production';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Nicht angemeldet' });
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  next();
}

module.exports = { authMiddleware, adminOnly, SECRET };
