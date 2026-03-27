import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const ROLE_LABELS = {
  admin:   { en: 'System Admin',    ar: 'مدير النظام' },
  manager: { en: 'Manager',         ar: 'مدير' },
  doctor:  { en: 'Doctor',          ar: 'طبيب' },
  screen:  { en: 'Waiting Screen',  ar: 'شاشة انتظار' },
};

export default function Profile() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (field, value) => {
    setError('');
    setSuccess('');
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm_password)
      return setError(isRTL ? 'كلمتا المرور الجديدتان غير متطابقتين' : 'New passwords do not match');
    if (form.new_password.length < 6)
      return setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');

    setSaving(true);
    try {
      await axios.put('/api/auth/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = ROLE_LABELS[user?.role];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isRTL ? 'الملف الشخصي' : 'My Profile'}</h1>
      </div>

      <div className="profile-grid">
        {/* User info card */}
        <div className="card">
          <h3 className="card-section-title">{isRTL ? 'معلومات الحساب' : 'Account Information'}</h3>

          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {(isRTL ? user?.name_ar : user?.name_en)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="profile-name">{isRTL ? user?.name_ar : user?.name_en}</div>
              <div className="profile-username">@{user?.username}</div>
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <span className="pf-label">{isRTL ? 'الاسم بالإنجليزية' : 'Name (EN)'}</span>
              <span className="pf-value">{user?.name_en}</span>
            </div>
            <div className="profile-field">
              <span className="pf-label">{isRTL ? 'الاسم بالعربية' : 'Name (AR)'}</span>
              <span className="pf-value" dir="rtl">{user?.name_ar}</span>
            </div>
            <div className="profile-field">
              <span className="pf-label">{isRTL ? 'اسم المستخدم' : 'Username'}</span>
              <span className="pf-value">{user?.username}</span>
            </div>
            <div className="profile-field">
              <span className="pf-label">{isRTL ? 'الدور' : 'Role'}</span>
              <span className="pf-value">{isRTL ? roleLabel?.ar : roleLabel?.en}</span>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div className="card">
          <h3 className="card-section-title">{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</h3>

          <form onSubmit={handleSubmit} className="profile-pw-form">
            <div className="form-group">
              <label>{isRTL ? 'كلمة المرور الحالية' : 'Current Password'}</label>
              <input
                type="password"
                value={form.current_password}
                onChange={e => set('current_password', e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label>{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <input
                type="password"
                value={form.new_password}
                onChange={e => set('new_password', e.target.value)}
                required
                autoComplete="new-password"
                placeholder={isRTL ? 'على الأقل 6 أحرف' : 'At least 6 characters'}
              />
            </div>
            <div className="form-group">
              <label>{isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error   && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">✅ {success}</div>}

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '...' : (isRTL ? 'تغيير كلمة المرور' : 'Change Password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
