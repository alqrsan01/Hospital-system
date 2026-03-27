import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const name = isRTL ? user?.name_ar : user?.name_en;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard')}</h1>
        <p>{t('welcomeAdmin')}, {name}</p>
      </div>
      <div className="cards-grid">
        <div className="card">
          <h3>{t('users')}</h3>
          <p className="card-hint">Manage system users</p>
        </div>
        <div className="card">
          <h3>{t('departments')}</h3>
          <p className="card-hint">Manage departments</p>
        </div>
        <div className="card">
          <h3>{t('clinics')}</h3>
          <p className="card-hint">Manage clinics</p>
        </div>
      </div>
    </div>
  );
}
