import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const ROLE_REDIRECT = {
  admin: '/admin',
  manager: '/manager',
  doctor: '/doctor',
  screen: '/screen',
};

export default function Login() {
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.username, form.password);
      navigate(ROLE_REDIRECT[user.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg === 'Invalid credentials' ? t('invalidCredentials') : t('loginError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <button className="lang-toggle-top" onClick={toggleLang}>
        {lang === 'en' ? 'عربي' : 'EN'}
      </button>

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🏥</span>
          <h1>{t('appName')}</h1>
        </div>

        <h2>{t('loginTitle')}</h2>
        <p className="login-subtitle">{t('loginSubtitle')}</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-primary btn-full" disabled={submitting}>
            {submitting ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}
