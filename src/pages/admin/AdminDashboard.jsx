import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState({ users: 0, departments: 0, clinics: 0 });
  const name = isRTL ? user?.name_ar : user?.name_en;

  useEffect(() => {
    Promise.all([
      axios.get('/api/users'),
      axios.get('/api/departments'),
      axios.get('/api/clinics'),
    ]).then(([u, d, c]) => {
      setStats({ users: u.data.length, departments: d.data.length, clinics: c.data.length });
    }).catch(() => {});
  }, []);

  const cards = [
    { key: 'users', icon: '👥', count: stats.users, path: '/admin/users', color: '#1a73e8' },
    { key: 'departments', icon: '🏢', count: stats.departments, path: '/admin/departments', color: '#38a169' },
    { key: 'clinics', icon: '🏥', count: stats.clinics, path: '/admin/clinics', color: '#dd6b20' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dashboard')}</h1>
        <p>{isRTL ? `مرحباً، ${name}` : `Welcome, ${name}`}</p>
      </div>

      <div className="stat-cards">
        {cards.map(card => (
          <Link to={card.path} key={card.key} className="stat-card" style={{ '--card-color': card.color }}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <div className="stat-count">{card.count}</div>
              <div className="stat-label">{t(card.key)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
