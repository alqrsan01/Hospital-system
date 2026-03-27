import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const NAV_ITEMS = {
  admin: [
    { key: 'dashboard',  path: '/admin' },
    { key: 'register',   path: '/admin/register' },
    { key: 'queue',      path: '/admin/queue' },
    { key: 'users',      path: '/admin/users' },
    { key: 'departments',path: '/admin/departments' },
    { key: 'clinics',    path: '/admin/clinics' },
  ],
  manager: [
    { key: 'dashboard', path: '/manager' },
    { key: 'register',  path: '/manager/register' },
    { key: 'queue',     path: '/manager/queue' },
    { key: 'reports',   path: '/manager/reports' },
  ],
  doctor: [
    { key: 'queue',      path: '/doctor' },
  ],
  screen: [],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = NAV_ITEMS[user?.role] || [];
  const displayName = isRTL ? user?.name_ar : user?.name_en;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏥</span>
          <span className="logo-text">{t('appName')}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{displayName?.[0]}</div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{t(user?.role)}</div>
            </div>
          </div>
          <button className="btn-lang" onClick={toggleLang}>
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
