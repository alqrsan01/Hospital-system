import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function DoctorQueue() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const name = isRTL ? user?.name_ar : user?.name_en;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('queue')}</h1>
        <p>{t('welcomeDoctor')} {name}</p>
      </div>
      <p>Doctor queue will appear here in Phase 4.</p>
    </div>
  );
}
