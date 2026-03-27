import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function WaitingScreen() {
  const { t } = useLanguage();
  return (
    <div className="waiting-screen">
      <h1>{t('appName')}</h1>
      <p>Queue display will appear here in Phase 5.</p>
    </div>
  );
}
