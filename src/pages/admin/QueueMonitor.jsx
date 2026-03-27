import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const PRIORITY_META = {
  1: { color: '#e53e3e', labelEn: 'Resuscitation', labelAr: 'إنعاش' },
  2: { color: '#dd6b20', labelEn: 'Emergent',      labelAr: 'طارئ' },
  3: { color: '#d69e2e', labelEn: 'Urgent',        labelAr: 'عاجل' },
  4: { color: '#38a169', labelEn: 'Semi-urgent',   labelAr: 'شبه عاجل' },
  5: { color: '#3182ce', labelEn: 'Non-urgent',    labelAr: 'غير عاجل' },
};

const STATUS_META = {
  waiting:     { labelEn: 'Waiting',     labelAr: 'انتظار',    cls: 'status-waiting' },
  called:      { labelEn: 'Called',      labelAr: 'تم النداء', cls: 'status-called' },
  in_progress: { labelEn: 'In Progress', labelAr: 'جارٍ',      cls: 'status-progress' },
  done:        { labelEn: 'Done',        labelAr: 'منتهى',     cls: 'status-done' },
  no_show:     { labelEn: 'No-show',     labelAr: 'لم يحضر',  cls: 'status-noshow' },
  transferred: { labelEn: 'Transferred', labelAr: 'محوّل',    cls: 'status-transferred' },
};

const ALL_STATUSES = 'waiting,called,in_progress,done,no_show,transferred';

export default function QueueMonitor() {
  const { isRTL } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats]   = useState(null);
  const [filter, setFilter] = useState('waiting,called,in_progress');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        axios.get(`/api/queue?status=${filter}`),
        axios.get('/api/queue/stats'),
      ]);
      setTickets(tRes.data);
      setStats(sRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/queue/${id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm(isRTL ? 'هل تريد حذف هذه التذكرة؟' : 'Delete this ticket?')) return;
    try {
      await axios.delete(`/api/queue/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  // Group tickets by clinic/department
  const grouped = tickets.reduce((acc, t) => {
    const key = t.clinic_id ? `c-${t.clinic_id}` : `d-${t.department_id}`;
    const name = isRTL
      ? (t.clinic_name_ar || t.dept_name_ar || '?')
      : (t.clinic_name_en || t.dept_name_en || '?');
    if (!acc[key]) acc[key] = { name, tickets: [] };
    acc[key].tickets.push(t);
    return acc;
  }, {});

  const totalStats = stats?.totals?.reduce((a, r) => ({ ...a, [r.status]: r.cnt }), {}) || {};

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{isRTL ? 'مراقبة الطابور' : 'Queue Monitor'}</h1>
            {lastUpdate && <p>{isRTL ? `آخر تحديث: ${lastUpdate}` : `Last update: ${lastUpdate}`}</p>}
          </div>
          <button className="btn-secondary" onClick={load}>{isRTL ? '🔄 تحديث' : '🔄 Refresh'}</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="queue-stats-row">
        {[
          { key: 'waiting',     labelEn: 'Waiting',  labelAr: 'انتظار',   color: '#3182ce' },
          { key: 'called',      labelEn: 'Called',   labelAr: 'منادى',    color: '#d69e2e' },
          { key: 'in_progress', labelEn: 'Progress', labelAr: 'جارٍ',     color: '#dd6b20' },
          { key: 'done',        labelEn: 'Done',     labelAr: 'منتهى',    color: '#38a169' },
          { key: 'no_show',     labelEn: 'No-show',  labelAr: 'لم يحضر', color: '#718096' },
        ].map(s => (
          <div key={s.key} className="queue-stat-chip" style={{ '--chip-color': s.color }}>
            <span className="chip-count">{totalStats[s.key] || 0}</span>
            <span className="chip-label">{isRTL ? s.labelAr : s.labelEn}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-row">
        {[
          { value: 'waiting,called,in_progress', labelEn: 'Active', labelAr: 'النشطون' },
          { value: ALL_STATUSES,                  labelEn: 'All Today', labelAr: 'كل اليوم' },
          { value: 'waiting',                     labelEn: 'Waiting only', labelAr: 'انتظار فقط' },
          { value: 'done,no_show',                labelEn: 'Completed', labelAr: 'المكتملون' },
        ].map(f => (
          <button key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}>
            {isRTL ? f.labelAr : f.labelEn}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-inline">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-queue">{isRTL ? 'لا توجد تذاكر' : 'No tickets found'}</div>
      ) : (
        Object.entries(grouped).map(([key, group]) => (
          <div key={key} className="clinic-queue-section">
            <h2 className="clinic-queue-title">🏥 {group.name}</h2>
            <div className="tickets-grid">
              {group.tickets.map(t => {
                const pm = PRIORITY_META[t.priority];
                const sm = STATUS_META[t.status];
                return (
                  <div key={t.id} className="ticket-item" style={{ '--t-color': pm?.color }}>
                    <div className="ticket-top">
                      <div className="ticket-num">{t.ticket_number}</div>
                      <span className={`ticket-status ${sm?.cls}`}>
                        {isRTL ? sm?.labelAr : sm?.labelEn}
                      </span>
                    </div>

                    <div className="ticket-patient">
                      <strong>{isRTL ? t.name_ar : t.name_en}</strong>
                      <span>{t.age ? `${t.age}y` : ''} {isRTL ? (t.gender === 'male' ? 'ذكر' : 'أنثى') : t.gender}</span>
                    </div>

                    <div className="ticket-priority" style={{ background: pm?.color }}>
                      {isRTL ? pm?.labelAr : pm?.labelEn}
                    </div>

                    {t.notes && <div className="ticket-notes">{t.notes}</div>}

                    <div className="ticket-time">
                      🕐 {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Actions */}
                    <div className="ticket-actions">
                      {t.status === 'waiting' && (
                        <button className="tact-btn tact-call" onClick={() => updateStatus(t.id, 'called')}>
                          {isRTL ? '📢 نادِ' : '📢 Call'}
                        </button>
                      )}
                      {(t.status === 'called' || t.status === 'in_progress') && (
                        <button className="tact-btn tact-done" onClick={() => updateStatus(t.id, 'done')}>
                          {isRTL ? '✅ انتهى' : '✅ Done'}
                        </button>
                      )}
                      {t.status === 'called' && (
                        <button className="tact-btn tact-noshow" onClick={() => updateStatus(t.id, 'no_show')}>
                          {isRTL ? '🚫 لم يحضر' : '🚫 No-show'}
                        </button>
                      )}
                      <button className="tact-btn tact-delete" onClick={() => deleteTicket(t.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
