import { useState } from 'react'

const TABS = [
  { id: 'health', label: 'System Health' },
  { id: 'rescue', label: 'Rescue Tools' },
]

export default function AdminSupportPage() {
  const [tab, setTab] = useState('health')

  return (
    <div dir="rtl" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>תמיכה — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        כלי תמיכה פנימיים לצוות AXESS. כרגע מציג placeholder בלבד.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: tab === t.id ? 'var(--v2-primary)' : 'var(--v2-dark-2)',
              color: tab === t.id ? '#000' : '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
        {tab === 'health' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן יוצגו בדיקות בריאות מערכת (Queue, Webhooks, Latency, Jobs) ותקלות פעילות.
          </p>
        )}
        {tab === 'rescue' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן יוצגו כלי Rescue (ניקוי תורים, הפעלת ריצה חוזרת, תיקון נתונים נקודתי ועוד).
          </p>
        )}
      </div>
    </div>
  )
}

