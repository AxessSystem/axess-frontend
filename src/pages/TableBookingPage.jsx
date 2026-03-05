import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Calendar, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingMap from '../components/SeatingMap'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function TableBookingPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [paymentType, setPaymentType] = useState('full')
  const [hostPhone, setHostPhone] = useState('')
  const [hostName, setHostName] = useState('')
  const [guestPhones, setGuestPhones] = useState([])
  const [knowGuests, setKnowGuests] = useState(false)
  const [addonsQty, setAddonsQty] = useState({})
  const [termsOpen, setTermsOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/t/slug/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('לא נמצא')))
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [slug])

  const branding = data?.branding || data?.event_page?.branding || {}
  const bg = branding.bg_color || '#0a0a0a'
  const primary = branding.primary_color || '#00C37A'

  const handleBook = async () => {
    if (!hostPhone.trim() || !hostName.trim()) {
      toast.error('מלא נייד ושם')
      return
    }
    if (!selectedTicket) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/t/slug/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_type_id: selectedTicket.id,
          guest_phones: knowGuests ? guestPhones.map(g => g.phone) : [],
          selected_addons: Object.entries(addonsQty).filter(([, q]) => q > 0).map(([id, q]) => ({ addon_id: id, quantity: Number(q) })),
          payment_type: paymentType,
          host_phone: hostPhone.trim(),
          host_name: hostName.trim(),
          seat_id: selectedSeat?.id,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'שגיאה')
      setSuccess(result)
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const addGuest = () => setGuestPhones([...guestPhones, { phone: '', name: '' }])
  const removeGuest = (i) => setGuestPhones(guestPhones.filter((_, j) => j !== i))
  const updateGuest = (i, f, v) => setGuestPhones(prev => prev.map((g, j) => j === i ? { ...g, [f]: v } : g))

  const ticketTypes = data?.ticket_types || []
  const seats = data?.seats || []
  const seatingMap = data?.seating_map
  const eventPage = data?.event_page || {}
  const addons = selectedTicket?.addons || []
  const totalAddons = addons.reduce((s, a, i) => s + (Number(a.price) || 0) * (addonsQty[a.id || i] || 0), 0)
  const basePrice = Number(selectedTicket?.price || 0)
  const depositAmount = Number(selectedTicket?.deposit_amount || 0)
  const coverCharge = Number(selectedTicket?.cover_charge || 0)
  const total = basePrice + totalAddons + (paymentType === 'deposit' && depositAmount > 0 ? 0 : 0)
  const displayTotal = paymentType === 'deposit' && depositAmount > 0 ? depositAmount : basePrice
  const finalTotal = displayTotal + totalAddons

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: primary }}>טוען...</div>
      </div>
    )
  }
  if (!data) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ color: '#ef4444' }}>האירוע לא נמצא</div>
        <Link to="/" style={{ color: primary }}>חזרה לדף הבית</Link>
      </div>
    )
  }

  if (success) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>הזמנתך אושרה!</h1>
        <p style={{ color: 'var(--v2-gray-400)' }}>כרטיס הכניסה שלך נשלח ב-SMS</p>
        {success.guest_count > 0 && <p style={{ color: 'var(--v2-gray-400)' }}>SMS נשלח ל-{success.guest_count} אורחים</p>}
        <Link to={`/booking/${success.booking_id}`} style={{ padding: '14px 24px', background: primary, color: '#0a0a0a', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
          נהל את ההזמנה שלך →
        </Link>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg }}>
      <header style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {branding.logo_url && <img src={branding.logo_url} alt="" style={{ height: 40, width: 'auto' }} />}
          <div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{eventPage.title}</h1>
            {(eventPage.date || eventPage.location) && (
              <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 14, color: 'var(--v2-gray-400)' }}>
                {eventPage.date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} />{new Date(eventPage.date).toLocaleDateString('he-IL')}</span>}
                {eventPage.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{eventPage.location}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>מפת שולחנות</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, border: '1px solid rgba(0,195,122,0.3)' }}>
            <SeatingMap
              seats={seats.map(s => ({ ...s, id: s.id, status: s.status }))}
              templateType="club"
              onSeatSelect={(s) => { setSelectedSeat(s); setSelectedTicket(ticketTypes[0] || null) }}
              selectedSeats={selectedSeat ? [selectedSeat.id] : []}
            />
          </div>
        </section>

        {selectedSeat && selectedTicket && (
          <section style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>{selectedSeat.label || selectedSeat.seat_key} — קיבולת {selectedSeat.capacity || '-'}</h2>
            <div style={{ fontSize: 20, fontWeight: 700, color: primary, marginBottom: 20 }}>₪{basePrice}</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setPaymentType('full')} style={{ flex: 1, padding: 12, borderRadius: 12, background: paymentType === 'full' ? primary : 'rgba(255,255,255,0.1)', color: paymentType === 'full' ? '#0a0a0a' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>תשלום מלא ₪{basePrice}</button>
                {depositAmount > 0 && (<button onClick={() => setPaymentType('deposit')} style={{ flex: 1, padding: 12, borderRadius: 12, background: paymentType === 'deposit' ? primary : 'rgba(255,255,255,0.1)', color: paymentType === 'deposit' ? '#0a0a0a' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>פיקדון ₪{depositAmount}</button>)}
              </div>
              <p style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{paymentType === 'full' ? 'תשלום מלא מראש' : 'פיקדון — יתרת התשלום במקום'}</p>
            </div>

            {addons.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 14, marginBottom: 12 }}>Add-ons</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {addons.map((a, ai) => (
                    <div key={a.id || ai} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                      <div>
                        <span style={{ color: '#fff' }}>{a.name}</span>
                        <span style={{ color: primary, marginRight: 8 }}>₪{a.price}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setAddonsQty(q => ({ ...q, [a.id || ai]: Math.max(0, (q[a.id || ai] || 0) - 1) }))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>−</button>
                        <span style={{ color: '#fff', minWidth: 24, textAlign: 'center' }}>{addonsQty[a.id || ai] || 0}</span>
                        <button onClick={() => setAddonsQty(q => ({ ...q, [a.id || ai]: (q[a.id || ai] || 0) + 1 }))} style={{ width: 32, height: 32, borderRadius: 8, background: primary, color: '#0a0a0a', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 6 }}>הנייד שלך (host) *</label>
              <input value={hostPhone} onChange={e => setHostPhone(e.target.value)} placeholder="05X-XXX-XXXX" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 6 }}>שמך *</label>
              <input value={hostName} onChange={e => setHostName(e.target.value)} placeholder="שם מלא" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={knowGuests} onChange={e => setKnowGuests(e.target.checked)} />
              <span style={{ color: '#fff' }}>אני יודע מי מגיע</span>
            </label>
            {knowGuests && (
              <div style={{ marginBottom: 16 }}>
                {guestPhones.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={g.phone} onChange={e => updateGuest(i, 'phone', e.target.value)} placeholder="נייד" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
                    <input value={g.name} onChange={e => updateGuest(i, 'name', e.target.value)} placeholder="שם" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
                    <button onClick={() => removeGuest(i)} style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>הסר</button>
                  </div>
                ))}
                <button onClick={addGuest} style={{ padding: '8px 16px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.3)', borderRadius: 8, color: 'var(--v2-gray-400)', cursor: 'pointer' }}>+ הוסף אורח</button>
                <p style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 8 }}>תוכל להוסיף אורחים גם אחרי ההזמנה</p>
              </div>
            )}

            {coverCharge > 0 && <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 16 }}>דמי כניסה: ₪{coverCharge} לאדם (נפרד מהמינימום)</p>}

            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>סה"כ: ₪{finalTotal}</div>
            <button onClick={handleBook} disabled={submitting} style={{ width: '100%', padding: 16, borderRadius: 999, background: primary, color: '#0a0a0a', fontWeight: 700, border: 'none', cursor: submitting ? 'wait' : 'pointer' }}>הזמן שולחן →</button>

            {selectedTicket?.terms && (
              <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <button onClick={() => setTermsOpen(!termsOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 14 }}>{termsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />} תנאי ההזמנה</button>
                {termsOpen && <p style={{ color: 'var(--v2-gray-400)', fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>{selectedTicket.terms}</p>}
              </div>
            )}
            {(selectedTicket?.faq || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>שאלות נפוצות</span>
                {(selectedTicket.faq || []).map((f, i) => (
                  <div key={i} style={{ marginTop: 8 }}>
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, textAlign: 'right' }}>{faqOpen === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{f.question}</button>
                    {faqOpen === i && <p style={{ color: 'var(--v2-gray-400)', fontSize: 12, marginTop: 4 }}>{f.answer}</p>}
                  </div>
                ))}
              </div>
            )}
            {selectedTicket?.staff_contact?.name && (
              <div style={{ marginTop: 20, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                <p style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>יש שאלות? דברו עם {selectedTicket.staff_contact.name}</p>
                {selectedTicket.staff_contact.phone && (
                  <a href={`https://wa.me/972${selectedTicket.staff_contact.phone.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 16px', background: '#25D366', color: '#fff', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}><MessageCircle size={18} /> WhatsApp</a>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
