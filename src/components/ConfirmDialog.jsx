import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  const { t } = useLanguage();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('confirm')}</h2>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '20px' }}>{message}</p>
          <div className="form-actions">
            <button className="btn-secondary" onClick={onCancel}>{t('cancel')}</button>
            <button className="btn-danger" onClick={onConfirm}>{t('delete')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
