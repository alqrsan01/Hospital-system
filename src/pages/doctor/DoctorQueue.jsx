import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const PRIORITY_META = {
  1: { color: '#e53e3e', labelEn: 'Resuscitation', labelAr: 'إنعاش' },
  2: { color: '#dd6b20', labelEn: 'Emergent',      labelAr: 'طارئ' },
  3: { color: '#d69e2e', labelEn: 'Urgent',        labelAr: 'عاجل' },
  4: { color: '#38a169', labelEn: 'Semi-urgent',   labelAr: 'شبه عاجل' },
  5: { color: '#3182ce', labelEn: 'Non-urgent',    labelAr: 'غير عاجل' },
};

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return '< 1 min';
  if (diff === 1) return '1 min';
  return `${diff} min`;
}

export default function DoctorQueue() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const [waiting, setWaiting]   = useState([]);
  const [current, setCurrent]   = useState(null); // called or in_progress
  const [done, setDone]         = useState([]);
  const [clinicName, setClinicName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [calling, setCalling]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const clinicId = user?.clinic_id;

  const load = useCallback(async () => {
    if (!clinicId) return;
    try {
      const [activeRes, doneRes, clinicRes] = await Promise.all([
        axios.get(`/api/queue?clinic_id=${clinicId}&status=waiting,called,in_progress`),
        axios.get(`/api/queue?clinic_id=${clinicId}&status=done,no_show`),
        axios.get('/api/clinics'),
      ]);

      const all = activeRes.data;
      setCurrent(all.find(t => t.status === 'called' || t.status === 'in_progress') || null);
      setWaiting(all.filter(t => t.status === 'waiting'));
      setDone(doneRes.data.slice(0, 10)); // last 10 done

      const clinic = clinicRes.data.find(c => c.id === clinicId);
      setClinicName(isRTL ? clinic?.name_ar : clinic?.name_en);
      setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      // retry on next interval
    } finally {
      setLoading(false);
    }
  }, [clinicId, isRTL]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.put(`/api/queue/${ticketId}/status`, { status });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const callNext = async () => {
    if (!waiting.length) return;
    setCalling(true);
    try {
      // Next = highest priority (lowest number) → oldest
      const next = waiting[0];
      await updateStatus(next.id, 'called');
    } finally {
      setCalling(false);
    }
  };

  const callSpecific = async (ticket) => {
    // If there's already a current patient, confirm
    if (current) {
      if (!window.confirm(isRTL
        ? 'يوجد مريض حالي. هل تريد الاتصال بهذا المريض بدلاً منه؟'
        : 'There is a current patient. Call this patient instead?')) return;
    }
    await updateStatus(ticket.id, 'called');
  };

  if (!clinicId) {
    return (
      <div className="page">
        <div className="no-clinic-warning">
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2>{isRTL ? 'لم يتم تعيين عيادة' : 'No Clinic Assigned'}</h2>
          <p>{isRTL ? 'يرجى التواصل مع المدير لتعيين عيادة لحسابك.' : 'Please contact the admin to assign a clinic to your account.'}</p>
        </div>
      </div>
    );
  }

  const pm = current ? PRIORITY_META[current.priority] : null;

  return (
    <div className="page doctor-page">
      {/* Header */}
      <div className="doctor-header">
        <div>
          <h1>🏥 {clinicName || (isRTL ? 'عيادتي' : 'My Clinic')}</h1>
          <p className="doctor-date">
            {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {lastUpdate && ` · ${isRTL ? 'آخر تحديث' : 'Updated'} ${lastUpdate}`}
          </p>
        </div>
        <div className="doctor-stats-mini">
          <div className="mini-stat" style={{ color: '#3182ce' }}>
            <strong>{waiting.length}</strong>
            <span>{isRTL ? 'انتظار' : 'Waiting'}</span>
          </div>
          <div className="mini-stat" style={{ color: '#38a169' }}>
            <strong>{done.filter(d => d.status === 'done').length}</strong>
            <span>{isRTL ? 'منتهى' : 'Done'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-inline">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : (
        <div className="doctor-layout">

          {/* LEFT — Current patient + Queue */}
          <div className="doctor-main">

            {/* Current Patient Panel */}
            <div className={`current-patient-panel ${current ? 'has-patient' : ''}`}
              style={pm ? { borderColor: pm.color } : {}}>
              {current ? (
                <>
                  <div className="cp-header">
                    <div className="cp-label">{isRTL ? '🔔 المريض الحالي' : '🔔 Current Patient'}</div>
                    <div className="cp-ticket" style={{ color: pm?.color }}>{current.ticket_number}</div>
                  </div>

                  <div className="cp-name">{isRTL ? current.name_ar : current.name_en}</div>
                  <div className="cp-meta">
                    {current.age && <span>{current.age} {isRTL ? 'سنة' : 'y'}</span>}
                    <span>{isRTL ? (current.gender === 'male' ? 'ذكر' : 'أنثى') : current.gender}</span>
                    {current.called_at && (
                      <span>⏱ {timeSince(current.called_at)} {isRTL ? 'منذ النداء' : 'since call'}</span>
                    )}
                  </div>

                  <div className="cp-priority" style={{ background: pm?.color }}>
                    {isRTL ? pm?.labelAr : pm?.labelEn}
                  </div>

                  {current.notes && (
                    <div className="cp-notes">📋 {current.notes}</div>
                  )}

                  <div className="cp-actions">
                    <button className="cp-btn cp-done"
                      onClick={() => updateStatus(current.id, 'done')}>
                      ✅ {isRTL ? 'انتهى' : 'Done'}
                    </button>
                    <button className="cp-btn cp-noshow"
                      onClick={() => updateStatus(current.id, 'no_show')}>
                      🚫 {isRTL ? 'لم يحضر' : 'No-show'}
                    </button>
                    <button className="cp-btn cp-progress"
                      onClick={() => updateStatus(current.id, 'in_progress')}>
                      🔄 {isRTL ? 'جارٍ' : 'In Progress'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="cp-empty">
                  <div style={{ fontSize: 40 }}>🪑</div>
                  <p>{isRTL ? 'لا يوجد مريض حالياً' : 'No current patient'}</p>
                </div>
              )}
            </div>

            {/* Call Next Button */}
            <button
              className={`call-next-btn ${!waiting.length ? 'disabled' : ''}`}
              onClick={callNext}
              disabled={calling || !waiting.length}
            >
              {calling
                ? (isRTL ? '...' : '...')
                : waiting.length
                  ? `📢 ${isRTL ? 'نادِ التالي' : 'Call Next'} — ${waiting[0]?.ticket_number}`
                  : (isRTL ? 'لا يوجد مرضى في الانتظار' : 'No patients waiting')}
            </button>
          </div>

          {/* RIGHT — Waiting queue list */}
          <div className="doctor-sidebar">
            <h3 className="dsidebar-title">
              {isRTL ? `قائمة الانتظار (${waiting.length})` : `Waiting Queue (${waiting.length})`}
            </h3>

            {waiting.length === 0 ? (
              <div className="dsidebar-empty">{isRTL ? 'الطابور فارغ 🎉' : 'Queue is empty 🎉'}</div>
            ) : (
              <div className="queue-list">
                {waiting.map((t, i) => {
                  const p = PRIORITY_META[t.priority];
                  return (
                    <div key={t.id} className="queue-row" style={{ '--row-color': p?.color }}>
                      <div className="qr-left">
                        <div className="qr-pos">{i + 1}</div>
                        <div className="qr-pcolor" style={{ background: p?.color }} />
                        <div>
                          <div className="qr-ticket">{t.ticket_number}</div>
                          <div className="qr-name">{isRTL ? t.name_ar : t.name_en}</div>
                          <div className="qr-meta">
                            {t.age && <span>{t.age}{isRTL ? 'س' : 'y'}</span>}
                            <span>{isRTL ? (t.gender === 'male' ? 'ذكر' : 'أنثى') : t.gender}</span>
                            <span>⏱ {timeSince(t.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <button className="qr-call-btn" onClick={() => callSpecific(t)}
                        title={isRTL ? 'نادِ هذا المريض' : 'Call this patient'}>
                        📢
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Done today */}
            {done.length > 0 && (
              <>
                <h3 className="dsidebar-title" style={{ marginTop: 24 }}>
                  {isRTL ? 'المنتهون اليوم' : 'Completed Today'}
                </h3>
                <div className="done-list">
                  {done.map(t => (
                    <div key={t.id} className={`done-row ${t.status === 'no_show' ? 'noshow' : ''}`}>
                      <span className="done-ticket">{t.ticket_number}</span>
                      <span className="done-name">{isRTL ? t.name_ar : t.name_en}</span>
                      <span className="done-status">
                        {t.status === 'done'
                          ? (isRTL ? '✅ انتهى' : '✅ Done')
                          : (isRTL ? '🚫 لم يحضر' : '🚫 No-show')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
