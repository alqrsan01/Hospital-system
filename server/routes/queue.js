import { Router } from 'express';
import { getDb } from '../database/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Generate daily ticket number: CODE-001, CODE-002 ...
async function generateTicketNumber(db, clinicId, departmentId) {
  let code = 'T';

  if (clinicId) {
    const [rows] = await db.execute('SELECT code FROM clinics WHERE id = ?', [clinicId]);
    code = rows[0]?.code || 'C';
  } else if (departmentId) {
    const [rows] = await db.execute('SELECT code FROM departments WHERE id = ?', [departmentId]);
    code = rows[0]?.code || 'D';
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const whereClause = clinicId
    ? 'clinic_id = ? AND department_id IS NULL'
    : 'department_id = ? AND clinic_id IS NULL';
  const idVal = clinicId || departmentId;

  const [rows] = await db.execute(
    `SELECT COUNT(*) as cnt FROM queue_tickets
     WHERE ${whereClause} AND DATE(created_at) = ?`,
    [idVal, today]
  );

  const seq = (rows[0].cnt || 0) + 1;
  return `${code}-${String(seq).padStart(3, '0')}`;
}

// POST /api/queue/register
router.post('/register', requireRole('admin', 'manager'), async (req, res) => {
  const db = await getDb();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name_en, name_ar, age, gender, phone, id_number,
      clinic_id, department_id, priority, notes
    } = req.body;

    if (!name_en || !name_ar || !gender || !priority)
      return res.status(400).json({ message: 'Required fields missing' });

    if (!clinic_id && !department_id)
      return res.status(400).json({ message: 'Must select a clinic or department' });

    // 1. Create patient
    const [patResult] = await conn.execute(
      `INSERT INTO patients (name_en, name_ar, age, gender, phone, id_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name_en, name_ar, age || null, gender, phone || null, id_number || null]
    );
    const patientId = patResult.insertId;

    // 2. Generate ticket number
    const ticketNumber = await generateTicketNumber(db, clinic_id || null, department_id || null);

    // 3. Create ticket
    const [tickResult] = await conn.execute(
      `INSERT INTO queue_tickets (ticket_number, patient_id, clinic_id, department_id, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketNumber, patientId, clinic_id || null, department_id || null, priority, notes || null]
    );

    await conn.commit();
    res.status(201).json({
      id: tickResult.insertId,
      ticket_number: ticketNumber,
      message: 'Patient registered successfully'
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// GET /api/queue  — all active tickets (waiting + called)
router.get('/', requireRole('admin', 'manager', 'doctor', 'screen'), async (req, res) => {
  try {
    const db = await getDb();
    const { clinic_id, department_id, status, date } = req.query;
    const today = date || new Date().toISOString().slice(0, 10);

    let where = ['DATE(qt.created_at) = ?'];
    const params = [today];

    if (clinic_id) { where.push('qt.clinic_id = ?'); params.push(clinic_id); }
    if (department_id) { where.push('qt.department_id = ?'); params.push(department_id); }
    if (status) {
      const statuses = status.split(',');
      where.push(`qt.status IN (${statuses.map(() => '?').join(',')})`);
      params.push(...statuses);
    }

    const [rows] = await db.execute(`
      SELECT
        qt.id, qt.ticket_number, qt.priority, qt.status, qt.notes,
        qt.created_at, qt.called_at, qt.done_at,
        qt.clinic_id, qt.department_id,
        p.name_en, p.name_ar, p.age, p.gender,
        c.name_en AS clinic_name_en, c.name_ar AS clinic_name_ar,
        d.name_en AS dept_name_en, d.name_ar AS dept_name_ar, d.type AS dept_type
      FROM queue_tickets qt
      JOIN patients p ON qt.patient_id = p.id
      LEFT JOIN clinics c ON qt.clinic_id = c.id
      LEFT JOIN departments d ON qt.department_id = d.id
      WHERE ${where.join(' AND ')}
      ORDER BY qt.priority ASC, qt.created_at ASC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/queue/stats  — today's summary
router.get('/stats', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);

    const [totals] = await db.execute(`
      SELECT status, COUNT(*) as cnt
      FROM queue_tickets
      WHERE DATE(created_at) = ?
      GROUP BY status
    `, [today]);

    const [byPriority] = await db.execute(`
      SELECT priority, COUNT(*) as cnt
      FROM queue_tickets
      WHERE DATE(created_at) = ?
      GROUP BY priority
      ORDER BY priority
    `, [today]);

    const [byClinic] = await db.execute(`
      SELECT
        COALESCE(c.name_en, d.name_en) AS name_en,
        COALESCE(c.name_ar, d.name_ar) AS name_ar,
        COUNT(*) as total,
        SUM(qt.status = 'waiting') as waiting,
        SUM(qt.status = 'done') as done
      FROM queue_tickets qt
      LEFT JOIN clinics c ON qt.clinic_id = c.id
      LEFT JOIN departments d ON qt.department_id = d.id
      WHERE DATE(qt.created_at) = ?
      GROUP BY qt.clinic_id, qt.department_id
    `, [today]);

    res.json({ totals, byPriority, byClinic });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/queue/:id/status  — update ticket status
router.put('/:id/status', requireRole('admin', 'manager', 'doctor'), async (req, res) => {
  try {
    const { status } = req.body;
    const db = await getDb();
    const updates = { status };
    if (status === 'called') updates.called_at = new Date();
    if (status === 'done' || status === 'no_show') updates.done_at = new Date();

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await db.execute(
      `UPDATE queue_tickets SET ${setClauses} WHERE id = ?`,
      [...Object.values(updates), req.params.id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/queue/:id  — cancel/remove ticket (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    await db.execute('DELETE FROM queue_tickets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ticket removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
