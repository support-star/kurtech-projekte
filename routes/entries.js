const router = require('express').Router();
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/entries/:projectId
router.get('/:projectId', authMiddleware, (req, res) => {
  const entries = db.prepare(`
    SELECT * FROM time_entries WHERE project_id = ?
    ORDER BY entry_date DESC, created_at DESC
  `).all(req.params.projectId);
  res.json(entries);
});

// POST /api/entries/:projectId
router.post('/:projectId', authMiddleware, (req, res) => {
  const { entry_date, hours, description } = req.body;
  if (!entry_date || !hours || !description) return res.status(400).json({ error: 'Fehlende Felder' });

  const id = Date.now().toString();
  db.prepare(`
    INSERT INTO time_entries (id, project_id, user, entry_date, hours, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.projectId, req.user.username, entry_date, parseFloat(hours), description);

  res.json({ ok: true, id });
});

// DELETE /api/entries/:projectId/:entryId  (admin only)
router.delete('/:projectId/:entryId', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE id=? AND project_id=?').run(req.params.entryId, req.params.projectId);
  res.json({ ok: true });
});

// GET /api/entries/report/all  – all entries, alle projekte (admin)
router.get('/report/all', authMiddleware, adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, p.name as project_name
    FROM time_entries e
    JOIN projects p ON e.project_id = p.id
    ORDER BY e.entry_date DESC
  `).all();
  res.json(rows);
});

// GET /api/entries/report/user/:username  (own or admin)
router.get('/report/user/:username', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin' && req.user.username !== req.params.username) {
    return res.status(403).json({ error: 'Kein Zugriff' });
  }
  const rows = db.prepare(`
    SELECT e.*, p.name as project_name
    FROM time_entries e
    JOIN projects p ON e.project_id = p.id
    WHERE e.user = ?
    ORDER BY e.entry_date DESC
  `).all(req.params.username);
  res.json(rows);
});

module.exports = router;
