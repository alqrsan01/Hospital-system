import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const EMPTY = { name_en: '', name_ar: '', type: 'clinic', is_active: 1 };

export default function Departments() {
  const { t, isRTL } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/departments');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await axios.put(`/api/departments/${editing}`, form);
      } else {
        await axios.post('/api/departments', form);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/departments/${deleteTarget}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      alert(err.response?.data?.message || 'Error deleting department');
    }
  };

  const typeLabel = (type) => {
    const map = { emergency: isRTL ? 'طوارئ' : 'Emergency', clinic: isRTL ? 'عيادة' : 'Clinic', pharmacy: isRTL ? 'صيدلية' : 'Pharmacy' };
    return map[type] || type;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <h1>{t('departments')}</h1>
          <button className="btn-primary" onClick={openAdd}>+ {t('add')}</button>
        </div>
      </div>

      {loading ? <div className="loading-inline">{t('loading')}</div> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isRTL ? 'الاسم بالعربية' : 'Name (AR)'}</th>
                <th>{isRTL ? 'الاسم بالإنجليزية' : 'Name (EN)'}</th>
                <th>{isRTL ? 'النوع' : 'Type'}</th>
                <th>{t('active')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.name_ar}</td>
                  <td>{item.name_en}</td>
                  <td><span className={`type-badge type-${item.type}`}>{typeLabel(item.type)}</span></td>
                  <td>
                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(item)}>✏️</button>
                    <button className="btn-icon btn-icon-danger" onClick={() => setDeleteTarget(item.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="empty-row">{isRTL ? 'لا توجد أقسام' : 'No departments found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? (isRTL ? 'تعديل قسم' : 'Edit Department') : (isRTL ? 'إضافة قسم' : 'Add Department')} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="modal-form">
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
                <label>{isRTL ? 'النوع' : 'Type'}</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="emergency">{isRTL ? 'طوارئ' : 'Emergency'}</option>
                  <option value="clinic">{isRTL ? 'عيادة' : 'Clinic'}</option>
                  <option value="pharmacy">{isRTL ? 'صيدلية' : 'Pharmacy'}</option>
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
          message={isRTL ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this department?'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
