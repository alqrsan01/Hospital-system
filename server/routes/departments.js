import { Router } from 'express';
import { getDb } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute('SELECT * FROM departments ORDER BY name_en');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/departments
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name_en, name_ar, type, code, is_active } = req.body;
    if (!name_en || !name_ar || !type)
      return res.status(400).json({ message: 'All fields required' });

    const db = await getDb();
    const [result] = await db.execute(
      'INSERT INTO departments (name_en, name_ar, type, code, is_active) VALUES (?, ?, ?, ?, ?)',
      [name_en, name_ar, type, (code || name_en.slice(0,3).toUpperCase()), is_active ?? 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Department created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/departments/:id
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name_en, name_ar, type, code, is_active } = req.body;
    const db = await getDb();
    await db.execute(
      'UPDATE departments SET name_en=?, name_ar=?, type=?, code=?, is_active=? WHERE id=?',
      [name_en, name_ar, type, (code || name_en.slice(0,3).toUpperCase()), is_active ?? 1, req.params.id]
    );
    res.json({ message: 'Department updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
