import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Loader2,
  Clock,
  Users,
  Ticket,
  X,
  ChevronDown,
  MessageCircle,
  Navigation,
  DoorOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SeatingModal from '../components/SeatingModal'
import DateTimePicker from '../components/ui/DateTimePicker'
import { TableBookingModalContent } from './EventPageTableModal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const MODAL_SYSTEM_REG_IDS = new Set([
  'first_name',
  'last_name',
  'phone',
  'email',
  'id_number',
  'birth_date',
  'gender',
])

const DEFAULT_FAQ = [
  {
    question: 'כיצד אקבל את הכרטיס?',
    answer: 'לאחר הרכישה תקבל/י הודעת WhatsApp עם קוד QR.',
  },
  {
    question: 'האם ניתן לבטל?',
    answer: 'ביטול אפשרי עד 48 שעות לפני האירוע. צור קשר עם המארגן.',
  },
  {
    question: 'מה מדיניות הכניסה?',
    answer: 'יש להציג קוד QR בכניסה. הכרטיס אישי ואינו ניתן להעברה.',
  },
]

function VenueSection({ event }) {
  if (!event.venue_name && !event.location) return null

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>המקום</h2>
      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(0,195,122,0.15)',
              border: '2px solid rgba(0,195,122,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {event.venue_image ? (
              <img src={event.venue_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <MapPin size={22} color="#00C37A" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
              {event.venue_name || event.location}
            </p>
            {event.venue_address && (
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {event.venue_address}
              </p>
            )}
          </div>
        </div>

        {(event.venue_maps_url || event.venue_address) && (
          <a
            href={
              event.venue_maps_url ||
              `https://maps.google.com/?q=${encodeURIComponent(event.venue_address || event.venue_name)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 12,
              padding: '10px',
              borderRadius: 8,
              background: 'rgba(0,195,122,0.1)',
              border: '1px solid rgba(0,195,122,0.3)',
              color: '#00C37A',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Navigation size={16} /> הצג במפה
          </a>
        )}

        {(event.doors_open || event.event_end) && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              flexWrap: 'wrap',
            }}
          >
            {event.doors_open && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <DoorOpen size={14} color="#00C37A" />
                <span>
                  פתיחת דלתות:{' '}
                  {new Date(event.doors_open).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {event.event_end && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <Clock size={14} color="#00C37A" />
                <span>
                  סיום האירוע:{' '}
                  {new Date(event.event_end).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ticketAvailable(tt) {
  if (typeof tt.quantity_available === 'number') return tt.quantity_available
  return Math.max(
    0,
    (tt.quantity_total || 0) - (tt.quantity_sold || 0) - (tt.quantity_reserved || 0),
  )
}

function TicketsSection({ tickets, onSelect, event, quantities, setQuantities }) {
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
            const maxQ = Math.max(
              1,
              Math.min(tt.max_per_order || 10, available > 0 ? available : tt.max_per_order || 10),
            )

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

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((q) => ({
                        ...q,
                        [tt.id]: Math.max(1, (q[tt.id] || 1) - 1),
                      }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'none',
                      color: '#fff',
                      fontSize: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                    {quantities[tt.id] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((q) => ({
                        ...q,
                        [tt.id]: Math.min(maxQ, (q[tt.id] || 1) + 1),
                      }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'none',
                      color: '#fff',
                      fontSize: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    סה&quot;כ: ₪{((quantities[tt.id] || 1) * Number(tt.price || 0)).toFixed(0)}
                  </span>
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
  let rawList = faqs
  if (typeof rawList === 'string') {
    try {
      const p = JSON.parse(rawList)
      rawList = Array.isArray(p) ? p : []
    } catch {
      rawList = []
    }
  }
  if (!Array.isArray(rawList)) rawList = []
  const normalized = rawList
    .map((f) => {
      const question = f?.question ?? f?.q
      const answer = f?.answer ?? f?.a
      if (question && answer) return { question, answer }
      return null
    })
    .filter(Boolean)
  const faqData = normalized.length > 0 ? normalized : DEFAULT_FAQ

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>שאלות נפוצות</h2>
      {faqData.map((faq, i) => (
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

function OrganizerSection({ event }) {
  const organizer = event.organizer || event.contact_info || {}
  const initials = (organizer.name || event.title || 'A')[0].toUpperCase()

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>מארגן האירוע</h2>

      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              flexShrink: 0,
              overflow: 'hidden',
              background: 'rgba(0,195,122,0.15)',
              border: '2px solid rgba(0,195,122,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {organizer.avatar ? (
              <img src={organizer.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 800, color: '#00C37A' }}>{initials}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
              {organizer.name || 'מארגן האירוע'}
            </p>
            {organizer.email && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {organizer.email}
              </p>
            )}
          </div>

          <a
            href={`/w/${event.slug}/chat`}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,195,122,0.15)',
              border: '1px solid rgba(0,195,122,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: '#00C37A',
            }}
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>

      {organizer.whatsapp && (
        <a
          href={`https://wa.me/${organizer.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#22C55E',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          <MessageCircle size={18} /> WhatsApp עם המארגן
        </a>
      )}

      {event.terms && (
        <a
          href={event.terms}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          תנאי שימוש ומדיניות ביטול →
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
  const [modalPaymentMode, setModalPaymentMode] = useState('full')
  const [modalFirstName, setModalFirstName] = useState('')
  const [modalLastName, setModalLastName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [modalEmail, setModalEmail] = useState('')
  const [modalIdNumber, setModalIdNumber] = useState('')
  const [modalBirthDate, setModalBirthDate] = useState(null)
  const [modalGender, setModalGender] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [residentCity, setResidentCity] = useState('')
  const [customFields, setCustomFields] = useState({})
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [showTicketDrawer, setShowTicketDrawer] = useState(false)
  const [tableStep, setTableStep] = useState(1)
  const [tableForm, setTableForm] = useState({
    selected_drinks: {},
    extras_by_drink: {},
    drink_item_id: '',
    drink_name: '',
    drink_price: 0,
    drink_quantity: 1,
    free_rule: { people: 3, per_liter: 1, price_threshold: 1000, below_threshold_people: 2 },
    guest_count: 1,
    extra_tickets: 0,
    extra_ticket_price: 0,
    extras: [],
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_instagram: '',
    guests: [],
    payment_mode: 'full',
    split_count: 1,
  })

  const calcTablePrice = useCallback(() => {
    const drinks = Object.values(tableForm.selected_drinks || {})
    const totalBottles = drinks.reduce((s, d) => s + (d.quantity || 0), 0)
    const drinksTotal = drinks.reduce((s, d) => s + parseFloat(d.price || 0) * (d.quantity || 0), 0)
    const avgPrice = totalBottles > 0 ? drinksTotal / totalBottles : 0
    const freePeoplePerBottle = avgPrice > 1000 ? 3 : 2
    const totalFreePeople = freePeoplePerBottle * totalBottles
    const extraPeople = Math.max(0, tableForm.guest_count - totalFreePeople)
    const extraTicketsCost = extraPeople * (tableForm.extra_ticket_price || 0)
    const maxExtras = totalBottles
    return {
      drinksTotal,
      totalBottles,
      totalFreePeople,
      extraPeople,
      extraTicketsCost,
      maxExtras,
      total: drinksTotal + extraTicketsCost,
    }
  }, [tableForm])

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

  const promoRef = ref

  useEffect(() => {
    if (!slug) return
    const params = new URLSearchParams(window.location.search)
    fetch(`${API_BASE}/e/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        ref: promoRef || null,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
      }),
    }).catch(() => {})
    // window.gtag?.('event', 'page_view');
    // window.fbq?.('track', 'ViewContent');
    // window.ttq?.track('ViewContent');
  }, [slug, promoRef])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderParam = params.get('order')
    const statusParam = params.get('status')
    const errorCode = params.get('error_code')
    const errorDesc = params.get('error_description')

    if (orderParam && statusParam === 'success') {
      setPaymentResult({
        success: true,
        order_id: orderParam,
        message: 'התשלום בוצע בהצלחה! הכרטיס שלך בדרך אליך בWA 🎉',
      })
    } else if (orderParam && (statusParam === 'error' || statusParam === 'cancel')) {
      setPaymentResult({
        success: false,
        order_id: orderParam,
        message: errorDesc || 'התשלום נכשל — אנא נסה שנית',
        error_code: errorCode,
      })
    }
  }, [])

  const trackStep = useCallback((step) => {
    if (!slug) return
    fetch(`${API_BASE}/e/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: `abandon_step_${step}`,
        ref: promoRef || null,
      }),
    }).catch(() => {})
  }, [slug, promoRef])

  const trackField = useCallback(() => {
    if (!slug || !modalPhone) return
    fetch(`${API_BASE}/e/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'טופס חלקי',
        phone: modalPhone,
        first_name: modalFirstName,
        last_name: modalLastName,
        email: modalEmail,
        step: 'personal_details',
      }),
    }).catch(() => {})
  }, [slug, modalPhone, modalFirstName, modalLastName, modalEmail])

  const validateFields = useCallback(() => {
    const errors = {}

    if (!modalFirstName.trim()) errors.first_name = 'שם פרטי חובה'
    if (!modalLastName.trim()) errors.last_name = 'שם משפחה חובה'

    const phoneClean = modalPhone.replace(/\D/g, '')
    if (!phoneClean || phoneClean.length < 9) errors.phone = 'טלפון לא תקין'

    if (!modalEmail.trim()) errors.email = 'מייל חובה'
    if (modalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalEmail)) {
      errors.email = 'מייל לא תקין'
    }

    const idDigits = modalIdNumber.replace(/\D/g, '')
    if (event?.requires_id && idDigits.length !== 9) {
      errors.id_number = 'נדרשת תעודת זהות בת 9 ספרות'
    } else if (modalIdNumber && idDigits.length !== 9) {
      errors.id_number = 'ת.ז חייבת להכיל 9 ספרות'
    }

    if (!modalBirthDate) errors.birth_date = 'נדרש תאריך לידה'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [
    modalFirstName,
    modalLastName,
    modalPhone,
    modalEmail,
    modalIdNumber,
    modalBirthDate,
    event,
  ])

  const handleReserve = async () => {
    if (!modalTicket) return
    if (!validateFields()) return

    const regFields = event?.registration_fields || []
    const idDigits = modalIdNumber.replace(/\D/g, '')
    const mergedCustom = {
      ...customFields,
      first_name: modalFirstName,
      last_name: modalLastName,
      email: modalEmail,
      birth_date: modalBirthDate || '',
      gender: modalGender,
      customer_name: `${modalFirstName} ${modalLastName}`.trim(),
      phone: modalPhone,
      ...(idDigits.length === 9 ? { id_number: idDigits } : {}),
    }
    for (const f of regFields) {
      if (f.required && (mergedCustom[f.id] === undefined || mergedCustom[f.id] === '')) {
        toast.error(`נא למלא: ${f.label}`)
        return
      }
    }
    setPaying(true)
    try {
      const payload = {
        ticket_type_id: modalTicket.id,
        quantity: modalQty,
        buyer_name: `${modalFirstName} ${modalLastName}`.trim(),
        buyer_phone: modalPhone.trim(),
        buyer_email: modalEmail.trim() || undefined,
        customer_name: `${modalFirstName} ${modalLastName}`.trim(),
        first_name: modalFirstName,
        last_name: modalLastName,
        phone: modalPhone,
        email: modalEmail,
        ...(idDigits.length === 9 ? { id_number: idDigits } : {}),
        birth_date: modalBirthDate,
        gender: modalGender,
        ...(ref ? { ref } : {}),
        ...(event?.city_code && residentCity ? { resident_city: residentCity.trim() } : {}),
        custom_fields: mergedCustom,
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

  const { extraPeople, extraTicketsCost, total, totalFreePeople, maxExtras, totalBottles, drinksTotal } = calcTablePrice()

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
    const available = ticketAvailable(tt)
    const maxQ = Math.max(
      1,
      Math.min(tt.max_per_order || 10, available > 0 ? available : tt.max_per_order || 10),
    )
    const q = Math.min(Math.max(1, quantities[tt.id] || 1), maxQ)
    setModalQty(q)
    setModalTicket(tt)
    setSuccess(false)
    setPendingApproval(false)
    setModalFirstName('')
    setModalLastName('')
    setModalPhone('')
    setModalEmail('')
    setModalIdNumber('')
    setModalBirthDate(null)
    setModalGender('')
    setFieldErrors({})
    setResidentCity('')
    setCustomFields({})
    if (tt.ticket_category === 'table' && !tt.metadata?.seating_map_id) {
      const genTt =
        event?.ticket_types?.find((t) => String(t.ticket_category || '') === 'general')
        || event?.ticket_types?.find((t) => String(t.ticket_category || '') !== 'table')
      setTableStep(1)
      setTableForm({
        selected_drinks: {},
        extras_by_drink: {},
        drink_item_id: '',
        drink_name: '',
        drink_price: 0,
        drink_quantity: 1,
        free_rule: { people: 3, per_liter: 1, price_threshold: 1000, below_threshold_people: 2 },
        guest_count: 1,
        extra_tickets: 0,
        extra_ticket_price: Number(genTt?.price || 0),
        extras: [],
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_instagram: '',
        guests: [],
        payment_mode: 'full',
        split_count: 1,
      })
    }
    fetch(`${API_BASE}/e/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'modal_open',
        ticket_id: tt.id,
        ticket_category: tt.ticket_category,
        ref: promoRef || null,
      }),
    }).catch(() => {})
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff' }}>
      <div style={{
        maxWidth: 640,
        margin: '16px auto 0',
        padding: '0 16px',
      }}
      >
        <div style={{
          width: '100%',
          paddingBottom: '100%',
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: coverSrc
            ? undefined
            : `linear-gradient(135deg, ${primaryColor}33 0%, var(--v2-accent)22 100%)`,
        }}
        >
          {coverSrc && (
            <img
              src={event.cover_image_url || event.image_url}
              alt={event.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </div>
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
          quantities={quantities}
          setQuantities={setQuantities}
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

        {(event.description || event.rich_description) && (
          <div style={{ marginTop: 32 }}>
            <style>{`
  .event-description h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px; }
  .event-description h2 { font-size: 18px; font-weight: 700; margin: 0 0 10px; }
  .event-description strong { font-weight: 700; }
  .event-description p { margin: 0 0 8px; line-height: 1.7; }
  .event-description ul { padding-right: 20px; margin: 0 0 8px; }
  .event-description ol { padding-right: 20px; margin: 0 0 8px; }
  .event-description a { color: #00C37A; }
  .event-description hr { border-color: rgba(255,255,255,0.1); margin: 12px 0; }
`}</style>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>על האירוע</h2>
            <div
              className="event-description"
              dangerouslySetInnerHTML={{ __html: event.description || event.rich_description || '' }}
              style={{ direction: 'rtl', lineHeight: 1.7, fontSize: 15 }}
            />
          </div>
        )}

        <VenueSection event={event} />

        <FAQSection faqs={event.faq} />

        <OrganizerSection event={event} />
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
          onClick={() => setShowTicketDrawer(true)}
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

      {showTicketDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            aria-label="סגור"
            onClick={() => setShowTicketDrawer(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
          <div
            style={{
              position: 'relative',
              background: '#0a1628',
              borderRadius: '20px 20px 0 0',
              padding: '20px 16px 40px',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                margin: '0 auto 20px',
              }}
            />
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>בחר כרטיס</h3>
            {(event.ticket_types || []).map((tt) => {
              const available =
                tt.quantity_available
                ?? (tt.quantity_total - (tt.quantity_sold || 0) - (tt.quantity_reserved || 0))
              const isSoldOut = available <= 0
              const isTable = tt.ticket_category === 'table'
              const maxQ = Math.max(
                1,
                Math.min(tt.max_per_order || 10, available > 0 ? available : tt.max_per_order || 10),
              )
              const drawerBtn = event.display_config?.primary_color || '#00C37A'
              return (
                <div
                  key={tt.id}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isSoldOut ? 'rgba(255,255,255,0.1)' : 'rgba(0,195,122,0.3)'}`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{tt.name}</p>
                      {tt.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                          {tt.description}
                        </p>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#00C37A' }}>
                      ₪{Number(tt.price).toFixed(0)}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [tt.id]: Math.max(1, (q[tt.id] || 1) - 1),
                        }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'none',
                        color: '#fff',
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: 'center' }}
                    >
                      {quantities[tt.id] || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [tt.id]: Math.min(maxQ, (q[tt.id] || 1) + 1),
                        }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'none',
                        color: '#fff',
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      סה&quot;כ: ₪
                      {((quantities[tt.id] || 1) * Number(tt.price || 0)).toFixed(0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => {
                      selectTicket(tt)
                      setShowTicketDrawer(false)
                    }}
                    style={{
                      width: '100%',
                      height: 44,
                      borderRadius: 8,
                      border: 'none',
                      background: isSoldOut ? 'rgba(255,255,255,0.1)' : drawerBtn,
                      color: isSoldOut ? 'rgba(255,255,255,0.4)' : '#000',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSoldOut ? 'אזל המלאי' : isTable ? 'הזמן שולחן' : 'רכוש'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {modalTicket && modalTicket.ticket_category === 'table' && !modalTicket?.metadata?.seating_map_id && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={() => {
              if (!paying) {
                trackStep(tableStep)
                setModalTicket(null)
                setTableStep(1)
              }
            }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          />
          <div
            style={{
              position: 'relative',
              background: '#0a1628',
              borderRadius: '20px 20px 0 0',
              padding: '20px 16px 40px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TableBookingModalContent
              modalTicket={modalTicket}
              event={event}
              tableStep={tableStep}
              setTableStep={setTableStep}
              tableForm={tableForm}
              setTableForm={setTableForm}
              totalFreePeople={totalFreePeople}
              maxExtras={maxExtras}
              totalBottles={totalBottles}
              drinksTotal={drinksTotal}
              extraPeople={extraPeople}
              extraTicketsCost={extraTicketsCost}
              total={total}
              paying={paying}
              setPaying={setPaying}
              setModalTicket={setModalTicket}
              slug={slug}
              promoRef={ref}
              setSuccess={setSuccess}
              setPendingApproval={setPendingApproval}
              API_BASE={API_BASE}
              trackStep={trackStep}
            />
          </div>
        </div>
      )}

      {modalTicket && modalTicket.ticket_category !== 'table' && !modalTicket?.metadata?.seating_map_id && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 210,
          }}
          onClick={() => !paying && setModalTicket(null)}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              background: '#0a1628',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '20px 16px 40px',
              width: '100%',
              maxWidth: 480,
              maxHeight: '92vh',
              overflowY: 'auto',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                margin: '0 auto 16px',
              }}
            />
            <button
              type="button"
              onClick={() => setModalTicket(null)}
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>{modalTicket.name}</h3>
            {modalTicket.description && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>
                {modalTicket.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <input
                  value={modalFirstName}
                  onChange={(e) => {
                    setModalFirstName(e.target.value)
                    setFieldErrors((f) => ({ ...f, first_name: '' }))
                  }}
                  placeholder="שם פרטי *"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 15,
                    border: `1px solid ${fieldErrors.first_name ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.first_name && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>

              <div>
                <input
                  value={modalLastName}
                  onChange={(e) => {
                    setModalLastName(e.target.value)
                    setFieldErrors((f) => ({ ...f, last_name: '' }))
                  }}
                  placeholder="שם משפחה *"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 15,
                    border: `1px solid ${fieldErrors.last_name ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.last_name && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>
                    {fieldErrors.last_name}
                  </p>
                )}
              </div>

              <div>
                <input
                  value={modalPhone}
                  onChange={(e) => {
                    setModalPhone(e.target.value)
                    setFieldErrors((f) => ({ ...f, phone: '' }))
                  }}
                  onBlur={() => {
                    if (modalPhone) trackField()
                  }}
                  placeholder="טלפון נייד * (05X-XXXXXXX)"
                  type="tel"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 15,
                    border: `1px solid ${fieldErrors.phone ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.phone && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <input
                  value={modalEmail}
                  onChange={(e) => {
                    setModalEmail(e.target.value)
                    setFieldErrors((f) => ({ ...f, email: '' }))
                  }}
                  placeholder="מייל *"
                  type="email"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 15,
                    border: `1px solid ${fieldErrors.email ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.email && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <input
                  value={modalIdNumber}
                  onChange={(e) => {
                    setModalIdNumber(e.target.value)
                    setFieldErrors((f) => ({ ...f, id_number: '' }))
                  }}
                  placeholder="תעודת זהות *"
                  type="number"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 10,
                    fontSize: 15,
                    border: `1px solid ${fieldErrors.id_number ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '0 14px',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.id_number && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>
                    {fieldErrors.id_number}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}
                >
                  תאריך לידה *
                </label>
                <DateTimePicker
                  value={modalBirthDate}
                  onChange={(v) => {
                    setModalBirthDate(v)
                    setFieldErrors((f) => ({ ...f, birth_date: '' }))
                  }}
                  placeholder="בחר תאריך לידה"
                  dateOnly
                />
                {fieldErrors.birth_date && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>
                    {fieldErrors.birth_date}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'male', label: 'זכר' },
                  { value: 'female', label: 'נקבה' },
                  { value: 'other', label: 'אחר' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    role="presentation"
                    onClick={() => setModalGender(opt.value)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${modalGender === opt.value ? '#00C37A' : 'rgba(255,255,255,0.15)'}`,
                      background:
                        modalGender === opt.value ? 'rgba(0,195,122,0.15)' : 'rgba(255,255,255,0.05)',
                      color: modalGender === opt.value ? '#00C37A' : 'rgba(255,255,255,0.7)',
                      fontSize: 14,
                      fontWeight: modalGender === opt.value ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {event?.city_code && (
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    עיר מגורים{' '}
                    <span style={{ fontSize: 11, color: '#00C37A' }}>
                      (תושבי {event.city_name || 'העיר'} — מחיר מיוחד)
                    </span>
                  </label>
                  <input
                    value={residentCity}
                    onChange={(e) => setResidentCity(e.target.value)}
                    placeholder="שם העיר"
                    style={{
                      width: '100%',
                      height: 46,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      padding: '0 14px',
                      fontSize: 15,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {(event?.registration_fields || [])
                .filter((f) => !MODAL_SYSTEM_REG_IDS.has(f.id))
                .map((field) => (
                <div key={field.id}>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>

                  {(field.type === 'tel' || field.type === 'phone' || field.id === 'phone') && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      placeholder="05XXXXXXXX"
                      type="tel"
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {(field.type === 'email' || field.id === 'email') && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      placeholder="your@email.com"
                      type="email"
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {(field.type === 'id'
                    || field.type === 'identification'
                    || field.id === 'id_number') && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({
                          ...f,
                          [field.id]: e.target.value.replace(/\D/g, ''),
                        }))}
                      placeholder="000000000"
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      dir="ltr"
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {(field.type === 'name'
                    || field.type === 'full_name'
                    || field.id === 'first_name'
                    || field.id === 'last_name'
                    || field.id === 'name') && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      placeholder={field.id === 'last_name' ? 'שם משפחה' : 'שם פרטי'}
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {(field.type === 'gender'
                    || (field.id === 'gender' && field.type !== 'select')) && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { v: 'male', l: 'זכר' },
                        { v: 'female', l: 'נקבה' },
                        { v: 'other', l: 'אחר' },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() =>
                            setCustomFields((f) => ({ ...f, [field.id]: opt.v }))}
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: `2px solid ${customFields[field.id] === opt.v ? '#00C37A' : 'rgba(255,255,255,0.15)'}`,
                            background:
                              customFields[field.id] === opt.v
                                ? 'rgba(0,195,122,0.1)'
                                : 'rgba(255,255,255,0.05)',
                            color:
                              customFields[field.id] === opt.v
                                ? '#00C37A'
                                : 'rgba(255,255,255,0.7)',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === 'select' && field.id !== 'gender' && (
                    <div style={{ position: 'relative' }}>
                      <select
                        value={customFields[field.id] || ''}
                        onChange={(e) =>
                          setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          height: 46,
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: '#0f1c2e',
                          color: '#fff',
                          padding: '0 14px',
                          fontSize: 15,
                          appearance: 'none',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="">בחר...</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(255,255,255,0.4)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  )}

                  {field.type === 'select' && field.id === 'gender' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(field.options || ['זכר', 'נקבה', 'אחר']).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setCustomFields((f) => ({ ...f, [field.id]: opt }))}
                          style={{
                            flex: 1,
                            height: 44,
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: `2px solid ${customFields[field.id] === opt ? '#00C37A' : 'rgba(255,255,255,0.15)'}`,
                            background:
                              customFields[field.id] === opt
                                ? 'rgba(0,195,122,0.1)'
                                : 'rgba(255,255,255,0.05)',
                            color:
                              customFields[field.id] === opt
                                ? '#00C37A'
                                : 'rgba(255,255,255,0.7)',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === 'date' && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      type="date"
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: '#0f1c2e',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                        colorScheme: 'dark',
                      }}
                    />
                  )}

                  {field.type === 'text'
                    && field.id !== 'id_number'
                    && field.id !== 'first_name'
                    && field.id !== 'last_name'
                    && field.id !== 'name' && (
                    <input
                      value={customFields[field.id] || ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      placeholder={field.placeholder || ''}
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      value={customFields[field.id] ?? ''}
                      onChange={(e) =>
                        setCustomFields((f) => ({ ...f, [field.id]: e.target.value }))}
                      type="number"
                      placeholder={field.placeholder || ''}
                      style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '0 14px',
                        fontSize: 15,
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!customFields[field.id]}
                        onChange={(e) =>
                          setCustomFields((f) => ({ ...f, [field.id]: e.target.checked }))}
                      />
                      {field.placeholder}
                    </label>
                  )}
                </div>
              ))}

              {modalTicket.max_per_order > 1 && (
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.5)',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    כמות כרטיסים
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                        background: 'none',
                        color: '#fff',
                        fontSize: 22,
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{modalQty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalQty((q) => Math.min(modalTicket.max_per_order || 10, q + 1))}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: '2px solid #00C37A',
                        background: 'rgba(0,195,122,0.1)',
                        color: '#00C37A',
                        fontSize: 22,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {modalQty > 1 && modalTicket.price > 0 && (
                <div
                  style={{
                    background: 'rgba(0,195,122,0.05)',
                    borderRadius: 12,
                    padding: 14,
                    border: '1px solid rgba(0,195,122,0.15)',
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>
                    💳 איך לשלם?
                  </p>
                  {[
                    {
                      value: 'full',
                      label: 'אני משלם על הכולם',
                      sub: `₪${(modalTicket.price * modalQty).toLocaleString()}`,
                    },
                    {
                      value: 'split_equal',
                      label: 'נתחלק שווה',
                      sub: `₪${Math.ceil((modalTicket.price * modalQty) / modalQty).toLocaleString()} לאדם`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setModalPaymentMode(opt.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 6,
                        cursor: 'pointer',
                        textAlign: 'right',
                        border: `2px solid ${modalPaymentMode === opt.value ? '#00C37A' : 'rgba(255,255,255,0.1)'}`,
                        background:
                          modalPaymentMode === opt.value
                            ? 'rgba(0,195,122,0.1)'
                            : 'transparent',
                        color: '#fff',
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{opt.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {opt.sub}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {modalTicket.price > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    {modalQty > 1 ? `${modalQty} × ₪${modalTicket.price}` : 'מחיר'}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#00C37A' }}>
                    ₪{(modalTicket.price * modalQty).toLocaleString()}
                  </span>
                </div>
              )}

              {modalTicket.price === 0 && (
                <div
                  style={{
                    background: 'rgba(0,195,122,0.08)',
                    borderRadius: 10,
                    padding: 14,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#00C37A' }}>
                    {modalTicket.approval_required
                      ? '🎟 הרשמה חינמית — ממתין לאישור'
                      : '🎟 כרטיס חינמי'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleReserve}
                disabled={paying}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 12,
                  border: 'none',
                  background: paying ? 'rgba(255,255,255,0.1)' : '#00C37A',
                  color: paying ? 'rgba(255,255,255,0.3)' : '#000',
                  fontWeight: 800,
                  fontSize: 17,
                  cursor: paying ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {paying ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '3px solid rgba(0,0,0,0.3)',
                      borderTopColor: '#000',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : modalTicket.price === 0 ? (
                  modalTicket.approval_required ? 'שלח בקשת הרשמה' : 'אשר הרשמה חינמית'
                ) : (
                  `שלם ₪${(modalTicket.price * modalQty).toLocaleString()}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#1a1d2e',
              borderRadius: 16,
              padding: 32,
              maxWidth: 380,
              width: '100%',
              border: `1px solid ${paymentResult.success ? 'rgba(0,195,122,0.3)' : 'rgba(239,68,68,0.3)'}`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 48, margin: '0 0 16px' }}>
              {paymentResult.success ? '🎉' : '❌'}
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
              {paymentResult.success ? 'תשלום בוצע!' : 'תשלום נכשל'}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>
              {paymentResult.message}
            </p>
            <button
              type="button"
              onClick={() => {
                setPaymentResult(null)
                window.history.replaceState({}, '', window.location.pathname)
              }}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 10,
                border: 'none',
                background: paymentResult.success ? '#00C37A' : 'rgba(255,255,255,0.1)',
                color: paymentResult.success ? '#000' : '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {paymentResult.success ? 'מעולה!' : 'נסה שנית'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
