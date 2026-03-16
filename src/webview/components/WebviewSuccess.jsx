import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

export default function WebviewSuccess({ business }) {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadOrder() {
      if (!orderId) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/w/${encodeURIComponent(slug)}/order/${encodeURIComponent(orderId)}`)
        if (!res.ok) throw new Error('שגיאה בטעינת ההזמנה')
        const data = await res.json()
        if (cancelled) return
        setOrder(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'שגיאה בטעינת ההזמנה')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadOrder()
    return () => {
      cancelled = true
    }
  }, [slug, orderId])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '32px 16px',
        textAlign: 'center',
        color: 'var(--wv-text, #fff)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 30 }}>✅</span>
      </div>
      <h1 style={{ fontSize: 20, margin: 0 }}>תודה על ההזמנה!</h1>
      <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>
        {business?.name ? `ההזמנה שלך אצל ${business.name} התקבלה.` : 'ההזמנה שלך התקבלה.'}
      </p>
      {loading && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>טוען פרטי הזמנה…</p>
      )}
      {error && (
        <p style={{ fontSize: 13, color: '#fecaca' }}>{error}</p>
      )}
      {order && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: 'var(--wv-card, #111827)',
            width: '100%',
            maxWidth: 360,
            textAlign: 'right',
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <strong>מספר הזמנה:</strong> <span dir="ltr">{order.id}</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>סכום:</strong> ‎₪{Number(order.total_amount || 0).toFixed(0)}
          </div>
          {order.customer_phone && (
            <div style={{ marginBottom: 4 }}>
              <strong>טלפון:</strong>{' '}
              <span dir="ltr">{order.customer_phone}</span>
            </div>
          )}
          <div style={{ marginTop: 6, opacity: 0.7 }}>
            תקבל/י אישור נוסף ב-WhatsApp אם העסק שולח הודעות אוטומטיות.
          </div>
        </div>
      )}
    </div>
  )
}

