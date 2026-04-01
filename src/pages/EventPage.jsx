import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Loader2,
  Clock,
  Users,
  Ticket,
  ChevronDown,
  MessageCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingModal from '../components/SeatingModal'
import Tooltip from '../components/ui/Tooltip'
import CustomSelect from '../components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

function ticketAvailable(tt) {
  if (typeof tt.quantity_available === 'number') return tt.quantity_available
  return Math.max(
    0,
    (tt.quantity_total || 0) - (tt.quantity_sold || 0) - (tt.quantity_reserved || 0),
  )
}

function TicketsSection({ tickets, onSelect, event }) {
  const [isOpen, setIsOpen] = useState(true)
  const primaryBtn = event.display_config?.primary_color || '#00C37A'

  return (
    <div id="tickets-section" style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text, #fff)',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700 }}>כרטיסים</span>
        <ChevronDown
          size={20}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {tickets.map((tt) => {
            const available = ticketAvailable(tt)
            const isSoldOut = available <= 0
            const isTable = tt.ticket_category === 'table'

            return (
              <div
                key={tt.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isSoldOut ? 'rgba(255,255,255,0.1)' : 'rgba(0,195,122,0.3)'}`,
                  borderRadius: 12,
                  padding: 16,
                  opacity: isSoldOut ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{tt.name}</h3>
                    {tt.description && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {tt.description}
                      </p>
                    )}
                    {isTable && tt.min_spend && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#00C37A' }}>
                        מינימום הזמנה: ₪{tt.min_spend}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    {event?.city_code ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#00C37A',
                        }}
                      >
                        מ-₪
                        {Number((event.resident_only_price ?? tt.price) || 0).toFixed(0)}
                        <span
                          style={{
                            display: 'block',
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 2,
                          }}
                        >
                          לתושבי {event.city_name || 'העיר'}
                        </span>
                      </p>
                    ) : (
                      <>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 800,
                            color: '#00C37A',
                          }}
                        >
                          ₪{Number(tt.price).toFixed(0)}
                        </p>
                        {tt.service_fee > 0 && (
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            + עמלת שירות ₪{Number(tt.service_fee).toFixed(0)}
                          </p>
                        )}
                      </>
                    )}
                    {available > 0 && available <= 20 && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#F59E0B' }}>
                        נותרו {available} בלבד
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => onSelect(tt)}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    border: 'none',
                    background: isSoldOut
                      ? 'rgba(255,255,255,0.1)'
                      : primaryBtn,
                    color: isSoldOut ? 'rgba(255,255,255,0.4)' : '#000',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    marginTop: 10,
                  }}
                >
                  {isSoldOut ? 'אזל המלאי' : isTable ? 'הזמן שולחן' : 'רכוש כרטיס'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FAQSection({ faqs }) {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>שאלות נפוצות</h2>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text, #fff)',
              textAlign: 'right',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>{faq.question}</span>
            <ChevronDown
              size={18}
              style={{
                flexShrink: 0,
                marginRight: 8,
                transform: openIdx === i ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
          {openIdx === i && (
            <p
              style={{
                margin: '0 0 14px',
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function ContactSection({ event }) {
  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>יצירת קשר</h2>
      {event.contact_info?.whatsapp && (
        <a
          href={`https://wa.me/${event.contact_info.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#22C55E',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <MessageCircle size={20} /> צור קשר בWhatsApp
        </a>
      )}
      {event.terms && (
        <a
          href={event.terms}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
        >
          תנאי שימוש ומדיניות ביטול
        </a>
      )}
    </div>
  )
}

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
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('לא נמצא'))))
      .then((data) => {
        setEvent(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setEvent(null)
      })
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
        if (data.error === 'id_number_required')
          throw new Error(data.message || 'נדרש מספר תעודת זהות')
        if (data.error === 'missing_required_field')
          throw new Error(`נא למלא: ${data.field_label}`)
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
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: 'var(--v2-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2
          size={48}
          style={{ color: 'var(--v2-primary)', animation: 'spin 1s linear infinite' }}
        />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: 'var(--v2-dark)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>האירוע לא נמצא</h1>
        <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>{error}</p>
      </div>
    )
  }

  const dc = event.display_config || {}
  const primaryColor = dc.primary_color || 'var(--v2-primary)'
  const coverSrc = event.cover_image_url || event.image_url
  const selectTicket = (tt) => {
    setModalTicket(tt)
    setModalQty(1)
    setSuccess(false)
    setPendingApproval(false)
    setIdNumber('')
    setResidentCity('')
    setCustomFields({})
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff' }}>
      <div
        style={{
          width: '100%',
          height: 300,
          position: 'relative',
          overflow: 'hidden',
          background: coverSrc
            ? undefined
            : `linear-gradient(135deg, ${primaryColor}33 0%, var(--v2-accent)22 100%)`,
        }}
      >
        {coverSrc && (
          <img
            src={coverSrc}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
          }}
        />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 120px' }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            margin: '20px 0 12px',
            lineHeight: 1.2,
            color: 'var(--text, #fff)',
          }}
        >
          {event.title}
        </h1>

        {(event.location || event.venue_name) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <MapPin size={16} color="#00C37A" />
            <span>{event.venue_name || event.location}</span>
          </div>
        )}

        {event.date && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <Calendar size={16} color="#00C37A" />
            <span>
              {new Date(event.date).toLocaleDateString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {event.date
                && ` · ${new Date(event.date).toLocaleTimeString('he-IL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
            </span>
          </div>
        )}

        {pendingApproval && (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              marginBottom: 24,
              background: 'var(--v2-dark-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <Clock size={48} style={{ color: 'var(--v2-primary)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>בקשתך התקבלה! ⏳</h2>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>
              ההרשמה שלך לאירוע ממתינה לאישור.
            </p>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 4 }}>
              תקבל SMS עם הכרטיס שלך בקרוב.
            </p>
            {event?.approval_instagram && (
              <a
                href={event.approval_instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  color: 'var(--v2-primary)',
                  textDecoration: 'none',
                }}
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
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>הכרטיס שלך בדרך!</h2>
            <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>
              SMS עם הכרטיס הדיגיטלי יגיע תוך דקה
            </p>
          </div>
        )}

        <TicketsSection
          tickets={event.ticket_types || []}
          onSelect={selectTicket}
          event={event}
        />

        {event?.features?.group_registration && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
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

        {event.description && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>על האירוע</h2>
            <div
              style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}
              dangerouslySetInnerHTML={{
                __html: event.rich_description || event.description,
              }}
            />
          </div>
        )}

        {event.faq && event.faq.length > 0 && <FAQSection faqs={event.faq} />}

        <ContactSection event={event} />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: 'rgba(10,22,40,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={() =>
            document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 12,
            border: 'none',
            background: event.display_config?.primary_color || '#00C37A',
            color: '#000',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ticket size={18} /> רכוש כרטיס
        </button>
      </div>

      {modalTicket?.metadata?.seating_map_id && (
        <SeatingModal
          event={event}
          ticketType={modalTicket}
          slug={slug}
          primaryColor={primaryColor}
          onClose={() => setModalTicket(null)}
          onSuccess={() => {
            setSuccess(true)
            setModalTicket(null)
            toast.success('הכרטיס בדרך!')
          }}
        />
      )}

      {modalTicket && !modalTicket?.metadata?.seating_map_id && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 150,
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
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{modalTicket.name}</h3>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: 'var(--v2-gray-400)',
                  marginBottom: 6,
                }}
              >
                שם מלא
              </label>
              <input
                type="text"
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
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
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: 'var(--v2-gray-400)',
                  marginBottom: 6,
                }}
              >
                טלפון
              </label>
              <input
                type="tel"
                value={modalPhone}
                onChange={(e) => setModalPhone(e.target.value)}
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
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: 'var(--v2-gray-400)',
                    marginBottom: 6,
                  }}
                >
                  תעודת זהות * <Tooltip text="נדרש לאימות גיל באירוע זה (18+)" />
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="000000000"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
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
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: 'var(--v2-gray-400)',
                    marginBottom: 6,
                  }}
                >
                  עיר מגורים <Tooltip text={`תושבי ${event.city_name || 'העיר'} נהנים ממחיר מיוחד`} />
                </label>
                <input
                  type="text"
                  placeholder="הקלד את שם עירך"
                  value={residentCity}
                  onChange={(e) => setResidentCity(e.target.value)}
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
            {(event?.registration_fields || []).map((field) => (
              <div key={field.id} style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    color: 'var(--v2-gray-400)',
                    marginBottom: 6,
                  }}
                >
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={customFields[field.id] || ''}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--v2-dark-3)',
                      color: '#fff',
                    }}
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={customFields[field.id] ?? ''}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--v2-dark-3)',
                      color: '#fff',
                    }}
                  />
                )}
                {field.type === 'select' && (
                  <CustomSelect
                    light
                    value={customFields[field.id] || ''}
                    onChange={(val) => setCustomFields((f) => ({ ...f, [field.id]: val }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--v2-dark-3)',
                      color: '#fff',
                    }}
                    placeholder="בחר..."
                    options={[
                      { value: '', label: 'בחר...' },
                      ...(field.options || []).map((opt) => ({ value: opt, label: opt })),
                    ]}
                  />
                )}
                {field.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    checked={!!customFields[field.id]}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.checked }))}
                    style={{ marginLeft: 8 }}
                  />
                )}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={customFields[field.id] || ''}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
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
                )}
                {field.type === 'email' && (
                  <input
                    type="email"
                    value={customFields[field.id] || ''}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--v2-dark-3)',
                      color: '#fff',
                    }}
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={customFields[field.id] || ''}
                    onChange={(e) =>
                      setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--v2-dark-3)',
                      color: '#fff',
                    }}
                  />
                )}
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  color: 'var(--v2-gray-400)',
                  marginBottom: 6,
                }}
              >
                כמות
              </label>
              <CustomSelect
                light
                value={modalQty}
                onChange={(val) => setModalQty(parseInt(val, 10))}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--v2-dark-3)',
                  color: '#fff',
                }}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                  .filter((n) => n <= modalTicket.quantity_available)
                  .map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
            {event?.city_code && (
              <div style={{ marginBottom: 12, fontSize: 14 }}>
                {residentCity.trim().toLowerCase()
                === (event.city_name || event.city_code || '').toLowerCase() ? (
                  <span style={{ color: 'var(--v2-primary)', fontWeight: 600 }}>
                    מחיר תושב: ₪
                    {Number(event.resident_only_price ?? modalTicket.price).toFixed(0)} ✅
                  </span>
                ) : (
                  <span style={{ color: 'var(--v2-gray-400)' }}>
                    מחיר רגיל: ₪
                    {Number(event.non_resident_price ?? modalTicket.price).toFixed(0)}
                  </span>
                )}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--v2-gray-400)',
                }}
              >
                <span>סה״כ</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  ₪
                  {(() => {
                    const isRes = event?.city_code
                      && residentCity.trim().toLowerCase()
                        === (event.city_name || event.city_code || '').toLowerCase()
                    const unitPrice = event?.city_code
                      ? isRes
                        ? (event.resident_only_price ?? modalTicket.price)
                        : (event.non_resident_price ?? modalTicket.price)
                      : modalTicket.price
                    return (
                      Number(unitPrice) * modalQty
                      + Number(modalTicket.service_fee || 0) * modalQty
                    ).toFixed(0)
                  })()}
                </span>
              </div>
            </div>
            <button
              type="button"
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
