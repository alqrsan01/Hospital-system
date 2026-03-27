import { Router } from 'express';
import { getDb } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/patients?q=  — search by name or ID number (min 2 chars)
router.get('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });

    const db = await getDb();
    const term = `%${q.trim()}%`;

    const [patients] = await db.execute(`
      SELECT
        p.id, p.name_en, p.name_ar, p.age, p.gender, p.phone, p.id_number, p.created_at,
        COUNT(qt.id)                          AS total_visits,
        MAX(qt.created_at)                    AS last_visit,
        (SELECT qt2.status FROM queue_tickets qt2
           WHERE qt2.patient_id = p.id
           ORDER BY qt2.created_at DESC LIMIT 1) AS last_status
      FROM patients p
      LEFT JOIN queue_tickets qt ON qt.patient_id = p.id
      WHERE p.name_en LIKE ? OR p.name_ar LIKE ? OR p.id_number LIKE ? OR p.phone LIKE ?
      GROUP BY p.id
      ORDER BY last_visit DESC, p.created_at DESC
      LIMIT 50
    `, [term, term, term, term]);

    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/patients/:id/history  — full visit history for a patient
router.get('/:id/history', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();

    const [patient] = await db.execute(
      'SELECT id, name_en, name_ar, age, gender, phone, id_number, created_at FROM patients WHERE id = ?',
      [req.params.id]
    );
    if (!patient[0]) return res.status(404).json({ message: 'Patient not found' });

    const [visits] = await db.execute(`
      SELECT
        qt.id, qt.ticket_number, qt.priority, qt.status, qt.notes,
        qt.created_at, qt.called_at, qt.done_at,
        c.name_en AS clinic_name_en, c.name_ar AS clinic_name_ar,
        d.name_en AS dept_name_en,   d.name_ar AS dept_name_ar, d.type AS dept_type
      FROM queue_tickets qt
      LEFT JOIN clinics    c ON qt.clinic_id     = c.id
      LEFT JOIN departments d ON qt.department_id = d.id
      WHERE qt.patient_id = ?
      ORDER BY qt.created_at DESC
    `, [req.params.id]);

    res.json({ patient: patient[0], visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
