import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Loader2,
  Frown,
  User,
  Users,
  Wine,
  Bell,
  MessageCircle,
  Check,
  CircleCheck,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const iconMuted = { color: 'rgba(255,255,255,0.5)' }
const iconPrimary = { color: 'var(--v2-primary)' }

export default function TableView() {
  const { qrToken } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showServiceRequest, setShowServiceRequest] = useState(false)
  const [serviceMessage, setServiceMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/table/${qrToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.order) setOrder(data.order)
        else setError('ההזמנה לא נמצאה')
      })
      .catch(() => setError('שגיאה בטעינת ההזמנה'))
      .finally(() => setLoading(false))
  }, [qrToken])

  const handleServiceRequest = async () => {
    if (!serviceMessage.trim()) return
    setSending(true)
    try {
      await fetch(`${API_BASE}/table/${qrToken}/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: serviceMessage }),
      })
      setSent(true)
      setServiceMessage('')
      setTimeout(() => {
        setSent(false)
        setShowServiceRequest(false)
      }, 3000)
    } catch {
      // silent fail
    } finally {
      setSending(false)
    }
  }

  const whatsappMessage = order
    ? encodeURIComponent(`שולחן ${order.table_number} — ${order.event_title}\nבקשת שירות`)
    : ''

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          background: 'var(--v2-dark-2)',
          color: 'var(--v2-white)',
        }}
      >
        <Loader2 size={28} strokeWidth={2} className="animate-spin" style={iconPrimary} aria-hidden />
        <p style={{ margin: 0 }}>טוען...</p>
      </div>
    )

  if (error)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--v2-dark-2)',
          color: 'var(--v2-white)',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Frown size={40} strokeWidth={1.75} style={iconMuted} aria-hidden />
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )

  let guests = order.guests || []
  if (typeof guests === 'string') {
    try {
      guests = JSON.parse(guests)
    } catch {
      guests = []
    }
  }
  let items = order.items || []
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--v2-dark-2)',
        color: 'var(--v2-white)',
        fontFamily: 'inherit',
        direction: 'rtl',
        padding: '0 0 80px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,195,122,0.13), transparent)',
          borderBottom: '1px solid rgba(0,195,122,0.2)',
          padding: '24px 20px 20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 13,
            color: 'var(--v2-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {order.event_title}
        </p>
        {order.event_date && (
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {new Date(order.event_date).toLocaleDateString('he-IL')}
          </p>
        )}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(0,195,122,0.1)',
            border: '1px solid rgba(0,195,122,0.3)',
            borderRadius: 50,
            padding: '8px 20px',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--v2-primary)' }}>
            שולחן {order.table_number}
          </span>
          {order.table_name && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{order.table_name}</span>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>סטטוס הזמנה</span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background:
                order.status === 'approved'
                  ? 'rgba(0,195,122,0.15)'
                  : order.status === 'pending'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(255,255,255,0.1)',
              color:
                order.status === 'approved'
                  ? 'var(--v2-primary)'
                  : order.status === 'pending'
                    ? '#f59e0b'
                    : '#fff',
            }}
          >
            {order.status === 'approved'
              ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    מאושר
                    <CircleCheck size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                )
              : order.status === 'pending'
                ? 'ממתין לאישור'
                : order.status === 'reserved'
                  ? 'שמור'
                  : order.status}
          </span>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--v2-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <User size={18} strokeWidth={2} style={iconPrimary} aria-hidden />
            ראש השולחן
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>
            {order.customer_name} {order.customer_last_name || ''}
          </p>
          {order.customer_phone && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={14} strokeWidth={2} style={iconMuted} aria-hidden />
              {order.customer_phone}
            </p>
          )}
        </div>

        {guests.length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--v2-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Users size={18} strokeWidth={2} style={iconPrimary} aria-hidden />
              חברי השולחן ({guests.length})
            </p>
            {guests.map((g, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 0',
                  borderBottom: i < guests.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {g.first_name || g.name} {g.last_name || ''}
                  </p>
                  {g.phone && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      {g.phone}
                    </p>
                  )}
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    background: g.is_free ? 'rgba(0,195,122,0.15)' : 'rgba(255,255,255,0.1)',
                    color: g.is_free ? 'var(--v2-primary)' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {g.is_free ? 'חינם' : `₪${g.ticket_price || 0}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--v2-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Wine size={18} strokeWidth={2} style={iconPrimary} aria-hidden />
              הזמנה
            </p>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14 }}>{item.name}</p>
                  {item.quantity > 1 && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      ×{item.quantity}
                    </p>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--v2-primary)', fontWeight: 600 }}>
                  ₪
                  {Number(item.total ?? item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>סה&quot;כ</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-primary)' }}>
                ₪{Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {!showServiceRequest ? (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowServiceRequest(true)}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: 12,
                background: 'rgba(0,195,122,0.1)',
                border: '1px solid rgba(0,195,122,0.3)',
                color: 'var(--v2-primary)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Bell size={20} strokeWidth={2} aria-hidden />
              בקשת שירות / הזמנה נוספת
            </button>
            {order.business_whatsapp && (
              <a
                href={`https://wa.me/${order.business_whatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  borderRadius: 12,
                  background: 'rgba(37,211,102,0.1)',
                  border: '1px solid rgba(37,211,102,0.3)',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="WhatsApp"
              >
                <MessageCircle size={22} strokeWidth={2} aria-hidden />
              </a>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Bell size={18} strokeWidth={2} style={iconPrimary} aria-hidden />
              מה תרצו?
            </p>
            <textarea
              value={serviceMessage}
              onChange={(e) => setServiceMessage(e.target.value)}
              placeholder="תארו את הבקשה (שירות, הזמנה נוספת...)"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--v2-white)',
                fontSize: 15,
                textAlign: 'right',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            {sent ? (
              <p
                style={{
                  margin: '12px 0 0',
                  color: 'var(--v2-primary)',
                  textAlign: 'center',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={18} strokeWidth={2} aria-hidden />
                הבקשה נשלחה! המלצרית תגיע בקרוב
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleServiceRequest}
                  disabled={!serviceMessage.trim() || sending}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 10,
                    background: serviceMessage.trim() ? 'var(--v2-primary)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: serviceMessage.trim() ? 'var(--v2-dark)' : 'rgba(255,255,255,0.4)',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {sending ? 'שולח...' : 'שלח בקשה'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceRequest(false)
                    setServiceMessage('')
                  }}
                  style={{
                    minHeight: 48,
                    padding: '0 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 14,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  ביטול
                </button>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>
          מופעל ע&quot;י AXESS
        </p>
      </div>
    </div>
  )
}
