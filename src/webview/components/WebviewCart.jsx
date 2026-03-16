import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../config'

export default function WebviewCart({ items, onAfterCheckout }) {
  const { slug } = useParams()
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { total, count } = useMemo(() => {
    let total = 0
    let count = 0
    for (const item of items || []) {
      const qty = Number(item.quantity || 0)
      if (!qty) continue
      const price = Number(item.price || 0)
      total += qty * price
      count += qty
    }
    return { total, count }
  }, [items])

  const disabled = !count || !phone || submitting

  const handleCheckout = async () => {
    if (disabled) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        customer_phone: phone,
        order_type: 'upsell',
        items: (items || []).filter((i) => Number(i.quantity || 0) > 0),
        total_amount: total,
      }
      const res = await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'שגיאה ביצירת הזמנה')
      }
      const data = await res.json()
      if (typeof onAfterCheckout === 'function') {
        onAfterCheckout(data)
      }
      if (data.payment_url) {
        window.location.href = data.payment_url
      }
    } catch (e) {
      setError(e.message || 'שגיאה בתשלום')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 20,
        padding: '8px 12px 12px',
        boxSizing: 'border-box',
        background:
          'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.95) 100%)',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          background: 'var(--wv-card, #111827)',
          borderRadius: 16,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxShadow: '0 -6px 16px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>סל קניות</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {count ? `${count} פריט · ‎₪${total.toFixed(0)}` : 'ריק'}
          </span>
        </div>
        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="טלפון נייד (לקישור התשלום)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--wv-text, #fff)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        {error && (
          <div style={{ fontSize: 11, color: '#fecaca' }}>
            {error}
          </div>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={handleCheckout}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 999,
            padding: '9px 12px',
            background: disabled ? 'rgba(148,163,184,0.3)' : 'var(--wv-primary, #22C55E)',
            color: disabled ? 'rgba(255,255,255,0.8)' : '#000',
            fontWeight: 600,
            fontSize: 14,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'מעבד תשלום…' : 'לתשלום'}
        </button>
      </div>
    </div>
  )
}

