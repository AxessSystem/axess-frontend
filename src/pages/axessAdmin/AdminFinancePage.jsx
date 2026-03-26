import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const TABS = [
  { id: 'transactions', label: 'עסקאות' },
  { id: 'report', label: 'דוח כספי' },
]

export default function AdminFinancePage() {
  const [tab, setTab] = useState('transactions')
  const { session } = useAuth()
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: txData } = useQuery({
    queryKey: ['finance-transactions', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/finance/transactions`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const { data: revenueData } = useQuery({
    queryKey: ['finance-revenue', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/finance/revenue`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const transactions = txData?.transactions || []
  const revenueRows = revenueData?.revenue || []
  const smsRevenueRows = revenueData?.sms_revenue || []

  const totalRevenue = revenueRows.reduce((sum, r) => sum + Number(r.revenue || 0), 0)
  const totalCommission = revenueRows.reduce((sum, r) => sum + Number(r.axess_commission || 0), 0)
  const totalSmsRevenue = smsRevenueRows.reduce((sum, r) => sum + Number(r.sms_revenue || 0), 0)

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  const formatMonth = (d) =>
    d ? new Date(d).toLocaleDateString('he-IL', { year: '2-digit', month: '2-digit' }) : '—'

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 12px 24px' }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>כספים — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        סקירת עסקאות Webview והכנסות חודשיות, כולל עמלות AXESS והכנסות SMS.
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
        {tab === 'transactions' && (
          <div style={{ maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>מספר הזמנה</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עסק</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>לקוח</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>סכום</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>סוג</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>סטטוס</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>תאריך</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>Stripe ID</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const status = tx.status || 'unknown'
                  const statusLower = String(status).toLowerCase()
                  let bg = 'var(--v2-dark-3)'
                  let color = 'var(--v2-gray-300)'
                  if (statusLower === 'paid') {
                    bg = 'rgba(34,197,94,0.18)'
                    color = '#bbf7d0'
                  } else if (statusLower === 'pending') {
                    bg = 'rgba(234,179,8,0.18)'
                    color = '#fef3c7'
                  } else if (statusLower === 'canceled' || statusLower === 'refunded') {
                    bg = 'rgba(239,68,68,0.18)'
                    color = '#fecaca'
                  }

                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>{tx.order_number || tx.id}</td>
                      <td style={{ padding: 8, fontSize: 12, color: '#fff' }}>{tx.business_name || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>{tx.customer_phone || '—'}</td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        {tx.currency === 'usd'
                          ? `$${Number(tx.total_amount || 0).toFixed(2)}`
                          : `₪${Number(tx.total_amount || 0).toFixed(2)}`}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>{tx.order_type || '—'}</td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            background: bg,
                            color,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-300)' }}>
                        {formatDateTime(tx.paid_at || tx.created_at)}
                      </td>
                      <td style={{ padding: 8, fontSize: 11, color: 'var(--v2-gray-400)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.stripe_payment_intent_id || '—'}
                      </td>
                    </tr>
                  )
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                      אין עסקאות להצגה.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'report' && (
          <div style={{ maxWidth: '100%' }}>
            {/* כרטיסי סיכום */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: 'var(--v2-dark-3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 4 }}>סה״כ הכנסות (שולם)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  ₪{totalRevenue.toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--v2-dark-3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 4 }}>עמלות AXESS (5%)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
                  ₪{totalCommission.toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--v2-dark-3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 4 }}>הכנסות SMS (חודשיים)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8' }}>
                  ₪{totalSmsRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* טבלת חודשים */}
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>חודש</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>הזמנות</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>הכנסה</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>עמלה 5%</th>
                  <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: 'var(--v2-gray-400)' }}>הכנסות SMS</th>
                </tr>
              </thead>
              <tbody>
                {revenueRows.map((row) => {
                  const smsRow = smsRevenueRows.find(
                    (s) => String(s.month) === String(row.month)
                  )
                  const smsRev = Number(smsRow?.sms_revenue || 0)
                  return (
                    <tr key={String(row.month)} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        {formatMonth(row.month)}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        {Number(row.orders_count || 0).toLocaleString('he-IL')}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        ₪{Number(row.revenue || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        ₪{Number(row.axess_commission || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 8, fontSize: 12, color: 'var(--v2-gray-200)' }}>
                        ₪{smsRev.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                {revenueRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>
                      אין נתוני הכנסות להצגה.
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

