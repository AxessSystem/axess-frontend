import { useState } from 'react'

const TABS = [
  { id: 'status', label: 'סטטוס' },
  { id: 'messages', label: 'הודעות' },
  { id: 'templates', label: 'Templates' },
  { id: 'costs', label: 'עלויות' },
]

export default function AdminWhatsAppPage() {
  const [tab, setTab] = useState('status')

  return (
    <div dir="rtl" style={{ maxWidth: 1100 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>WhatsApp — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        מסך ניהול חיבורי WhatsApp, הודעות ועלויות. כרגע מציג placeholder בלבד.
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
        {tab === 'status' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן יוצג סטטוס החיבור ל־WhatsApp (Webhooks, Providers, קצב הודעות ועוד).
          </p>
        )}
        {tab === 'messages' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן תוצג טבלת הודעות, שיחות וסטטוסי משלוח.
          </p>
        )}
        {tab === 'templates' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן תוצג רשימת Templates מאושרים וסטטוס אישור לכל Template.
          </p>
        )}
        {tab === 'costs' && (
          <p style={{ color: 'var(--v2-gray-300)', fontSize: 14 }}>
            כאן תוצג טבלת עלויות לפי מדינה / סוג שיחה, וגרפים בסיסיים.
          </p>
        )}
      </div>
    </div>
  )
}

