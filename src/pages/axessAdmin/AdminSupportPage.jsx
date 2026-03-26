import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const TABS = [
  { id: 'health', label: 'System Health' },
  { id: 'rescue', label: 'Rescue Tools' },
]

const SERVICE_LABELS = {
  database: 'Database (Postgres)',
  textme: 'TextMe SMS',
  meta_wa: 'Meta WhatsApp',
  railway: 'Railway',
}

export default function AdminSupportPage() {
  const [tab, setTab] = useState('health')
  const [creditsBizId, setCreditsBizId] = useState('')
  const [creditsAmount, setCreditsAmount] = useState('')
  const [creditsReason, setCreditsReason] = useState('')
  const [waBizId, setWaBizId] = useState('')
  const [waMessage, setWaMessage] = useState('')
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : {}

  const healthQuery = useQuery({
    queryKey: ['admin-support-health', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/support/health`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Failed health check')
        return r.json()
      }),
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
  })

  const { data: businessesData } = useQuery({
    queryKey: ['admin-businesses-for-support', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/businesses`, { headers: { Authorization: headers.Authorization } }).then((r) => {
        if (!r.ok) throw new Error('Failed to load businesses')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const businesses = businessesData?.businesses || []

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const body = {
        business_id: creditsBizId,
        amount: Number(creditsAmount),
        reason: creditsReason || '',
      }
      const res = await fetch(`${API_BASE}/api/admin/support/add-credits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to add credits')
      }
      return res.json()
    },
    onSuccess: () => {
      alert('קרדיטים נוספו בהצלחה')
      setCreditsAmount('')
      setCreditsReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-businesses-for-support'] })
    },
    onError: (e) => {
      alert(e.message || 'שגיאה בהוספת קרדיטים')
    },
  })

  const sendWaMutation = useMutation({
    mutationFn: async () => {
      const biz = businesses.find((b) => b.id === waBizId)
      if (!biz) throw new Error('לא נבחר עסק')
      const body = {
        business_id: waBizId,
        message: waMessage,
      }
      const res = await fetch(`${API_BASE}/api/w/generate-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send WA')
      }
      return res.json()
    },
    onSuccess: () => {
      alert('הודעת WhatsApp נשלחה (או נוצר קמפיין) בהצלחה')
      setWaMessage('')
    },
    onError: (e) => {
      alert(e.message || 'שגיאה בשליחת WA')
    },
  })

  const health = healthQuery.data || {}

  const renderServiceCard = (key) => {
    const item = health[key] || {}
    const status = item.status || 'unknown'
    const ok = status === 'ok'
    const notConfigured = status === 'not_configured'
    const bg = ok ? 'rgba(22,163,74,0.15)' : notConfigured ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)'
    const color = ok ? '#bbf7d0' : notConfigured ? '#fef08a' : '#fecaca'
    const statusText = ok ? '✅ תקין' : notConfigured ? '⚠️ לא מוגדר' : '❌ שגיאה'
    const label = SERVICE_LABELS[key] || key

    return (
      <div
        key={key}
        style={{
          background: 'var(--v2-dark-3)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{label}</div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              background: bg,
              color,
            }}
          >
            {statusText}
          </span>
        </div>
        {item.latency_ms != null && (
          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>Latency: {item.latency_ms}ms</div>
        )}
        {item.message && (
          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>Error: {item.message}</div>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 12px 24px' }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>תמיכה — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        כלי תמיכה פנימיים לצוות AXESS: בדיקות מערכת ופעולות Rescue מהירות.
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
        }}
      >
        {tab === 'health' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-300)' }}>
                בדיקות Health לשירותי ליבה (DB, TextMe, Meta WA).
              </div>
              <button
                onClick={() => healthQuery.refetch()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                בדוק שוב
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 16,
              }}
            >
              {['database', 'textme', 'meta_wa'].map(renderServiceCard)}
            </div>
            {health.timestamp && (
              <div style={{ marginTop: 16, fontSize: 11, color: 'var(--v2-gray-500)' }}>
                עודכן לאחרונה: {new Date(health.timestamp).toLocaleString('he-IL')}
              </div>
            )}
          </div>
        )}

        {tab === 'rescue' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            {/* הוספת קרדיטים */}
            <div
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                הוספת קרדיטים לעסק
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
                פעולה מהירה להוספת יתרה ל-SMS / Wallet של עסק.
              </div>

              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-300)', marginBottom: 4 }}>
                עסק
              </label>
              <select
                value={creditsBizId}
                onChange={(e) => setCreditsBizId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-2)',
                  color: '#fff',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <option value="">בחר עסק...</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-300)', marginBottom: 4 }}>
                סכום (₪)
              </label>
              <input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-2)',
                  color: '#fff',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              />

              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-300)', marginBottom: 4 }}>
                סיבה / הערה
              </label>
              <input
                type="text"
                value={creditsReason}
                onChange={(e) => setCreditsReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-2)',
                  color: '#fff',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              />

              <button
                onClick={() => addCreditsMutation.mutate()}
                disabled={!creditsBizId || !creditsAmount || addCreditsMutation.isLoading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--v2-primary)',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: creditsBizId && creditsAmount ? 'pointer' : 'not-allowed',
                  opacity: creditsBizId && creditsAmount ? 1 : 0.6,
                }}
              >
                {addCreditsMutation.isLoading ? 'מוסיף…' : 'הוסף קרדיטים'}
              </button>
            </div>

            {/* שליחת WA לעסק */}
            <div
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                שליחת הודעת WhatsApp לעסק
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 12 }}>
                שימוש בתשתית הקיימת של /api/w/generate-links לשליחת הודעת WA מהירה לבעל העסק.
              </div>

              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-300)', marginBottom: 4 }}>
                עסק
              </label>
              <select
                value={waBizId}
                onChange={(e) => setWaBizId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-2)',
                  color: '#fff',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <option value="">בחר עסק...</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-300)', marginBottom: 4 }}>
                הודעה
              </label>
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-2)',
                  color: '#fff',
                  fontSize: 13,
                  marginBottom: 12,
                  resize: 'vertical',
                }}
              />

              <button
                onClick={() => sendWaMutation.mutate()}
                disabled={!waBizId || !waMessage || sendWaMutation.isLoading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#22c55e',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: waBizId && waMessage ? 'pointer' : 'not-allowed',
                  opacity: waBizId && waMessage ? 1 : 0.6,
                }}
              >
                {sendWaMutation.isLoading ? 'שולח…' : 'שלח WA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

