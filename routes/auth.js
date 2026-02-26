const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Fehlende Felder' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, username: user.username, role: user.role });
});

// POST /api/auth/users  (admin only – add user)
router.post('/users', require('../middleware/auth').authMiddleware, require('../middleware/auth').adminOnly, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Fehlende Felder' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, role || 'user');
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: 'Benutzername bereits vergeben' });
  }
});

// GET /api/auth/users  (admin only)
router.get('/users', require('../middleware/auth').authMiddleware, require('../middleware/auth').adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all();
  res.json(users);
});

// DELETE /api/auth/users/:username  (admin only)
router.delete('/users/:username', require('../middleware/auth').authMiddleware, require('../middleware/auth').adminOnly, (req, res) => {
  if (req.params.username === 'admin') return res.status(400).json({ error: 'Admin kann nicht gelöscht werden' });
  db.prepare('DELETE FROM users WHERE username = ?').run(req.params.username);
  res.json({ ok: true });
});

module.exports = router;
