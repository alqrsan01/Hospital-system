import { Router } from 'express';
import { getDb } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/clinics
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT c.*, d.name_en AS dept_name_en, d.name_ar AS dept_name_ar, d.type AS dept_type
      FROM clinics c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.name_en
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/clinics
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name_en, name_ar, department_id, is_active } = req.body;
    if (!name_en || !name_ar)
      return res.status(400).json({ message: 'All fields required' });

    const db = await getDb();
    const [result] = await db.execute(
      'INSERT INTO clinics (name_en, name_ar, department_id, is_active) VALUES (?, ?, ?, ?)',
      [name_en, name_ar, department_id || null, is_active ?? 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Clinic created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/clinics/:id
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name_en, name_ar, department_id, is_active } = req.body;
    const db = await getDb();
    await db.execute(
      'UPDATE clinics SET name_en=?, name_ar=?, department_id=?, is_active=? WHERE id=?',
      [name_en, name_ar, department_id || null, is_active ?? 1, req.params.id]
    );
    res.json({ message: 'Clinic updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/clinics/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM clinics WHERE id = ?', [req.params.id]);
    res.json({ message: 'Clinic deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
