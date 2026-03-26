import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { MapPin, Calendar, Loader2, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingModal from '../components/SeatingModal'
import Tooltip from '../components/ui/Tooltip'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export default function EventPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') || null
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalTicket, setModalTicket] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalName, setModalName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [residentCity, setResidentCity] = useState('')
  const [customFields, setCustomFields] = useState({})
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/e/${slug}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`)
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
    if (event?.requires_id && idNumber.replace(/\D/g, '').length !== 9) {
      toast.error('נא להזין תעודת זהות תקינה (9 ספרות)')
      return
    }
    const regFields = event?.registration_fields || []
    for (const f of regFields) {
      if (f.required && !customFields[f.id]) {
        toast.error(`נא למלא: ${f.label}`)
        return
      }
    }
    setPaying(true)
    try {
      const payload = {
        ticket_type_id: modalTicket.id,
        quantity: modalQty,
        buyer_name: modalName.trim(),
        buyer_phone: modalPhone.trim(),
        ...(ref ? { ref } : {}),
        ...(event?.requires_id && idNumber ? { id_number: idNumber.replace(/\D/g, '') } : {}),
        ...(event?.city_code && residentCity ? { resident_city: residentCity.trim() } : {}),
        ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
      }
      const res = await fetch(`${API_BASE}/e/${slug}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'id_number_required') throw new Error(data.message || 'נדרש מספר תעודת זהות')
        if (data.error === 'missing_required_field') throw new Error(`נא למלא: ${data.field_label}`)
        throw new Error(data.error || data.message || 'שגיאה')
      }

      if (data.status === 'pending_approval') {
        setPendingApproval(true)
        setModalTicket(null)
        return
      }

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

        {pendingApproval && (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              marginBottom: 32,
              background: 'var(--v2-dark-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <Clock size={48} style={{ color: 'var(--v2-primary)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>בקשתך התקבלה! ⏳</h2>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>ההרשמה שלך לאירוע ממתינה לאישור.</p>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 4 }}>תקבל SMS עם הכרטיס שלך בקרוב.</p>
            {event?.approval_instagram && (
              <a
                href={event.approval_instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 16, color: 'var(--v2-primary)', textDecoration: 'none' }}
              >
                שאלות? צור קשר באינסטגרם
              </a>
            )}
          </div>
        )}

        {success && !pendingApproval && (
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
                    {event?.city_code ? (
                      <span style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}>
                        מחיר מ-₪{(event.resident_only_price ?? tt.price) ?? 0} לתושבי {event.city_name || 'העיר'}
                      </span>
                    ) : (
                      <>
                        <span style={{ fontWeight: 800, color: primaryColor }}>₪{Number(tt.price).toFixed(0)}</span>
                        {tt.service_fee > 0 && <span style={{ color: 'var(--v2-gray-400)', fontSize: 13 }}> + עמלת שירות ₪{Number(tt.service_fee).toFixed(0)}</span>}
                      </>
                    )}
                  </div>
                  {tt.quantity_available < 20 && tt.quantity_available > 0 && (
                    <div style={{ color: '#fbbf24', fontSize: 13, marginTop: 6 }}>נותרו {tt.quantity_available} בלבד!</div>
                  )}
                </div>
                <button
                  onClick={() => { setModalTicket(tt); setModalQty(1); setSuccess(false); setPendingApproval(false); setIdNumber(''); setResidentCity(''); setCustomFields({}) }}
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
        {event?.features?.group_registration && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link
              to={`/e/${slug}/group-register`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <Users size={16} /> הרשמת קבוצה / כיתה
            </Link>
          </div>
        )}
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
            {event?.requires_id && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
                  תעודת זהות * <Tooltip text="נדרש לאימות גיל באירוע זה (18+)" />
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="000000000"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value.replace(/\D/g, ''))}
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
            )}
            {event?.city_code && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
                  עיר מגורים <Tooltip text={`תושבי ${event.city_name || 'העיר'} נהנים ממחיר מיוחד`} />
                </label>
                <input
                  type="text"
                  placeholder="הקלד את שם עירך"
                  value={residentCity}
                  onChange={e => setResidentCity(e.target.value)}
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
            )}
            {(event?.registration_fields || []).map(field => (
              <div key={field.id} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'text' && (
                  <input type="text" value={customFields[field.id] || ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                )}
                {field.type === 'number' && (
                  <input type="number" value={customFields[field.id] ?? ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                )}
                {field.type === 'select' && (
                  <select value={customFields[field.id] || ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}>
                    <option value="">בחר...</option>
                    {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {field.type === 'checkbox' && (
                  <input type="checkbox" checked={!!customFields[field.id]} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.checked }))} style={{ marginLeft: 8 }} />
                )}
                {field.type === 'phone' && (
                  <input type="tel" inputMode="numeric" value={customFields[field.id] || ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} placeholder={field.placeholder} dir="ltr" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                )}
                {field.type === 'email' && (
                  <input type="email" value={customFields[field.id] || ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                )}
                {field.type === 'date' && (
                  <input type="date" value={customFields[field.id] || ''} onChange={e => setCustomFields(f => ({ ...f, [field.id]: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
                )}
              </div>
            ))}
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
            {event?.city_code && (
              <div style={{ marginBottom: 12, fontSize: 14 }}>
                {residentCity.trim().toLowerCase() === (event.city_name || event.city_code || '').toLowerCase() ? (
                  <span style={{ color: 'var(--v2-primary)', fontWeight: 600 }}>מחיר תושב: ₪{Number(event.resident_only_price ?? modalTicket.price).toFixed(0)} ✅</span>
                ) : (
                  <span style={{ color: 'var(--v2-gray-400)' }}>מחיר רגיל: ₪{Number(event.non_resident_price ?? modalTicket.price).toFixed(0)}</span>
                )}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--v2-gray-400)' }}>
                <span>סה״כ</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  ₪{(() => {
                    const isRes = event?.city_code && residentCity.trim().toLowerCase() === (event.city_name || event.city_code || '').toLowerCase()
                    const unitPrice = event?.city_code ? (isRes ? (event.resident_only_price ?? modalTicket.price) : (event.non_resident_price ?? modalTicket.price)) : modalTicket.price
                    return (Number(unitPrice) * modalQty + Number(modalTicket.service_fee || 0) * modalQty).toFixed(0)
                  })()}
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
