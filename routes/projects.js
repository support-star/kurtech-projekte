const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/projects
router.get('/', authMiddleware, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM time_entries WHERE project_id = p.id) AS entry_count,
      (SELECT COALESCE(SUM(hours),0) FROM time_entries WHERE project_id = p.id) AS total_hours,
      (SELECT 1 FROM favorites WHERE username = ? AND project_id = p.id) AS is_favorite
    FROM projects p
    ORDER BY CAST(p.id AS INTEGER) DESC
  `).all(req.user.username);
  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(p);
});

// POST /api/projects
router.post('/', authMiddleware, (req, res) => {
  const { name, start_date, end_date, address, contact, notes } = req.body;
  if (!name || !start_date || !end_date) return res.status(400).json({ error: 'Fehlende Pflichtfelder' });

  // Auto-increment ID
  const maxId = db.prepare("SELECT MAX(CAST(id AS INTEGER)) as m FROM projects").get();
  const newId = String((maxId.m || 23063) + 1);

  db.prepare(`
    INSERT INTO projects (id, name, start_date, end_date, address, contact, notes, is_static, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(newId, name, start_date, end_date, address || '', contact || '', notes || '', req.user.username);

  res.json({ ok: true, id: newId });
});

// PUT /api/projects/:id  (update)
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, start_date, end_date, address, contact, notes } = req.body;
  db.prepare(`
    UPDATE projects SET name=?, start_date=?, end_date=?, address=?, contact=?, notes=?
    WHERE id=?
  `).run(name, start_date, end_date, address, contact, notes, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/projects/:id  (admin only)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Nicht gefunden' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/projects/:id/favorite  – toggle
router.post('/:id/favorite', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM favorites WHERE username=? AND project_id=?').get(req.user.username, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE username=? AND project_id=?').run(req.user.username, req.params.id);
    res.json({ favorite: false });
  } else {
    db.prepare('INSERT INTO favorites (username, project_id) VALUES (?,?)').run(req.user.username, req.params.id);
    res.json({ favorite: true });
  }
});

module.exports = router;
