import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [counts, setCounts] = useState({ users: 0, departments: 0, clinics: 0 });
  const [queueStats, setQueueStats] = useState(null);
  const name = isRTL ? user?.name_ar : user?.name_en;

  useEffect(() => {
    Promise.all([
      axios.get('/api/users'),
      axios.get('/api/departments'),
      axios.get('/api/clinics'),
      axios.get('/api/queue/stats'),
    ]).then(([u, d, c, s]) => {
      setCounts({ users: u.data.length, departments: d.data.length, clinics: c.data.length });
      setQueueStats(s.data);
    }).catch(() => {});
  }, []);

  const systemCards = [
    { key: 'users',       icon: '👥', count: counts.users,       path: '/admin/users',       color: '#1a73e8' },
    { key: 'departments', icon: '🏢', count: counts.departments, path: '/admin/departments', color: '#38a169' },
    { key: 'clinics',     icon: '🏥', count: counts.clinics,     path: '/admin/clinics',     color: '#dd6b20' },
  ];

  const totalsMap = queueStats?.totals?.reduce((a, r) => ({ ...a, [r.status]: Number(r.cnt) }), {}) || {};
  const queueCards = [
    { labelEn: 'Waiting',     labelAr: 'انتظار',    count: totalsMap.waiting || 0,     color: '#3182ce' },
    { labelEn: 'Being Served',labelAr: 'يُخدم الآن', count: (totalsMap.called || 0) + (totalsMap.in_progress || 0), color: '#dd6b20' },
    { labelEn: 'Done Today',  labelAr: 'منتهى اليوم',count: totalsMap.done || 0,        color: '#38a169' },
    { labelEn: 'No-show',     labelAr: 'لم يحضر',   count: totalsMap.no_show || 0,     color: '#718096' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard')}</h1>
        <p>{isRTL ? `مرحباً، ${name}` : `Welcome, ${name}`}</p>
      </div>

      {/* System stats */}
      <h2 className="section-heading">{isRTL ? 'النظام' : 'System'}</h2>
      <div className="stat-cards">
        {systemCards.map(card => (
          <Link to={card.path} key={card.key} className="stat-card" style={{ '--card-color': card.color }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <div className="stat-count">{card.count}</div>
              <div className="stat-label">{t(card.key)}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's queue stats */}
      <h2 className="section-heading" style={{ marginTop: 32 }}>{isRTL ? 'الطابور اليوم' : "Today's Queue"}</h2>
      <div className="stat-cards">
        {queueCards.map(card => (
          <div key={card.labelEn} className="stat-card" style={{ '--card-color': card.color, cursor: 'default' }}>
            <div className="stat-info">
              <div className="stat-count">{card.count}</div>
              <div className="stat-label">{isRTL ? card.labelAr : card.labelEn}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="section-heading" style={{ marginTop: 32 }}>{isRTL ? 'الإجراءات السريعة' : 'Quick Actions'}</h2>
      <div className="cards-grid">
        <Link to="/admin/register" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>📝</div>
          <h3>{isRTL ? 'تسجيل مريض' : 'Register Patient'}</h3>
          <p className="card-hint">{isRTL ? 'إضافة مريض جديد للطابور' : 'Add a new patient to the queue'}</p>
        </Link>
        <Link to="/admin/queue" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>🖥</div>
          <h3>{isRTL ? 'مراقبة الطابور' : 'Queue Monitor'}</h3>
          <p className="card-hint">{isRTL ? 'متابعة حية لجميع الطوابير' : 'Live view of all queues'}</p>
        </Link>
        <Link to="/admin/users" className="card quick-link-card">
          <div style={{ fontSize: 32 }}>👥</div>
          <h3>{isRTL ? 'إدارة المستخدمين' : 'Manage Users'}</h3>
          <p className="card-hint">{isRTL ? 'إضافة وتعديل المستخدمين' : 'Add and edit system users'}</p>
        </Link>
      </div>
    </div>
  );
}
