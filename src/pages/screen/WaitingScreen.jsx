import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const PRIORITY_META = {
  1: { color: '#e53e3e', labelEn: 'Resuscitation', labelAr: 'إنعاش' },
  2: { color: '#dd6b20', labelEn: 'Emergent',      labelAr: 'طارئ'  },
  3: { color: '#d69e2e', labelEn: 'Urgent',        labelAr: 'عاجل'  },
  4: { color: '#38a169', labelEn: 'Semi-urgent',   labelAr: 'شبه عاجل' },
  5: { color: '#3182ce', labelEn: 'Non-urgent',    labelAr: 'غير عاجل' },
};

const TYPE_ICON = { emergency: '🚨', clinic: '🏥', pharmacy: '💊' };

// Live clock
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function WaitingScreen() {
  const { lang, isRTL, toggleLang } = useLanguage();
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [flash, setFlash]       = useState(null); // ticket_number of newly called
  const clock = useClock();

  const prevServing = useState({})[0]; // ref to detect changes

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/queue/screen');
      const incoming = res.data;

      // Detect newly called tickets → flash animation
      for (const g of incoming) {
        if (g.serving) {
          const prev = prevServing[g.key];
          if (prev !== g.serving.ticket_number) {
            prevServing[g.key] = g.serving.ticket_number;
            setFlash(g.serving.ticket_number);
            setTimeout(() => setFlash(null), 4000);
          }
        }
      }

      setGroups(incoming);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [load]);

  const dateStr = clock.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = clock.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // Split into emergency/pharmacy (priority display) and regular clinics
  const emergency = groups.filter(g => g.type === 'emergency' || g.type === 'pharmacy');
  const clinics   = groups.filter(g => g.type !== 'emergency' && g.type !== 'pharmacy');

  return (
    <div className="ws-root" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Top bar */}
      <header className="ws-header">
        <div className="ws-logo">
          🏥 <span>{isRTL ? 'نظام طوابير المستشفى' : 'Hospital Queue System'}</span>
        </div>
        <div className="ws-clock-block">
          <div className="ws-time">{timeStr}</div>
          <div className="ws-date">{dateStr}</div>
        </div>
        <button className="ws-lang-btn" onClick={toggleLang}>
          {lang === 'en' ? 'عربي' : 'EN'}
        </button>
      </header>

      {/* Flash banner — when a ticket is called */}
      {flash && (
        <div className="ws-flash-banner">
          📢 {isRTL ? 'يُرجى التوجه إلى الطبيب — التذكرة' : 'Please proceed to doctor — Ticket'}{' '}
          <strong>{flash}</strong>
        </div>
      )}

      {loading && (
        <div className="ws-loading">
          <div className="ws-spinner" />
          <p>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      )}

      {error && !loading && (
        <div className="ws-error">
          ⚠️ {isRTL ? 'تعذّر الاتصال بالخادم' : 'Connection error — retrying...'}
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div className="ws-empty">
          <div style={{ fontSize: 64 }}>🌙</div>
          <p>{isRTL ? 'لا توجد طوابير نشطة اليوم' : 'No active queues today'}</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <main className="ws-main">

          {/* Emergency / Pharmacy — top row, larger */}
          {emergency.length > 0 && (
            <section className="ws-emergency-row">
              {emergency.map(g => (
                <ClinicPanel key={g.key} group={g} isRTL={isRTL} flash={flash} large />
              ))}
            </section>
          )}

          {/* Regular clinics grid */}
          {clinics.length > 0 && (
            <section className="ws-clinics-grid">
              {clinics.map(g => (
                <ClinicPanel key={g.key} group={g} isRTL={isRTL} flash={flash} />
              ))}
            </section>
          )}
        </main>
      )}

      {/* Bottom ticker */}
      <footer className="ws-footer">
        <span className="ws-footer-label">
          {isRTL ? '🔴 مباشر' : '🔴 LIVE'}
        </span>
        <div className="ws-ticker-wrap">
          <div className="ws-ticker">
            {groups.flatMap(g =>
              g.serving
                ? [`${isRTL ? g.nameAr : g.nameEn} › ${g.serving.ticket_number} — ${isRTL ? g.serving.name_ar : g.serving.name_en}`]
                : []
            ).join('   ·   ') || (isRTL ? 'لا يوجد استدعاء حالياً' : 'No active calls')}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Clinic Panel ── */
function ClinicPanel({ group, isRTL, flash, large }) {
  const name    = isRTL ? group.nameAr : group.nameEn;
  const icon    = TYPE_ICON[group.type] || '🏥';
  const serving = group.serving;
  const waiting = group.waiting.slice(0, 5); // show max 5 next
  const pm      = serving ? PRIORITY_META[serving.priority] : null;
  const isFlashing = serving && flash === serving.ticket_number;

  return (
    <div className={`ws-clinic-card ${large ? 'large' : ''} ${isFlashing ? 'flashing' : ''}`}>
      {/* Clinic name */}
      <div className="wcc-name">
        <span>{icon}</span> {name}
      </div>

      {/* Now serving */}
      <div className="wcc-serving-label">
        {isRTL ? 'يُخدَم الآن' : 'NOW SERVING'}
      </div>

      {serving ? (
        <div className="wcc-ticket" style={{ color: pm?.color, borderColor: pm?.color }}>
          <div className="wcc-number">{serving.ticket_number}</div>
          <div className="wcc-patient">{isRTL ? serving.name_ar : serving.name_en}</div>
          <div className="wcc-priority-pill" style={{ background: pm?.color }}>
            {isRTL ? pm?.labelAr : pm?.labelEn}
          </div>
        </div>
      ) : (
        <div className="wcc-no-serving">
          — {isRTL ? 'لا يوجد' : 'None'} —
        </div>
      )}

      {/* Waiting list */}
      {waiting.length > 0 && (
        <div className="wcc-waiting">
          <div className="wcc-waiting-label">
            {isRTL ? `الانتظار (${group.waiting.length})` : `Waiting (${group.waiting.length})`}
          </div>
          <div className="wcc-waiting-list">
            {waiting.map(t => {
              const p = PRIORITY_META[t.priority];
              return (
                <div key={t.id} className="wcc-waiting-row" style={{ borderColor: p?.color }}>
                  <span className="wcc-w-dot" style={{ background: p?.color }} />
                  <span className="wcc-w-num">{t.ticket_number}</span>
                </div>
              );
            })}
            {group.waiting.length > 5 && (
              <div className="wcc-more">+{group.waiting.length - 5} {isRTL ? 'آخرون' : 'more'}</div>
            )}
          </div>
        </div>
      )}

      {waiting.length === 0 && !serving && (
        <div className="wcc-clear">{isRTL ? '✅ الطابور فارغ' : '✅ Queue clear'}</div>
      )}
    </div>
  );
}
