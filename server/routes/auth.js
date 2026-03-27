import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db.js';
import { signToken, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    const user = rows[0];
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name_en: user.name_en,
      name_ar: user.name_ar,
      clinic_id: user.clinic_id,
      department_id: user.department_id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name_en: user.name_en,
        name_ar: user.name_ar,
        clinic_id: user.clinic_id,
        department_id: user.department_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me  — validate token & return user
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT id, username, role, name_en, name_ar, clinic_id, department_id FROM users WHERE id = ? AND is_active = 1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout  — client just drops token, but we acknowledge
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
