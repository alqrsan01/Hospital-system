import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { PRIORITY_OPTIONS } from '../../constants/queue.js';

const EMPTY_FORM = {
  name_en: '', name_ar: '', age: '', gender: 'male',
  phone: '', id_number: '', destination_type: 'clinic',
  clinic_id: '', department_id: '', priority: '', notes: '',
};

export default function RegisterPatient() {
  const { isRTL } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [clinics, setClinics] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { ticket_number }

  useEffect(() => {
    Promise.all([
      axios.get('/api/clinics'),
      axios.get('/api/departments'),
    ]).then(([c, d]) => {
      setClinics(c.data.filter(x => x.is_active));
      setDepartments(d.data.filter(x => x.is_active));
    });
  }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload = {
        name_en: form.name_en,
        name_ar: form.name_ar,
        age: form.age || null,
        gender: form.gender,
        phone: form.phone || null,
        id_number: form.id_number || null,
        clinic_id: form.destination_type === 'clinic' ? form.clinic_id || null : null,
        department_id: form.destination_type === 'department' ? form.department_id || null : null,
        priority: Number(form.priority),
        notes: form.notes || null,
      };
      const res = await axios.post('/api/queue/register', payload);
      setSuccess({ ticket_number: res.data.ticket_number });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === Number(form.priority));

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isRTL ? 'تسجيل مريض' : 'Register Patient'}</h1>
        <p>{isRTL ? 'تسجيل مريض جديد وتحديد أولويته' : 'Register a new patient and assign triage priority'}</p>
      </div>

      {success && (
        <div className="ticket-success">
          <div className="ticket-card">
            <div className="ticket-icon">🎫</div>
            <div className="ticket-number">{success.ticket_number}</div>
            <div className="ticket-label">{isRTL ? 'رقم التذكرة' : 'Ticket Number'}</div>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setSuccess(null)}>
              {isRTL ? 'تسجيل مريض آخر' : 'Register Another'}
            </button>
          </div>
        </div>
      )}

      {!success && (
        <div className="register-grid">
          {/* Patient Info */}
          <div className="card">
            <h3 className="card-section-title">{isRTL ? 'بيانات المريض' : 'Patient Information'}</h3>
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{isRTL ? 'الاسم بالإنجليزية' : 'Name (EN)'} *</label>
                  <input value={form.name_en} onChange={e => set('name_en', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{isRTL ? 'الاسم بالعربية' : 'Name (AR)'} *</label>
                  <input value={form.name_ar} onChange={e => set('name_ar', e.target.value)} required dir="rtl" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{isRTL ? 'العمر' : 'Age'}</label>
                  <input type="number" min={0} max={150} value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{isRTL ? 'الجنس' : 'Gender'} *</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="male">{isRTL ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isRTL ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{isRTL ? 'رقم الهاتف' : 'Phone'}</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{isRTL ? 'رقم الهوية' : 'ID Number'}</label>
                  <input value={form.id_number} onChange={e => set('id_number', e.target.value)} />
                </div>
              </div>

              {/* Destination */}
              <div className="section-divider">{isRTL ? 'الوجهة' : 'Destination'}</div>

              <div className="dest-toggle">
                <button type="button"
                  className={`dest-btn ${form.destination_type === 'clinic' ? 'active' : ''}`}
                  onClick={() => set('destination_type', 'clinic')}>
                  🏥 {isRTL ? 'عيادة' : 'Clinic'}
                </button>
                <button type="button"
                  className={`dest-btn ${form.destination_type === 'department' ? 'active' : ''}`}
                  onClick={() => set('destination_type', 'department')}>
                  🚨 {isRTL ? 'قسم' : 'Department'}
                </button>
              </div>

              {form.destination_type === 'clinic' ? (
                <div className="form-group">
                  <label>{isRTL ? 'العيادة' : 'Clinic'} *</label>
                  <select value={form.clinic_id} onChange={e => set('clinic_id', e.target.value)} required>
                    <option value="">{isRTL ? '-- اختر عيادة --' : '-- Select Clinic --'}</option>
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>{isRTL ? c.name_ar : c.name_en}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>{isRTL ? 'القسم' : 'Department'} *</label>
                  <select value={form.department_id} onChange={e => set('department_id', e.target.value)} required>
                    <option value="">{isRTL ? '-- اختر قسماً --' : '-- Select Department --'}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{isRTL ? d.name_ar : d.name_en}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div className="section-divider">{isRTL ? 'الأولوية (الفرز)' : 'Triage Priority'}</div>

              <div className="priority-selector">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`priority-btn ${Number(form.priority) === p.value ? 'selected' : ''}`}
                    style={{ '--p-color': p.color }}
                    onClick={() => set('priority', p.value)}
                  >
                    <span className="priority-dot" />
                    {isRTL ? p.labelAr : p.labelEn}
                  </button>
                ))}
              </div>

              {selectedPriority && (
                <div className="priority-preview" style={{ background: selectedPriority.color }}>
                  {isRTL ? 'الأولوية المختارة:' : 'Selected:'} <strong>{isRTL ? selectedPriority.labelAr : selectedPriority.labelEn}</strong>
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label>{isRTL ? 'ملاحظات' : 'Notes'}</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" className="btn-primary btn-full" disabled={submitting || !form.priority}>
                {submitting ? (isRTL ? 'جارٍ التسجيل...' : 'Registering...') : (isRTL ? 'تسجيل المريض' : 'Register Patient')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
