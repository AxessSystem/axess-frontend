import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingModal from '../components/SeatingModal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function EventPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalTicket, setModalTicket] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalName, setModalName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/e/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('לא נמצא')))
      .then(data => { setEvent(data); setError(null) })
      .catch(err => { setError(err.message); setEvent(null) })
      .finally(() => setLoading(false))
  }, [slug])

  const handleReserve = async () => {
    if (!modalTicket || !modalName.trim() || !modalPhone.trim()) {
      toast.error('מלא שם וטלפון')
      return
    }
    setPaying(true)
    try {
      const res = await fetch(`${API_BASE}/e/${slug}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_type_id: modalTicket.id,
          quantity: modalQty,
          buyer_name: modalName.trim(),
          buyer_phone: modalPhone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')

      if (data.total_amount === 0 || data.client_secret === 'free_order') {
        const conf = await fetch(`${API_BASE}/e/${slug}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id }),
        })
        const confData = await conf.json()
        if (!conf.ok) throw new Error(confData.error || 'שגיאה')
        setSuccess(true)
        setModalTicket(null)
        toast.success('הכרטיס בדרך!')
      } else if (data.client_secret) {
        setSuccess(true)
        setModalTicket(null)
        toast.success('התשלום הושלם — הכרטיס בדרך!')
      } else {
        toast.error('תשלום לא זמין — נסה שוב מאוחר יותר')
      }
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} style={{ color: 'var(--v2-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>האירוע לא נמצא</h1>
        <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>{error}</p>
      </div>
    )
  }

  const dc = event.display_config || {}
  const primaryColor = dc.primary_color || 'var(--v2-primary)'

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff' }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            height: 280,
            background: event.image_url
              ? `url(${event.image_url}) center/cover`
              : `linear-gradient(135deg, ${primaryColor}33 0%, var(--v2-accent)22 100%)`,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--v2-dark) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, left: 24 }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800 }}>
            {event.title}
          </h1>
          {event.date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--v2-gray-400)' }}>
              <Calendar size={18} />
              <span>{new Date(event.date).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
          )}
          {event.location && (
            <a
              href={event.location_url || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--v2-primary)', textDecoration: 'none' }}
            >
              <MapPin size={18} />
              <span>{event.location}</span>
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        {event.description && (
          <p style={{ color: 'var(--v2-gray-400)', lineHeight: 1.8, marginBottom: 32 }}>{event.description}</p>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(0,195,122,0.15)',
              border: '1px solid var(--v2-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>הכרטיס שלך בדרך!</h2>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>SMS עם הכרטיס הדיגיטלי יגיע תוך דקה</p>
          </div>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>סוגי כרטיסים</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {event.ticket_types?.map(tt => (
            <div
              key={tt.id}
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{tt.name}</div>
                  {tt.description && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{tt.description}</div>}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 800, color: primaryColor }}>
                      ₪{Number(tt.price).toFixed(0)}
                    </span>
                    {tt.service_fee > 0 && <span style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}> + עמלת שירות ₪{Number(tt.service_fee).toFixed(0)}</span>}
                  </div>
                  {tt.quantity_available < 20 && tt.quantity_available > 0 && (
                    <div style={{ color: '#fbbf24', fontSize: 13, marginTop: 6 }}>נותרו {tt.quantity_available} בלבד!</div>
                  )}
                </div>
                <button
                  onClick={() => { setModalTicket(tt); setModalQty(1); setSuccess(false) }}
                  disabled={tt.quantity_available <= 0}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    background: tt.quantity_available <= 0 ? 'var(--gray-600)' : primaryColor,
                    color: tt.quantity_available <= 0 ? '#999' : 'var(--v2-dark)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: tt.quantity_available <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  רכוש
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SeatingModal — when ticket type has seating_map */}
      {modalTicket?.metadata?.seating_map_id && (
        <SeatingModal
          event={event}
          ticketType={modalTicket}
          slug={slug}
          primaryColor={primaryColor}
          onClose={() => setModalTicket(null)}
          onSuccess={() => { setSuccess(true); setModalTicket(null); toast.success('הכרטיס בדרך!') }}
        />
      )}

      {/* Regular Modal */}
      {modalTicket && !modalTicket?.metadata?.seating_map_id && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => !paying && setModalTicket(null)}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{modalTicket.name}</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>שם מלא</label>
              <input
                type="text"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                placeholder="הכנס את שמך"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>טלפון</label>
              <input
                type="tel"
                value={modalPhone}
                onChange={e => setModalPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>כמות</label>
              <select
                value={modalQty}
                onChange={e => setModalQty(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => n <= modalTicket.quantity_available).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--v2-gray-400)' }}>
                <span>סה״כ</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  ₪{(Number(modalTicket.price) * modalQty + Number(modalTicket.service_fee || 0) * modalQty).toFixed(0)}
                </span>
              </div>
            </div>
            <button
              onClick={handleReserve}
              disabled={paying}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 'var(--radius-full)',
                background: primaryColor,
                color: 'var(--v2-dark)',
                fontWeight: 700,
                border: 'none',
                cursor: paying ? 'wait' : 'pointer',
              }}
            >
              {paying ? 'מעבד...' : 'לתשלום'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
