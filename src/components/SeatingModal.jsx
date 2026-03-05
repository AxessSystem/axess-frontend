import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingMap from './SeatingMap'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function SeatingModal({ event, ticketType, slug, primaryColor, onClose, onSuccess }) {
  const [seats, setSeats] = useState([])
  const [map, setMap] = useState(null)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [reservation, setReservation] = useState(null)
  const [modalName, setModalName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [confetti, setConfetti] = useState(false)

  const fetchSeating = useCallback(async () => {
    if (!slug || !ticketType) return
    try {
      const url = `${API_BASE}/e/${slug}/seating${ticketType?.id ? `?ticket_type_id=${ticketType.id}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('לא נמצאה מפת ישיבה')
      const data = await res.json()
      setMap(data.map)
      setSeats(data.seats || [])
      setZones(data.zones || [])
    } catch (e) {
      toast.error(e.message || 'שגיאה בטעינת המפה')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }, [slug, ticketType?.id, onClose])

  useEffect(() => {
    fetchSeating()
  }, [fetchSeating])

  useEffect(() => {
    const interval = setInterval(fetchSeating, 5000)
    return () => clearInterval(interval)
  }, [fetchSeating])

  useEffect(() => {
    const taken = seats.filter(s => selectedSeats.includes(s.id) && (s.status === 'sold' || s.status === 'reserved'))
    if (taken.length > 0) {
      setSelectedSeats(prev => prev.filter(id => !taken.some(t => t.id === id)))
      toast.error('מקום זה נתפס — בחר מקום אחר')
    }
  }, [seats, selectedSeats])

  const handleSeatSelect = (seat) => {
    if (seat.status !== 'available') return
    setSelectedSeats(prev => {
      const exists = prev.includes(seat.id)
      if (exists) return prev.filter(id => id !== seat.id)
      return [...prev, seat.id]
    })
  }

  const removeSeat = (id) => {
    setSelectedSeats(prev => prev.filter(x => x !== id))
  }

  const totalPrice = selectedSeats.reduce((sum, id) => {
    const s = seats.find(x => x.id === id)
    return sum + (s?.price ? Number(s.price) : 0)
  }, 0)

  const handleReserve = async () => {
    if (selectedSeats.length === 0 || !modalName.trim() || !modalPhone.trim()) {
      toast.error('מלא שם, טלפון ובחר מקומות')
      return
    }
    setPaying(true)
    try {
      const res = await fetch(`${API_BASE}/e/${slug}/seats/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seat_ids: selectedSeats,
          buyer_phone: modalPhone.trim(),
          buyer_name: modalName.trim(),
          ticket_type_id: ticketType?.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.seats ? 'מקומות תפוסים' : 'שגיאה')

      setReservation(data)
      if (data.total_price === 0 || data.client_secret === 'free_order') {
        const conf = await fetch(`${API_BASE}/e/${slug}/seats/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: data.reservation_id }),
        })
        const confData = await conf.json()
        if (!conf.ok) throw new Error(confData.error || 'שגיאה')
        setSuccess(true)
        setConfetti(true)
        onSuccess?.()
      } else if (data.client_secret) {
        try {
          const { loadStripe } = await import('@stripe/stripe-js')
          const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK || '')
          if (!stripe) throw new Error('Stripe לא זמין')
          const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
            payment_method: { billing_details: { name: modalName, phone: modalPhone } },
          })
          if (error) throw new Error(error.message || 'תשלום נכשל')
          const conf = await fetch(`${API_BASE}/e/${slug}/seats/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_id: data.reservation_id, payment_intent_id: paymentIntent?.id }),
          })
          const confData = await conf.json()
          if (!conf.ok) throw new Error(confData.error || 'שגיאה')
          setSuccess(true)
          setConfetti(true)
          onSuccess?.()
        } catch (stripeErr) {
          throw stripeErr
        }
      } else {
        toast.error('תשלום לא זמין')
      }
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setPaying(false)
    }
  }

  const expiresAt = reservation?.expires_at ? new Date(reservation.expires_at) : null
  const [countdown, setCountdown] = useState(null)
  useEffect(() => {
    if (!expiresAt || success) return
    const tick = () => {
      const sec = Math.max(0, Math.floor((expiresAt - new Date()) / 1000))
      setCountdown(sec)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, success])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const templateType = map?.template_type || 'theater'

  const getSeatLabel = (s) => {
    if (s.row_number != null && s.seat_number != null) return `שורה ${s.row_number} כיסא ${s.seat_number}`
    return s.label || s.seat_key || 'מקום'
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ position: 'fixed', inset: 0, background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
        <div style={{ color: 'var(--v2-primary)' }}>טוען מפה...</div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--v2-dark)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {confetti && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 10,
                height: 10,
                background: ['#00C37A', '#A855F7', '#fbbf24', '#2563EB'][i % 4],
                borderRadius: '50%',
                animation: `confetti 1.5s ease-out forwards`,
                animationDelay: `${i * 0.02}s`,
              }}
            />
          ))}
        </div>
      )}

      <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{event?.title || 'בחירת מקום'}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
          <X size={24} />
        </button>
      </header>

      {success ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>הכרטיסים בדרך!</h2>
          <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>SMS עם הכרטיס יגיע תוך דקה</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
          {isMobile ? (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => setActiveTab(0)}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: activeTab === 0 ? 'var(--v2-dark-3)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  מפה
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: activeTab === 1 ? 'var(--v2-dark-3)' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  סיכום
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 0 && (
                  <div style={{ padding: 16 }}>
                    <SeatingMap
                      seats={seats}
                      templateType={templateType}
                      onSeatSelect={handleSeatSelect}
                      selectedSeats={selectedSeats}
                      zones={zones}
                      config={map || {}}
                    />
                  </div>
                )}
                {activeTab === 1 && (
                  <div style={{ padding: 20 }}>
                    <SummaryPanel
                      seats={seats}
                      selectedSeats={selectedSeats}
                      getSeatLabel={getSeatLabel}
                      removeSeat={removeSeat}
                      totalPrice={totalPrice}
                      countdown={countdown}
                      reservation={reservation}
                      modalName={modalName}
                      setModalName={setModalName}
                      modalPhone={modalPhone}
                      setModalPhone={setModalPhone}
                      paying={paying}
                      handleReserve={handleReserve}
                      primaryColor={primaryColor}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ flex: '0 0 65%', padding: 20, overflow: 'auto' }}>
                <SeatingMap
                  seats={seats}
                  templateType={templateType}
                  onSeatSelect={handleSeatSelect}
                  selectedSeats={selectedSeats}
                  zones={zones}
                  config={map || {}}
                />
              </div>
              <div style={{ flex: '0 0 35%', borderRight: '1px solid var(--glass-border)', overflow: 'auto' }}>
                <SummaryPanel
                  seats={seats}
                  selectedSeats={selectedSeats}
                  getSeatLabel={getSeatLabel}
                  removeSeat={removeSeat}
                  totalPrice={totalPrice}
                  countdown={countdown}
                  reservation={reservation}
                  modalName={modalName}
                  setModalName={setModalName}
                  modalPhone={modalPhone}
                  setModalPhone={setModalPhone}
                  paying={paying}
                  handleReserve={handleReserve}
                  primaryColor={primaryColor}
                />
              </div>
            </>
          )}
        </div>
      )}
      <style>{`
        @keyframes confetti {
          to {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

function SummaryPanel({
  seats,
  selectedSeats,
  getSeatLabel,
  removeSeat,
  totalPrice,
  countdown,
  reservation,
  modalName,
  setModalName,
  modalPhone,
  setModalPhone,
  paying,
  handleReserve,
  primaryColor,
}) {
  const selectedSeatObjects = selectedSeats.map(id => seats.find(s => s.id === id)).filter(Boolean)
  const isFree = totalPrice === 0

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>מקומות נבחרים</h3>
      {selectedSeatObjects.length === 0 ? (
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>בחר מקומות במפה</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {selectedSeatObjects.map(s => (
            <li
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'var(--v2-dark-3)',
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <span>{getSeatLabel(s)} {s.price != null ? `— ₪${Number(s.price).toFixed(0)}` : ''}</span>
              <button
                onClick={() => removeSeat(s.id)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {reservation && countdown != null && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: countdown < 120 ? 'rgba(239,68,68,0.15)' : 'var(--v2-dark-3)',
            borderRadius: 10,
            color: countdown < 120 ? '#f87171' : 'var(--v2-gray-400)',
            fontSize: 14,
          }}
        >
          המקומות שמורים עוד {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
        </div>
      )}

      <div style={{ marginTop: 20, fontWeight: 700, fontSize: 18 }}>
        סה״כ: ₪{totalPrice.toFixed(0)}
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>שם מלא</label>
        <input
          type="text"
          value={modalName}
          onChange={e => setModalName(e.target.value)}
          placeholder="הכנס את שמך"
          required
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
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>טלפון</label>
        <input
          type="tel"
          value={modalPhone}
          onChange={e => setModalPhone(e.target.value)}
          placeholder="05XXXXXXXX"
          dir="ltr"
          required
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

      <button
        onClick={handleReserve}
        disabled={selectedSeats.length === 0 || paying}
        style={{
          width: '100%',
          marginTop: 20,
          padding: 16,
          borderRadius: 'var(--radius-full)',
          background: primaryColor || 'var(--v2-primary)',
          color: 'var(--v2-dark)',
          fontWeight: 700,
          border: 'none',
          cursor: selectedSeats.length === 0 || paying ? 'not-allowed' : 'pointer',
          opacity: selectedSeats.length === 0 || paying ? 0.7 : 1,
        }}
      >
        {paying ? 'מעבד...' : isFree ? 'השלם הרשמה חינם' : 'המשך לתשלום →'}
      </button>
    </div>
  )
}
