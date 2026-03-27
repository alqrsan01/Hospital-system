import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const EMPTY = { username: '', password: '', role: 'doctor', name_en: '', name_ar: '', clinic_id: '', is_active: 1 };

const ROLE_COLORS = { admin: 'role-admin', manager: 'role-manager', doctor: 'role-doctor', screen: 'role-screen' };

export default function Users() {
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [usersRes, clinicsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/clinics'),
      ]);
      setItems(usersRes.data);
      setClinics(clinicsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true); };
  const openEdit = (item) => {
    setForm({ username: item.username, password: '', role: item.role, name_en: item.name_en, name_ar: item.name_ar, clinic_id: item.clinic_id || '', is_active: item.is_active });
    setEditing(item.id); setError(''); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, clinic_id: form.clinic_id || null };
    if (editing && !payload.password) delete payload.password;
    try {
      if (editing) {
        await axios.put(`/api/users/${editing}`, payload);
      } else {
        await axios.post('/api/users', payload);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/users/${deleteTarget}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const roleLabel = (role) => {
    const map = { admin: isRTL ? 'مدير النظام' : 'Admin', manager: isRTL ? 'مدير' : 'Manager', doctor: isRTL ? 'طبيب' : 'Doctor', screen: isRTL ? 'شاشة انتظار' : 'Waiting Screen' };
    return map[role] || role;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <h1>{t('users')}</h1>
          <button className="btn-primary" onClick={openAdd}>+ {t('add')}</button>
        </div>
      </div>

      {loading ? <div className="loading-inline">{t('loading')}</div> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isRTL ? 'اسم المستخدم' : 'Username'}</th>
                <th>{isRTL ? 'الاسم' : 'Full Name'}</th>
                <th>{isRTL ? 'الدور' : 'Role'}</th>
                <th>{isRTL ? 'العيادة' : 'Clinic'}</th>
                <th>{t('active')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={item.id === currentUser.id ? 'row-self' : ''}>
                  <td>{i + 1}</td>
                  <td><strong>{item.username}</strong></td>
                  <td>{isRTL ? item.name_ar : item.name_en}</td>
                  <td><span className={`role-badge ${ROLE_COLORS[item.role]}`}>{roleLabel(item.role)}</span></td>
                  <td>{isRTL ? item.clinic_name_ar : item.clinic_name_en || '—'}</td>
                  <td>
                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                    {item.id !== currentUser.id && (
                      <button className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(item.id)}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="empty-row">{isRTL ? 'لا يوجد مستخدمون' : 'No users found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? (isRTL ? 'تعديل مستخدم' : 'Edit User') : (isRTL ? 'إضافة مستخدم' : 'Add User')} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>{isRTL ? 'اسم المستخدم' : 'Username'}</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  required disabled={!!editing} />
              </div>
              <div className="form-group">
                <label>{isRTL ? 'كلمة المرور' : 'Password'} {editing && <span className="label-hint">({isRTL ? 'اتركه فارغاً للإبقاء' : 'leave blank to keep'})</span>}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editing} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{isRTL ? 'الاسم بالإنجليزية' : 'Name (EN)'}</label>
                <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{isRTL ? 'الاسم بالعربية' : 'Name (AR)'}</label>
                <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} required dir="rtl" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{isRTL ? 'الدور' : 'Role'}</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, clinic_id: '' })}>
                  <option value="admin">{isRTL ? 'مدير النظام' : 'Admin'}</option>
                  <option value="manager">{isRTL ? 'مدير' : 'Manager'}</option>
                  <option value="doctor">{isRTL ? 'طبيب' : 'Doctor'}</option>
                  <option value="screen">{isRTL ? 'شاشة انتظار' : 'Waiting Screen'}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('active')}</label>
                <select value={form.is_active} onChange={e => setForm({ ...form, is_active: Number(e.target.value) })}>
                  <option value={1}>{t('active')}</option>
                  <option value={0}>{t('inactive')}</option>
                </select>
              </div>
            </div>

            {form.role === 'doctor' && (
              <div className="form-group">
                <label>{isRTL ? 'العيادة' : 'Clinic'}</label>
                <select value={form.clinic_id} onChange={e => setForm({ ...form, clinic_id: e.target.value })}>
                  <option value="">{isRTL ? '-- اختر عيادة --' : '-- Select Clinic --'}</option>
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{isRTL ? c.name_ar : c.name_en}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>{t('cancel')}</button>
              <button type="submit" className="btn-primary">{t('save')}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
