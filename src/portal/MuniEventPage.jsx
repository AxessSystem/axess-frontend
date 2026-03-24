import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  X,
} from 'lucide-react'
import { COLORS, MUNI_CATEGORIES } from './MuniPortal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontFamily: 'Heebo',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  display: 'block',
  marginBottom: 4,
}

const REG_DETAILS_FIELDS = [
  { id: 'full_name', label: 'שם מלא', type: 'text', required: true },
  { id: 'id_number', label: 'מספר ת"ז', type: 'text', required: true },
  { id: 'phone', label: 'מספר נייד', type: 'tel', required: true },
  { id: 'email', label: 'כתובת דוא"ל', type: 'email', required: true },
  { id: 'birth_date', label: 'תאריך לידה', type: 'date', required: true },
  { id: 'gender', label: 'מין', type: 'select', options: ['זכר', 'נקבה', 'אחר'], required: true },
]

const font = "'Heebo', system-ui, sans-serif"

const categoryLabel = (v) => MUNI_CATEGORIES.find((c) => c.value === v)?.label || v || 'אחר'

function formatEventWhen(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const dateStr = d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    return { line: `${dateStr} | ${timeStr}` }
  } catch {
    return null
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function isProbablyHtml(s) {
  return typeof s === 'string' && /<\/?[a-z][\s\S]*>/i.test(s)
}

const DEFAULT_FAQ = [
  { q: 'איך נרשמים לאירוע?', a: 'לוחצים על «הזמן עכשיו», בוחרים סוג כניסה ומספר כרטיסים, וממשיכים בתהליך ההרשמה המאובטח.' },
  { q: 'האירוע בתשלום?', a: 'המחיר מוצג ליד כל סוג כניסה. אירועים חינמיים מסומנים בבאדג\' ירוק.' },
  { q: 'איפה מקבלים את הכרטיס?', a: 'לאחר השלמת ההרשמה תקבלו עדכון לנייד בהתאם להגדרות האירוע.' },
]

function normalizeFaq(raw) {
  if (!Array.isArray(raw) || !raw.length) return DEFAULT_FAQ
  const out = raw
    .map((item) => {
      if (typeof item === 'object' && item) {
        const q = item.q || item.question || item.title
        const a = item.a || item.answer || item.body
        if (q && a) return { q, a }
      }
      return null
    })
    .filter(Boolean)
  return out.length ? out : DEFAULT_FAQ
}

function useIsDesktop(bp = 900) {
  const [w, setW] = useState(typeof window !== 'undefined' && window.innerWidth >= bp)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${bp}px)`)
    const fn = () => setW(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [bp])
  return w
}

export default function MuniEventPage() {
  const { citySlug, eventSlug } = useParams()
  const [business, setBusiness] = useState(null)
  const [departments, setDepartments] = useState([])
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState('tickets')
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: '',
  })
  const [errors, setErrors] = useState({})
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quantities, setQuantities] = useState({})
  const [openFaq, setOpenFaq] = useState(() => ({}))

  const isDesktop = useIsDesktop()

  const externalUrl = useMemo(() => {
    if (!event) return ''
    const s = event.settings && typeof event.settings === 'object' ? event.settings : {}
    return (event.external_url || s.external_url || '').trim()
  }, [event])

  const contact = useMemo(() => {
    if (!event?.contact_info || typeof event.contact_info !== 'object') return {}
    return event.contact_info
  }, [event])

  const faqItems = useMemo(() => {
    const s = event?.settings && typeof event.settings === 'object' ? event.settings : {}
    return normalizeFaq(event?.faq || s.faq)
  }, [event])

  const load = useCallback(async () => {
    if (!citySlug || !eventSlug) return
    setLoading(true)
    setErr(null)
    try {
      const [br, er] = await Promise.all([
        fetch(`${API_BASE}/api/portal/${encodeURIComponent(citySlug)}`),
        fetch(`${API_BASE}/api/portal/${encodeURIComponent(citySlug)}/event/${encodeURIComponent(eventSlug)}`),
      ])
      const bData = await br.json().catch(() => ({}))
      const eData = await er.json().catch(() => ({}))
      if (!br.ok) throw new Error(bData.error || 'פורטל לא נמצא')
      if (!er.ok) throw new Error(eData.error || 'אירוע לא נמצא')
      setBusiness(bData.business)
      setDepartments(bData.departments || [])
      setEvent(eData.event)
      const tt = eData.ticket_types || []
      setTicketTypes(tt)
      const init = {}
      tt.forEach((t) => {
        init[t.id] = 0
      })
      setQuantities(init)
    } catch (e) {
      setErr(e.message || 'שגיאה')
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }, [citySlug, eventSlug])

  useEffect(() => {
    load()
  }, [load])

  const totalPay = useMemo(() => {
    if (!ticketTypes.length) return 0
    return ticketTypes.reduce((sum, tt) => {
      const q = quantities[tt.id] || 0
      return sum + q * Number(tt.price || 0)
    }, 0)
  }, [ticketTypes, quantities])

  const hasAnyTickets = useMemo(() => ticketTypes.some((tt) => (quantities[tt.id] || 0) > 0), [ticketTypes, quantities])

  const selectedTickets = useMemo(() => {
    return ticketTypes
      .map((tt) => ({
        id: tt.id,
        name: tt.name,
        price: Number(tt.price || 0),
        quantity: quantities[tt.id] || 0,
      }))
      .filter((t) => t.quantity > 0)
  }, [ticketTypes, quantities])

  const totalPrice = totalPay

  const showInlineCheckout = !externalUrl && ticketTypes.length > 0

  useEffect(() => {
    if (!hasAnyTickets) {
      setStep('tickets')
      setPaymentMethod(null)
      setErrors({})
      return
    }
    setStep((s) => (s === 'tickets' ? 'details' : s))
  }, [hasAnyTickets])

  const allFree = useMemo(
    () => ticketTypes.length > 0 && ticketTypes.every((tt) => Number(tt.price || 0) === 0),
    [ticketTypes]
  )

  const minPrice = useMemo(() => {
    if (!ticketTypes.length) return null
    return Math.min(...ticketTypes.map((t) => Number(t.price || 0)))
  }, [ticketTypes])

  const orderTicketLabel =
    minPrice == null ? 'הזמן כרטיס' : minPrice === 0 ? 'הזמן כרטיס — חינם' : `הזמן כרטיס — מ-₪${minPrice.toFixed(0)}`

  const adjustQty = (id, delta, maxPer) => {
    setQuantities((prev) => {
      const cur = prev[id] || 0
      const next = Math.min(maxPer, Math.max(0, cur + delta))
      return { ...prev, [id]: next }
    })
  }

  if (loading) {
    return (
      <div
        dir="rtl"
        lang="he"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.background,
          fontFamily: font,
        }}
      >
        <Loader2 size={40} aria-hidden style={{ color: COLORS.primary, animation: 'spin 0.9s linear infinite' }} />
        <span className="sr-only">טוען אירוע</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
      </div>
    )
  }

  if (err || !event) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', padding: 24, background: COLORS.background, fontFamily: font }}>
        <main style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.text }}>האירוע לא נמצא</h1>
          <p style={{ fontSize: '1.125rem', color: COLORS.textLight }}>{err}</p>
          <Link to={`/muni/${citySlug}`} style={{ display: 'inline-block', marginTop: 20, fontSize: '1.125rem', color: COLORS.primary, fontWeight: 700 }}>
            חזרה לפורטל
          </Link>
        </main>
      </div>
    )
  }

  const logoUrl = business?.brand_assets?.logo_url || business?.brand_assets?.banner_image
  const hero = event.cover_image_url || event.image_url
  const when = formatEventWhen(event.date)
  const deptPhone = event.dept_phone || contact.phone

  const rich = event.rich_description
  const plainDesc = event.description

  const registrationFields = Array.isArray(event.registration_fields) ? event.registration_fields : []

  const handleExternalTrack = async () => {
    if (!externalUrl || !event?.id) return
    try {
      const r = await fetch(`${API_BASE}/api/portal/${encodeURIComponent(citySlug)}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          external_url: externalUrl,
          external_platform: 'portal',
          sub_account_id: event.sub_account_id || null,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.redirect_url) {
        window.location.href = data.redirect_url
        return
      }
    } catch {
      /* fallback below */
    }
    window.open(externalUrl, '_blank', 'noopener,noreferrer')
  }

  const validateDetails = () => {
    const newErrors = {}
    const required = ['full_name', 'id_number', 'phone', 'email', 'birth_date', 'gender']
    required.forEach((field) => {
      const v = formData[field]
      if (!v || String(v).trim() === '') {
        newErrors[field] = true
      }
    })
    registrationFields.forEach((field) => {
      const fid = String(field.id)
      if (field.required && (!formData[fid] || String(formData[fid]).trim() === '')) {
        newErrors[fid] = true
      }
    })
    if (!agreedTerms) newErrors.terms = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0]
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const handleContinue = () => {
    if (!validateDetails()) return
    if (totalPrice === 0) {
      setStep('success')
    } else {
      setPaymentMethod(null)
      setStep('payment')
    }
  }

  const getInputStyle = (fieldId) => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${errors[fieldId] ? '#ef4444' : '#e5e7eb'}`,
    fontFamily: 'Heebo',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: errors[fieldId] ? '#fef2f2' : '#fff',
  })

  const ticketDrawerInner = (
    <>
      <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: COLORS.text }}>כרטיסים</h2>
      {allFree && (
        <div
          style={{
            display: 'inline-block',
            marginBottom: 12,
            padding: '6px 14px',
            borderRadius: 999,
            background: COLORS.accent,
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          הרשמה חינם
        </div>
      )}
      {ticketTypes.length === 0 ? (
        <p style={{ color: COLORS.textLight, margin: '0 0 12px' }}>אין סוגי כניסה זמינים בפורטל כרגע.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ticketTypes.map((tt) => {
            const max = Math.min(parseInt(tt.max_per_order || 10, 10), 10)
            const avail =
              tt.quantity_total != null
                ? Math.max(0, (tt.quantity_total || 0) - (tt.quantity_sold || 0) - (tt.quantity_reserved || 0))
                : null
            const q = quantities[tt.id] || 0
            const price = Number(tt.price || 0)
            return (
              <li
                key={tt.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: '#fafbfc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.text }}>{tt.name}</div>
                    {tt.description && <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 4 }}>{tt.description}</div>}
                    <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 6 }}>
                      {avail != null ? `זמינות: ${avail}` : 'זמינות: —'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: COLORS.primary, whiteSpace: 'nowrap', fontSize: 15 }}>
                    {price === 0 ? 'חינם' : `₪${price.toFixed(0)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 14, color: COLORS.textLight }}>כמות</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      aria-label="הפחת"
                      onClick={() => adjustQty(tt.id, -1, max)}
                      disabled={q <= 0}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.cardBg,
                        cursor: q <= 0 ? 'default' : 'pointer',
                        opacity: q <= 0 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{ fontWeight: 800, minWidth: 24, textAlign: 'center' }}>{q}</span>
                    <button
                      type="button"
                      aria-label="הוסף"
                      onClick={() => adjustQty(tt.id, 1, max)}
                      disabled={q >= max || (avail != null && q >= avail)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.cardBg,
                        cursor: q >= max || (avail != null && q >= avail) ? 'default' : 'pointer',
                        opacity: q >= max || (avail != null && q >= avail) ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>סה״כ לתשלום</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, fontFamily: font }}>₪{totalPay.toFixed(0)}</span>
        </div>

        {externalUrl && (
          <button
            type="button"
            onClick={handleExternalTrack}
            style={{
              width: '100%',
              minHeight: 50,
              borderRadius: 12,
              border: 'none',
              background: COLORS.primary,
              color: '#fff',
              fontWeight: 800,
              fontSize: 17,
              cursor: 'pointer',
              fontFamily: font,
            }}
          >
            המשך לרישום באתר חיצוני
          </button>
        )}

        {!externalUrl && ticketTypes.length === 0 && event.slug && (
          <Link
            to={`/e/${event.slug}`}
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 50,
              borderRadius: 12,
              border: 'none',
              background: COLORS.primary,
              color: '#fff',
              fontWeight: 800,
              fontSize: 17,
              textDecoration: 'none',
              fontFamily: font,
            }}
          >
            פתח דף הרשמה
          </Link>
        )}

        {showInlineCheckout && !hasAnyTickets && (
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 8, textAlign: 'center' }}>בחרו לפחות כרטיס אחד</p>
        )}

        {showInlineCheckout && hasAnyTickets && (
          <div
            style={{
              marginTop: 16,
              maxHeight: step !== 'tickets' ? 8000 : 0,
              opacity: step !== 'tickets' ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.4s ease, opacity 0.4s ease',
            }}
          >
            {step === 'details' && (
              <div
                style={{
                  marginTop: 16,
                  padding: 20,
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{event.title}</p>
                  {selectedTickets.map((t) => (
                    <p key={t.id} style={{ fontSize: 14, color: '#6b7280' }}>
                      {t.quantity} × {t.name} — ₪{t.price * t.quantity}
                    </p>
                  ))}
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: '#1877F2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px',
                    fontFamily: 'Heebo',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span>f</span> הזדהה עם Facebook
                </button>

                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>או</div>

                {REG_DETAILS_FIELDS.map((field) => (
                  <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#374151',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {field.label} *
                    </label>
                    {field.type === 'select' ? (
                      <select
                        style={getInputStyle(field.id)}
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                          if (errors[field.id]) setErrors((prev) => ({ ...prev, [field.id]: false }))
                        }}
                      >
                        <option value="">בחר...</option>
                        {field.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        style={getInputStyle(field.id)}
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                          if (errors[field.id]) setErrors((prev) => ({ ...prev, [field.id]: false }))
                        }}
                      />
                    )}
                    {errors[field.id] && (
                      <span style={{ color: '#ef4444', fontSize: 12, display: 'block', marginTop: 4 }}>שדה חובה</span>
                    )}
                  </div>
                ))}

                {registrationFields.map((field) => {
                  const fid = String(field.id)
                  return (
                    <div key={fid} id={`field-${fid}`} style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#374151',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {field.label} {field.required && '*'}
                      </label>
                      <input
                        type={field.type || 'text'}
                        style={getInputStyle(fid)}
                        value={formData[fid] || ''}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, [fid]: e.target.value }))
                          if (errors[fid]) setErrors((prev) => ({ ...prev, [fid]: false }))
                        }}
                      />
                      {errors[fid] && (
                        <span style={{ color: '#ef4444', fontSize: 12, display: 'block', marginTop: 4 }}>שדה חובה</span>
                      )}
                    </div>
                  )
                })}

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginTop: 2 }} />
                    <span>זהה אותי תמיד — הרשמה חד פעמית לכל האירועים</span>
                  </label>
                  <div id="field-terms">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => {
                          setAgreedTerms(e.target.checked)
                          if (errors.terms) setErrors((prev) => ({ ...prev, terms: false }))
                        }}
                        style={{ marginTop: 2 }}
                      />
                      <span>
                        קראתי ואני מסכים/ה ל
                        <a href="#" style={{ color: '#0a1628', textDecoration: 'underline' }}>
                          תקנון
                        </a>{' '}
                        ול
                        <a href="#" style={{ color: '#0a1628', textDecoration: 'underline' }}>
                          מדיניות הביטולים
                        </a>
                      </span>
                    </label>
                    {errors.terms && (
                      <span style={{ color: '#ef4444', fontSize: 12, display: 'block', marginTop: 4 }}>יש לאשר את התקנון</span>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginTop: 2 }} />
                    <span>אני מאשר/ת קבלת עדכונים על אירועים חדשים</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  style={{
                    width: '100%',
                    background: '#0a1628',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 25,
                    padding: '14px',
                    fontFamily: 'Heebo',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    marginTop: 16,
                  }}
                >
                  המשך לתשלום →
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div
                style={{
                  marginTop: 16,
                  padding: 20,
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 8 }}>
                  {selectedTickets.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>
                        {t.quantity} × {t.name}
                      </span>
                      <span>₪{t.price * t.quantity}</span>
                    </div>
                  ))}
                  <div
                    style={{
                      borderTop: '1px solid #e5e7eb',
                      marginTop: 8,
                      paddingTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                    }}
                  >
                    <span>סה״כ לתשלום</span>
                    <span>₪{totalPrice.toFixed(0)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod((m) => (m === 'apple' ? null : 'apple'))}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      border: paymentMethod === 'apple' ? '2px solid #fff' : '1px solid #e5e7eb',
                      background: '#000',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-pressed={paymentMethod === 'apple'}
                  >
                    <svg width="50" height="20" viewBox="0 0 50 20" fill="white" aria-hidden>
                      <text x="0" y="15" fontFamily="'-apple-system', sans-serif" fontSize="13" fontWeight="500" fill="white">
                        Pay
                      </text>
                      <path
                        d="M6 4C6.8 2.8 7.2 1.4 7 0 5.8 0.1 4.4 0.8 3.5 1.9 2.7 2.9 2.2 4.3 2.5 5.6 3.8 5.7 5.1 5 6 4Z"
                        fill="white"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod((m) => (m === 'google' ? null : 'google'))}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 8,
                      border: paymentMethod === 'google' ? '2px solid #4285F4' : '1px solid #e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                    aria-pressed={paymentMethod === 'google'}
                  >
                    <svg width="41" height="17" viewBox="0 0 41 17" aria-hidden>
                      <path
                        d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.652-1.559.978-2.583.978h-2.485z"
                        fill="#EA4335"
                      />
                      <path
                        d="M27.379 4.57c1.134 0 2.028.302 2.68.906.652.605.978 1.437.978 2.494v5.02h-1.437v-1.13h-.067c-.63.93-1.466 1.394-2.509 1.394-.89 0-1.638-.264-2.243-.793-.605-.529-.907-1.19-.907-1.985 0-.84.318-1.508.954-2.004.636-.505 1.483-.757 2.54-.757 1.008 0 1.836.185 2.484.555v-.39c0-.59-.235-1.09-.706-1.5-.47-.41-1.02-.615-1.65-.615-.95 0-1.702.4-2.256 1.2l-1.32-.83c.768-1.1 1.92-1.652 3.46-1.652zm-2.088 6.137c0 .396.168.727.504.995.336.268.74.402 1.212.402.655 0 1.232-.244 1.732-.73.5-.487.75-1.057.75-1.712-.47-.37-1.126-.555-1.97-.555-.613 0-1.12.148-1.523.445-.4.297-.705.685-.705 1.155z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M38.71 4.82L34.362 15h-1.56l1.69-3.66-2.998-6.52h1.644l2.155 4.96h.034l2.088-4.96z"
                        fill="#34A853"
                      />
                      <path
                        d="M13.45 7.737c0-.464-.04-.91-.116-1.34H6.9v2.545h3.67c-.158.854-.638 1.578-1.36 2.063v1.71h2.203c1.29-1.19 2.037-2.943 2.037-4.978z"
                        fill="#4285F4"
                      />
                      <path
                        d="M6.9 13.5c1.84 0 3.382-.61 4.51-1.655l-2.203-1.71c-.61.41-1.39.65-2.308.65-1.777 0-3.284-1.2-3.822-2.81H.81v1.765C1.93 12.04 4.228 13.5 6.9 13.5z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.078 7.975c-.137-.41-.215-.847-.215-1.3s.078-.89.215-1.3V3.61H.81C.295 4.63 0 5.78 0 6.675c0 .896.295 2.045.81 3.065l2.268-1.765z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M6.9 2.56c1.003 0 1.902.345 2.608 1.02l1.957-1.957C10.28 .54 8.74 0 6.9 0 4.228 0 1.93 1.46.81 3.61l2.268 1.766C3.616 3.76 5.123 2.56 6.9 2.56z"
                        fill="#EA4335"
                      />
                    </svg>
                  </button>
                </div>

                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>
                  או תשלום באמצעות אמצעי אחר
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod((m) => (m === 'credit' ? null : 'credit'))}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: '#fff',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontFamily: 'Heebo',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    <span>💳 כרטיס אשראי</span>
                    <span>{paymentMethod === 'credit' ? '▲' : '▼'}</span>
                  </button>

                  {paymentMethod === 'credit' && (
                    <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>שם בעל הכרטיס</label>
                        <input type="text" placeholder="ישראל ישראלי" style={inputStyle} />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>מספר נייד</label>
                        <input type="tel" placeholder="050-0000000" style={inputStyle} />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>מספר כרטיס אשראי</label>
                        <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>תוקף</label>
                          <input type="text" placeholder="MM/YY" maxLength={5} style={inputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>CVV</label>
                          <input type="text" placeholder="123" maxLength={4} style={inputStyle} />
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
                        <input type="checkbox" />
                        <span>אני לא רובוט</span>
                      </label>
                    </div>
                  )}
                </div>

                {paymentMethod === 'apple' && (
                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 25,
                      padding: '14px',
                      fontFamily: 'Heebo',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                  >
                    שלם עם Apple Pay — ₪{totalPrice.toFixed(0)}
                  </button>
                )}
                {paymentMethod === 'google' && (
                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: '#fff',
                      color: '#0a1628',
                      border: '1px solid #e5e7eb',
                      borderRadius: 25,
                      padding: '14px',
                      fontFamily: 'Heebo',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                  >
                    שלם עם Google Pay — ₪{totalPrice.toFixed(0)}
                  </button>
                )}
                {paymentMethod === 'credit' && (
                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: '#0a1628',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 25,
                      padding: '14px',
                      fontFamily: 'Heebo',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                  >
                    ביצוע תשלום — ₪{totalPrice.toFixed(0)}
                  </button>
                )}
              </div>
            )}

            {step === 'success' && (
              <div
                style={{
                  marginTop: 16,
                  padding: 24,
                  background: '#f0fdf4',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎫</div>
                  <h2
                    style={{
                      fontFamily: 'Heebo',
                      fontWeight: 800,
                      fontSize: 22,
                      color: '#0a1628',
                      marginBottom: 8,
                      marginTop: 0,
                    }}
                  >
                    הכרטיס שלך לאירוע בדרך אליך!
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>{event.title}</p>
                  <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
                    📅 {formatDate(event.date)} | 📍 {event.location || '—'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )

  const titleSection = (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.1rem)', fontWeight: 900, margin: '0 0 12px', color: COLORS.text, lineHeight: 1.2 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textLight, margin: '0 0 8px' }}>קטגוריה: {categoryLabel(event.event_category)}</p>
      {event.dept_name && <p style={{ fontSize: 14, color: COLORS.textLight, margin: '0 0 12px' }}>מחלקה: {event.dept_name}</p>}
      {when && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, margin: '10px 0', color: COLORS.text, fontWeight: 700 }}>
          <Calendar size={22} aria-hidden style={{ color: COLORS.accent }} />
          {when.line}
        </p>
      )}
      {event.location && (
        <a
          href={event.location_url || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 18, color: COLORS.primary, fontWeight: 800 }}
        >
          <MapPin size={22} aria-hidden style={{ color: COLORS.accent }} />
          {event.location}
        </a>
      )}
    </div>
  )

  const descriptionSection =
    plainDesc || rich ? (
      <div style={{ marginTop: 8 }}>
        <div style={{ height: 1, background: COLORS.accent, margin: '0 0 24px', opacity: 0.9 }} />
        {plainDesc && (
          <p style={{ fontSize: 17, lineHeight: 1.75, color: COLORS.text, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{plainDesc}</p>
        )}
        {rich &&
          (isProbablyHtml(rich) ? (
            <div
              dir="rtl"
              style={{ fontSize: 17, lineHeight: 1.75, color: COLORS.text }}
              dangerouslySetInnerHTML={{ __html: rich }}
            />
          ) : (
            <div style={{ fontSize: 17, lineHeight: 1.75, color: COLORS.text, whiteSpace: 'pre-wrap' }}>{rich}</div>
          ))}
      </div>
    ) : null

  const faqSection = (
      <section aria-labelledby="faq-h" style={{ marginTop: 36 }}>
        <h2 id="faq-h" style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px', color: COLORS.text }}>
          שאלות נפוצות
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {faqItems.map((item, i) => {
            const open = !!openFaq[i]
            return (
              <li key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq((p) => ({ ...p, [i]: !p[i] }))}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.text,
                    textAlign: 'right',
                  }}
                >
                  {item.q}
                  {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {open && <p style={{ margin: '0 0 14px', fontSize: 15, color: COLORS.textLight, lineHeight: 1.65 }}>{item.a}</p>}
              </li>
            )
          })}
        </ul>
      </section>
  )

  const contactSection =
    deptPhone || contact.whatsapp || contact.email ? (
        <section aria-labelledby="contact-heading" style={{ marginTop: 36 }}>
          <h2 id="contact-heading" style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px', color: COLORS.text }}>
            צור קשר
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deptPhone && (
              <a
                href={`tel:${String(deptPhone).replace(/\s/g, '')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  textDecoration: 'none',
                  color: COLORS.text,
                  fontWeight: 600,
                  background: COLORS.cardBg,
                }}
              >
                <Phone size={20} style={{ color: COLORS.accent }} />
                טלפון מחלקה: {deptPhone}
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  textDecoration: 'none',
                  color: COLORS.text,
                  fontWeight: 600,
                  background: COLORS.cardBg,
                }}
              >
                <MessageCircle size={20} style={{ color: COLORS.accent }} />
                WhatsApp
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  textDecoration: 'none',
                  color: COLORS.text,
                  fontWeight: 600,
                  background: COLORS.cardBg,
                }}
              >
                <Mail size={20} style={{ color: COLORS.accent }} />
                {contact.email}
              </a>
            )}
          </div>
        </section>
    ) : null

  return (
    <div
      dir="rtl"
      lang="he"
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        maxWidth: '100vw',
        position: 'relative',
        background: COLORS.background,
        color: COLORS.text,
        fontFamily: font,
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .muni-event-btn { min-height: 52px; padding: 0 22px; border-radius: 14px; font-size: 1.05rem; font-weight: 800; border: none; cursor: pointer; background: ${COLORS.primary}; color: #fff; font-family: ${font}; }
        .muni-event-btn:focus-visible { outline: 3px solid rgba(0,195,122,0.45); outline-offset: 2px; }
        .muni-event-secondary { background: #fff; color: ${COLORS.primary}; border: 2px solid ${COLORS.primary}; }
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
      `}</style>

      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              aria-label="תפריט"
              onClick={() => setMenuOpen(true)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 6,
                cursor: 'pointer',
                color: COLORS.primary,
                borderRadius: 8,
              }}
            >
              <Menu size={24} />
            </button>
            <button
              type="button"
              style={{
                minHeight: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: 'none',
                background: COLORS.primary,
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: font,
              }}
            >
              התחבר
            </button>
          </div>
          <Link to={`/muni/${citySlug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: COLORS.text, minWidth: 0 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="" width={40} height={40} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.primary}, #2d5a8a)`, flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: 800, fontSize: 15, maxWidth: 140, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event?.dept_name || business?.name || ''}
            </span>
          </Link>
        </div>
      </header>

      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ניווט"
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.45)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(320px, 88vw)',
              background: COLORS.background,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              padding: 20,
              overflowY: 'auto',
              fontFamily: font,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontWeight: 800, fontSize: 18 }}>מחלקות</span>
              <button type="button" aria-label="סגור" onClick={() => setMenuOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={28} color={COLORS.primary} />
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to={`/muni/${citySlug}`}
                onClick={() => setMenuOpen(false)}
                style={{ padding: 12, borderRadius: 10, textDecoration: 'none', color: COLORS.text, fontWeight: 600, border: `1px solid ${COLORS.border}` }}
              >
                פורטל כללי
              </Link>
              {departments.map((d) =>
                d.portal_slug ? (
                  <Link
                    key={d.id}
                    to={`/muni/${citySlug}/${encodeURIComponent(d.portal_slug)}`}
                    onClick={() => setMenuOpen(false)}
                    style={{ padding: 12, borderRadius: 10, textDecoration: 'none', color: COLORS.text, fontWeight: 600, border: `1px solid ${COLORS.border}` }}
                  >
                    {d.name}
                  </Link>
                ) : null
              )}
            </nav>
          </div>
        </div>
      )}

      <div style={{ marginTop: 60, paddingBottom: 80 }}>
        <div style={{ width: '100%' }}>
          {hero ? (
            <img
              src={hero}
              alt=""
              style={{
                width: '100%',
                height: isDesktop ? 400 : 300,
                objectFit: 'cover',
                display: 'block',
                borderRadius: 0,
              }}
            />
          ) : (
            <div style={{ width: '100%', height: isDesktop ? 400 : 300, background: `linear-gradient(135deg, ${COLORS.primary}, #1a3050)` }} />
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 24px' }}>
          {titleSection}
          {descriptionSection}
          {faqSection}
          {contactSection}
        </div>

        <footer
          role="contentinfo"
          style={{
            background: COLORS.background,
            borderTop: `1px solid ${COLORS.accent}`,
            padding: '24px 16px 20px',
            fontSize: 12,
            color: COLORS.text,
            fontFamily: font,
          }}
        >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', marginBottom: 14 }}>
            {['תנאי שימוש', 'אודות', 'פרטיות', 'ביטולים', 'בקשת ביטול'].map((t) => (
              <a key={t} href="#" style={{ color: COLORS.text, textDecoration: 'none', fontWeight: 500 }}>
                {t}
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <button
              type="button"
              style={{
                padding: '12px 24px',
                borderRadius: 999,
                border: 'none',
                background: COLORS.accent,
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: font,
              }}
            >
              הרשמה חד פעמית לכל האירועים
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            {['facebook', 'instagram', 'youtube'].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${COLORS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.primary,
                  textDecoration: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {s[0].toUpperCase()}
              </a>
            ))}
          </div>
          <div
            style={{
              textAlign: 'center',
              paddingTop: 16,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <a
              href="https://axess.pro"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: COLORS.textLight,
                fontSize: 12,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              Powered by
              <span style={{ color: COLORS.accent, fontWeight: 700, fontFamily: 'Heebo, sans-serif' }}>AXESS</span>
            </a>
          </div>
        </div>
      </footer>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#fff',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          borderRadius: '16px 16px 0 0',
          padding: 16,
          transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 70px))',
          transition: 'transform 0.3s ease',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            width: '100%',
            background: COLORS.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 25,
            padding: '14px',
            fontFamily: 'Heebo',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {drawerOpen ? '✕ סגור' : orderTicketLabel}
        </button>
        {drawerOpen && <div style={{ marginTop: 16 }}>{ticketDrawerInner}</div>}
      </div>

    </div>
  )
}
