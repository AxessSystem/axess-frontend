import { useState } from 'react'

const TABS = [
  { id: 'transactions', label: 'עסקאות' },
  { id: 'report', label: 'דוח כספי' },
]

export default function AdminFinancePage() {
  const [tab, setTab] = useState('transactions')

  return (
    <div dir="rtl" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>כספים — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        מסך ניהול עסקאות, דוחות כספיים ו־MRR. כרגע מציג placeholder בלבד.
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
        {tab === 'transactions' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן תוצג טבלת העסקאות מה־Webview Orders, כולל סינון לפי עסק, תאריך וסטטוס.
          </p>
        )}
        {tab === 'report' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן יוצג דוח כספי חודשי / שנתי של AXESS (MRR, Churn, הכנסות לפי מוצר).
          </p>
        )}
      </div>
    </div>
  )
}

