import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const TABS = [
  { id: 'status', label: 'סטטוס' },
  { id: 'messages', label: 'הודעות' },
  { id: 'templates', label: 'Templates' },
  { id: 'costs', label: 'עלויות' },
]

export default function AdminWhatsAppPage() {
  const [tab, setTab] = useState('status')
  const { session } = useAuth()
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: statusData } = useQuery({
    queryKey: ['wa-status', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/whatsapp/status`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const { data: logsData } = useQuery({
    queryKey: ['wa-logs', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/whatsapp/logs`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['wa-templates', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/whatsapp/templates`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const { data: billingData } = useQuery({
    queryKey: ['wa-billing', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/whatsapp/billing`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const accounts = statusData?.accounts || []
  const logs = logsData?.logs || []
  const templates = templatesData?.templates || []
  const billing = billingData?.billing || []

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 12px 24px' }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>WhatsApp — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        סטטוס חיבורי WhatsApp, הודעות אחרונות, Templates ועלויות חודש נוכחי.
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

      <div
        style={{
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: 20,
          overflowX: 'auto',
        }}
      >
        {tab === 'status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.length === 0 && (
              <div style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>אין חשבונות WhatsApp מחוברים.</div>
            )}
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  background: 'var(--v2-dark-3)',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {acc.business_name || 'ללא עסק'}
                  </div>
                  {acc.is_primary && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: 'rgba(34,197,94,0.18)',
                        border: '1px solid rgba(34,197,94,0.7)',
                        color: '#bbf7d0',
                      }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  Phone ID: <span style={{ color: '#fff' }}>{acc.phone_number_id || '—'}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  מצב: <span style={{ color: '#fff' }}>{acc.status || acc.connection_status || '—'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>
                  נוצר: {formatDateTime(acc.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'messages' && (
          <div style={{ maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>תאריך</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עסק</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>טלפון</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>כיוון</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>הודעה</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      {formatDateTime(l.created_at)}
                    </td>
                    <td style={{ padding: 8, fontSize: 12, color: '#fff' }}>{l.business_name || '—'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>{l.phone || '—'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>
                      {l.direction === 'out' ? 'יציאה' : 'כניסה'}
                    </td>
                    <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.message || l.action || '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                      אין לוגים להצגה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'templates' && (
          <div style={{ maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עסק</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>שם Template</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>קטגוריה</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>סטטוס Meta</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const status = t.meta_status || t.status || 'unknown'
                  const statusLower = String(status).toLowerCase()
                  let bg = 'rgba(148,163,184,0.15)'
                  let border = 'rgba(148,163,184,0.6)'
                  let color = '#e2e8f0'
                  if (statusLower.includes('approved')) {
                    bg = 'rgba(34,197,94,0.15)'
                    border = 'rgba(34,197,94,0.7)'
                    color = '#bbf7d0'
                  } else if (statusLower.includes('rejected')) {
                    bg = 'rgba(239,68,68,0.15)'
                    border = 'rgba(239,68,68,0.7)'
                    color = '#fecaca'
                  } else if (statusLower.includes('pending')) {
                    bg = 'rgba(234,179,8,0.15)'
                    border = 'rgba(234,179,8,0.7)'
                    color = '#fef9c3'
                  }

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: 8, fontSize: 12, color: '#fff' }}>{t.business_name || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>{t.name || t.template_name || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>{t.category || t.meta_category || '—'}</td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: bg,
                            border: `1px solid ${border}`,
                            color,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                      אין Templates להצגה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'costs' && (
          <div style={{ maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עסק</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>הודעות החודש</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עלות USD</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עלות ILS</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>Markup</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((row) => {
                  const usd = Number(row.total_usd || 0)
                  const ils = Number(row.total_ils || 0)
                  const baseCost = usd * 3.8 // approx FX, לצורך חישוב גס
                  const markup = baseCost > 0 ? ((ils - baseCost) / baseCost) * 100 : 0
                  return (
                    <tr key={row.business_name || Math.random()} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: 8, fontSize: 12, color: '#fff' }}>{row.business_name || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        {Number(row.messages_count || 0).toLocaleString('he-IL')}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        ${usd.toFixed(2)}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        ₪{ils.toFixed(2)}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: markup >= 0 ? '#bbf7d0' : '#fecaca' }}>
                        {markup.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
                {billing.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                      אין נתוני חיוב לחודש הנוכחי.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
