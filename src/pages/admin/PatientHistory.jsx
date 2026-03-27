import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { PRIORITY_META, STATUS_META } from '../../constants/queue.js';

export default function PatientHistory() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);       // patient id
  const [history, setHistory] = useState({});            // { [patientId]: { patient, visits } }
  const [historyLoading, setHistoryLoading] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setExpanded(null);
    try {
      const res = await axios.get(`/api/patients?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
      setSearched(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (patientId) => {
    if (history[patientId]) { setExpanded(patientId); return; }
    setHistoryLoading(patientId);
    try {
      const res = await axios.get(`/api/patients/${patientId}/history`);
      setHistory(h => ({ ...h, [patientId]: res.data }));
      setExpanded(patientId);
    } catch {
    } finally {
      setHistoryLoading(null);
    }
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    loadHistory(id);
  };

  const requeue = (patient) => {
    const basePath = user?.role === 'admin' ? '/admin/register' : '/manager/register';
    navigate(basePath, { state: { patient } });
  };

  const genderLabel = (g) => isRTL ? (g === 'male' ? 'ذكر' : 'أنثى') : (g === 'male' ? 'Male' : 'Female');

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isRTL ? 'سجل المرضى' : 'Patient History'}</h1>
        <p>{isRTL ? 'ابحث عن مريض بالاسم أو رقم الهوية أو الهاتف' : 'Search by name, ID number, or phone'}</p>
      </div>

      {/* Search bar */}
      <form onSubmit={search} className="patient-search-bar">
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isRTL ? 'اسم المريض، رقم الهوية، أو الهاتف...' : 'Patient name, ID number, or phone...'}
          className="patient-search-input"
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={loading || query.trim().length < 2}>
          {loading ? '...' : (isRTL ? '🔍 بحث' : '🔍 Search')}
        </button>
      </form>

      {/* Results */}
      {searched && !loading && (
        results.length === 0 ? (
          <div className="empty-queue">{isRTL ? 'لا توجد نتائج' : 'No patients found'}</div>
        ) : (
          <div className="ph-results">
            <p className="ph-count">
              {isRTL ? `${results.length} نتيجة` : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </p>

            {results.map(p => {
              const isOpen = expanded === p.id;
              const h = history[p.id];

              return (
                <div key={p.id} className={`ph-patient-card ${isOpen ? 'open' : ''}`}>
                  {/* Patient row */}
                  <div className="ph-patient-row" onClick={() => toggleExpand(p.id)}>
                    <div className="ph-avatar">
                      {(isRTL ? p.name_ar : p.name_en)?.[0]?.toUpperCase()}
                    </div>
                    <div className="ph-info">
                      <div className="ph-name">
                        <span>{p.name_en}</span>
                        <span className="ph-name-ar">{p.name_ar}</span>
                      </div>
                      <div className="ph-meta">
                        {p.age && <span>{p.age} {isRTL ? 'سنة' : 'y'}</span>}
                        <span>{genderLabel(p.gender)}</span>
                        {p.phone && <span>📞 {p.phone}</span>}
                        {p.id_number && <span>🪪 {p.id_number}</span>}
                      </div>
                    </div>
                    <div className="ph-stats">
                      <div className="ph-stat">
                        <strong>{p.total_visits}</strong>
                        <span>{isRTL ? 'زيارة' : 'visit(s)'}</span>
                      </div>
                      {p.last_visit && (
                        <div className="ph-stat">
                          <strong>{new Date(p.last_visit).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB')}</strong>
                          <span>{isRTL ? 'آخر زيارة' : 'last visit'}</span>
                        </div>
                      )}
                    </div>
                    <div className="ph-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-primary btn-sm" onClick={() => requeue(p)}>
                        {isRTL ? '+ تسجيل مجدداً' : '+ Re-queue'}
                      </button>
                    </div>
                    <div className={`ph-chevron ${isOpen ? 'up' : ''}`}>›</div>
                  </div>

                  {/* Visit history */}
                  {isOpen && (
                    <div className="ph-history">
                      {historyLoading === p.id ? (
                        <div className="loading-inline">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                      ) : h?.visits?.length === 0 ? (
                        <p className="ph-no-visits">{isRTL ? 'لا توجد زيارات' : 'No visits recorded'}</p>
                      ) : (
                        <table className="data-table ph-visits-table">
                          <thead>
                            <tr>
                              <th>{isRTL ? 'رقم التذكرة' : 'Ticket'}</th>
                              <th>{isRTL ? 'الوجهة' : 'Destination'}</th>
                              <th>{isRTL ? 'الأولوية' : 'Priority'}</th>
                              <th>{isRTL ? 'الحالة' : 'Status'}</th>
                              <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {h.visits.map(v => {
                              const pm = PRIORITY_META[v.priority];
                              const sm = STATUS_META[v.status];
                              const dest = isRTL
                                ? (v.clinic_name_ar || v.dept_name_ar || '—')
                                : (v.clinic_name_en || v.dept_name_en || '—');
                              return (
                                <tr key={v.id}>
                                  <td><strong>{v.ticket_number}</strong></td>
                                  <td>{dest}</td>
                                  <td>
                                    <span style={{ color: pm?.color, fontWeight: 700 }}>
                                      {isRTL ? pm?.labelAr : pm?.labelEn}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${sm?.cls}`}>
                                      {isRTL ? sm?.labelAr : sm?.labelEn}
                                    </span>
                                  </td>
                                  <td>{new Date(v.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
