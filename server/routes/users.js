import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/users
router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT u.id, u.username, u.role, u.name_en, u.name_ar,
             u.clinic_id, c.name_en AS clinic_name_en, c.name_ar AS clinic_name_ar,
             u.is_active, u.created_at
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role, name_en, name_ar, clinic_id, is_active } = req.body;
    if (!username || !password || !role || !name_en || !name_ar)
      return res.status(400).json({ message: 'All fields required' });

    const db = await getDb();
    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      `INSERT INTO users (username, password_hash, role, name_en, name_ar, clinic_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, hash, role, name_en, name_ar, clinic_id || null, is_active ?? 1]
    );
    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { password, role, name_en, name_ar, clinic_id, is_active } = req.body;
    const db = await getDb();

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.execute(
        `UPDATE users SET password_hash=?, role=?, name_en=?, name_ar=?, clinic_id=?, is_active=? WHERE id=?`,
        [hash, role, name_en, name_ar, clinic_id || null, is_active ?? 1, req.params.id]
      );
    } else {
      await db.execute(
        `UPDATE users SET role=?, name_en=?, name_ar=?, clinic_id=?, is_active=? WHERE id=?`,
        [role, name_en, name_ar, clinic_id || null, is_active ?? 1, req.params.id]
      );
    }
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });
    const db = await getDb();
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
