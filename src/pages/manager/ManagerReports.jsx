import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { PRIORITY_OPTIONS } from '../../constants/queue.js';
import { exportReportCsv } from '../../utils/exportCsv.js';

export default function ManagerReports() {
  const { isRTL } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setStats(null);
    axios.get(`/api/queue/stats?date=${date}`)
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  const totalsMap = stats?.totals?.reduce((a, r) => ({ ...a, [r.status]: Number(r.cnt) }), {}) || {};
  const totalToday = Object.values(totalsMap).reduce((a, b) => a + b, 0);
  const noShow = totalsMap.no_show || 0;
  const noShowRate = totalToday > 0 ? Math.round((noShow / totalToday) * 100) : 0;
  const maxPriCnt = Math.max(...(stats?.byPriority?.map(r => Number(r.cnt)) || [1]));

  const statusRows = [
    { key: 'waiting',     labelEn: 'Waiting',     labelAr: 'انتظار',    color: '#3182ce' },
    { key: 'called',      labelEn: 'Called',       labelAr: 'منادى',     color: '#d69e2e' },
    { key: 'in_progress', labelEn: 'In Progress',  labelAr: 'جارٍ',      color: '#dd6b20' },
    { key: 'done',        labelEn: 'Done',         labelAr: 'منتهى',     color: '#38a169' },
    { key: 'no_show',     labelEn: 'No-show',      labelAr: 'لم يحضر',  color: '#718096' },
    { key: 'transferred', labelEn: 'Transferred',  labelAr: 'محوّل',     color: '#553c9a' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{isRTL ? 'التقارير' : 'Reports'}</h1>
            <p>{isRTL ? 'إحصائيات يومية تفصيلية' : 'Detailed daily statistics'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontWeight: 600, fontSize: 14 }}>{isRTL ? 'التاريخ:' : 'Date:'}</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 14 }}
            />
            {stats && totalToday > 0 && (
              <button className="btn-secondary" onClick={() => exportReportCsv(stats, date)}>
                ⬇ {isRTL ? 'تصدير CSV' : 'Export CSV'}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && <div className="loading-inline">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>}

      {!loading && stats && (
        <>
          {/* Summary row */}
          <div className="queue-stats-row" style={{ marginBottom: 24 }}>
            <div className="queue-stat-chip" style={{ '--chip-color': '#1a73e8' }}>
              <span className="chip-count">{totalToday}</span>
              <span className="chip-label">{isRTL ? 'المجموع' : 'Total'}</span>
            </div>
            {statusRows.map(s => (
              <div key={s.key} className="queue-stat-chip" style={{ '--chip-color': s.color }}>
                <span className="chip-count">{totalsMap[s.key] || 0}</span>
                <span className="chip-label">{isRTL ? s.labelAr : s.labelEn}</span>
              </div>
            ))}
            <div className="queue-stat-chip" style={{ '--chip-color': '#e53e3e' }}>
              <span className="chip-count">{noShowRate}%</span>
              <span className="chip-label">{isRTL ? 'نسبة الغياب' : 'No-show Rate'}</span>
            </div>
          </div>

          <div className="dashboard-two-col">
            {/* Priority breakdown */}
            <div className="card">
              <h3 className="card-section-title">{isRTL ? 'توزيع الأولوية' : 'Priority Breakdown'}</h3>
              {!stats.byPriority?.length ? (
                <p style={{ color: 'var(--color-text-muted)' }}>{isRTL ? 'لا بيانات' : 'No data'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PRIORITY_OPTIONS.map(p => {
                    const row = stats.byPriority.find(r => Number(r.priority) === p.value);
                    const cnt = row ? Number(row.cnt) : 0;
                    const pct = maxPriCnt > 0 ? (cnt / maxPriCnt) * 100 : 0;
                    return (
                      <div key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 130, fontSize: 13, fontWeight: 600, color: p.color, flexShrink: 0 }}>
                          {isRTL ? p.labelAr : p.labelEn}
                        </div>
                        <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, background: p.color, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ width: 32, textAlign: 'end', fontWeight: 700, fontSize: 14 }}>{cnt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clinic / department table */}
            <div className="card">
              <h3 className="card-section-title">{isRTL ? 'إحصائيات العيادات والأقسام' : 'Clinic / Department Stats'}</h3>
              {!stats.byClinic?.length ? (
                <p style={{ color: 'var(--color-text-muted)' }}>{isRTL ? 'لا بيانات' : 'No data'}</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{isRTL ? 'الاسم' : 'Name'}</th>
                        <th>{isRTL ? 'المجموع' : 'Total'}</th>
                        <th>{isRTL ? 'انتظار' : 'Waiting'}</th>
                        <th>{isRTL ? 'منتهى' : 'Done'}</th>
                        <th>{isRTL ? 'نسبة الإنجاز' : 'Completion'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byClinic.map((row, i) => {
                        const completion = row.total > 0 ? Math.round((Number(row.done) / Number(row.total)) * 100) : 0;
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{isRTL ? row.name_ar : row.name_en}</td>
                            <td><strong>{row.total}</strong></td>
                            <td style={{ color: '#3182ce' }}>{row.waiting || 0}</td>
                            <td style={{ color: '#38a169' }}>{row.done || 0}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: 4, height: 10 }}>
                                  <div style={{ width: `${completion}%`, background: '#38a169', height: '100%', borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#38a169' }}>{completion}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {totalToday === 0 && (
            <div className="empty-queue" style={{ marginTop: 24 }}>
              {isRTL ? 'لا توجد بيانات لهذا اليوم' : 'No data for this date'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
