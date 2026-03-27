import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { PRIORITY_OPTIONS } from '../../constants/queue.js';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const name = isRTL ? user?.name_ar : user?.name_en;

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/queue/stats');
      setStats(res.data);
      setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const totalsMap = stats?.totals?.reduce((a, r) => ({ ...a, [r.status]: Number(r.cnt) }), {}) || {};
  const totalToday = Object.values(totalsMap).reduce((a, b) => a + b, 0);
  const waiting = totalsMap.waiting || 0;
  const done = totalsMap.done || 0;
  const noShow = totalsMap.no_show || 0;
  const active = (totalsMap.called || 0) + (totalsMap.in_progress || 0);
  const noShowRate = totalToday > 0 ? Math.round((noShow / totalToday) * 100) : 0;

  const summaryCards = [
    { labelEn: 'Total Today',  labelAr: 'المجموع اليوم',   count: totalToday, color: '#1a73e8', icon: '📋' },
    { labelEn: 'Waiting',      labelAr: 'في الانتظار',      count: waiting,    color: '#3182ce', icon: '⏳' },
    { labelEn: 'Being Served', labelAr: 'يُخدم الآن',       count: active,     color: '#dd6b20', icon: '🔔' },
    { labelEn: 'Done',         labelAr: 'تمّت خدمتهم',      count: done,       color: '#38a169', icon: '✅' },
    { labelEn: 'No-show',      labelAr: 'لم يحضر',          count: noShow,     color: '#718096', icon: '🚫' },
    { labelEn: 'No-show Rate', labelAr: 'نسبة الغياب',      count: `${noShowRate}%`, color: '#e53e3e', icon: '📊' },
  ];

  const maxPriCnt = Math.max(...(stats?.byPriority?.map(r => Number(r.cnt)) || [1]));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{isRTL ? 'لوحة التحكم' : 'Dashboard'}</h1>
            <p>
              {isRTL ? `مرحباً، ${name}` : `Welcome, ${name}`}
              {lastUpdate && <span style={{ marginInlineStart: 12, color: 'var(--color-text-muted)', fontSize: 13 }}>
                · {isRTL ? `آخر تحديث ${lastUpdate}` : `Updated ${lastUpdate}`}
              </span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/manager/register" className="btn-primary">{isRTL ? '+ تسجيل مريض' : '+ Register Patient'}</Link>
            <Link to="/manager/queue" className="btn-secondary">{isRTL ? '🖥 الطابور' : '🖥 Queue'}</Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {summaryCards.map(c => (
          <div key={c.labelEn} className="stat-card" style={{ '--card-color': c.color, cursor: 'default' }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-info">
              <div className="stat-count">{c.count}</div>
              <div className="stat-label">{isRTL ? c.labelAr : c.labelEn}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-two-col">
        {/* Priority breakdown */}
        <div className="card">
          <h3 className="card-section-title">{isRTL ? 'توزيع الأولوية' : 'Priority Breakdown'}</h3>
          {!stats?.byPriority?.length ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{isRTL ? 'لا بيانات' : 'No data'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PRIORITY_OPTIONS.map(p => {
                const row = stats.byPriority.find(r => Number(r.priority) === p.value);
                const cnt = row ? Number(row.cnt) : 0;
                const pct = maxPriCnt > 0 ? (cnt / maxPriCnt) * 100 : 0;
                return (
                  <div key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 120, fontSize: 13, fontWeight: 600, color: p.color, flexShrink: 0 }}>
                      {isRTL ? p.labelAr : p.labelEn}
                    </div>
                    <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: p.color, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ width: 28, textAlign: 'end', fontWeight: 700, fontSize: 14 }}>{cnt}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clinic / department breakdown */}
        <div className="card">
          <h3 className="card-section-title">{isRTL ? 'إحصائيات العيادات والأقسام' : 'Clinic / Department Stats'}</h3>
          {!stats?.byClinic?.length ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{isRTL ? 'لا بيانات' : 'No data'}</p>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isRTL ? 'الاسم' : 'Name'}</th>
                    <th>{isRTL ? 'المجموع' : 'Total'}</th>
                    <th>{isRTL ? 'انتظار' : 'Waiting'}</th>
                    <th>{isRTL ? 'منتهى' : 'Done'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byClinic.map((row, i) => (
                    <tr key={i}>
                      <td>{isRTL ? row.name_ar : row.name_en}</td>
                      <td><strong>{row.total}</strong></td>
                      <td style={{ color: '#3182ce' }}>{row.waiting || 0}</td>
                      <td style={{ color: '#38a169' }}>{row.done || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="cards-grid" style={{ marginTop: 24 }}>
        <Link to="/manager/queue" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>🖥</div>
          <h3>{isRTL ? 'مراقبة الطابور' : 'Queue Monitor'}</h3>
          <p className="card-hint">{isRTL ? 'متابعة حية لجميع الطوابير' : 'Live view of all queues'}</p>
        </Link>
        <Link to="/manager/register" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>📝</div>
          <h3>{isRTL ? 'تسجيل مريض' : 'Register Patient'}</h3>
          <p className="card-hint">{isRTL ? 'إضافة مريض جديد للطابور' : 'Add a new patient to the queue'}</p>
        </Link>
        <Link to="/manager/reports" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>📊</div>
          <h3>{isRTL ? 'التقارير' : 'Reports'}</h3>
          <p className="card-hint">{isRTL ? 'إحصائيات الأيام السابقة' : 'Historical daily statistics'}</p>
        </Link>
      </div>
    </div>
  );
}
