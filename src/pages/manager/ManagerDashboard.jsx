import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const name = isRTL ? user?.name_ar : user?.name_en;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard')}</h1>
        <p>{t('welcomeManager')}, {name}</p>
      </div>
      <div className="cards-grid">
        <div className="card">
          <h3>{t('queue')}</h3>
          <p className="card-hint">Monitor all queues</p>
        </div>
        <div className="card">
          <h3>{t('reports')}</h3>
          <p className="card-hint">View statistics</p>
        </div>
      </div>
    </div>
  );
}
