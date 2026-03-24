import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
} from 'lucide-react'
import { COLORS, MUNI_CATEGORIES } from './MuniPortal'
import SmartRegistrationModal from '../components/SmartRegistration/SmartRegistrationModal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const font = "'Heebo', system-ui, sans-serif"

const categoryLabel = (v) => MUNI_CATEGORIES.find((c) => c.value === v)?.label || v || 'אחר'

function portalCssVars() {
  return {
    '--muni-primary': COLORS.primary,
    '--muni-secondary': COLORS.accent,
    '--muni-page-bg': COLORS.background,
    '--muni-surface': COLORS.cardBg,
    '--muni-text': COLORS.text,
    '--muni-muted': COLORS.textLight,
    '--muni-border': COLORS.border,
  }
}

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
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [quantities, setQuantities] = useState({})
  const [openFaq, setOpenFaq] = useState(() => ({}))

  const isDesktop = useIsDesktop()
  const cssVars = useMemo(() => portalCssVars(), [])

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

  const allFree = useMemo(
    () => ticketTypes.length > 0 && ticketTypes.every((tt) => Number(tt.price || 0) === 0),
    [ticketTypes]
  )

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

  const logoUrl = business?.brand_assets?.logo_url
  const hero = event.cover_image_url || event.image_url
  const when = formatEventWhen(event.date)
  const deptPhone = event.dept_phone || contact.phone

  const rich = event.rich_description
  const plainDesc = event.description

  const ticketPanel = (
    <aside
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 28px rgba(10,22,40,0.1)',
      }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 800, color: COLORS.text }}>כרטיסים</h2>
      {allFree && (
        <div
          style={{
            display: 'inline-block',
            marginBottom: 14,
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
        <p style={{ color: COLORS.textLight, margin: 0 }}>אין סוגי כניסה זמינים בפורטל — השלימו בדף ההרשמה המלא.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  padding: 14,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: '#fafbfc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>{tt.name}</div>
                    {tt.description && <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 4 }}>{tt.description}</div>}
                    <div style={{ fontSize: 13, color: COLORS.textLight, marginTop: 6 }}>
                      {avail != null ? `זמינות: ${avail}` : 'זמינות: —'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: COLORS.primary, whiteSpace: 'nowrap' }}>
                    {price === 0 ? 'חינם' : `₪${price.toFixed(0)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
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
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>סה״כ לתשלום</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, fontFamily: font }}>₪{totalPay.toFixed(0)}</span>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!externalUrl && ticketTypes.length > 0 && !hasAnyTickets}
          style={{
            width: '100%',
            minHeight: 50,
            borderRadius: 12,
            border: 'none',
            background: COLORS.primary,
            color: '#fff',
            fontWeight: 800,
            fontSize: 17,
            cursor: !externalUrl && ticketTypes.length > 0 && !hasAnyTickets ? 'not-allowed' : 'pointer',
            opacity: !externalUrl && ticketTypes.length > 0 && !hasAnyTickets ? 0.5 : 1,
            fontFamily: font,
          }}
        >
          הזמן עכשיו
        </button>
        {!externalUrl && ticketTypes.length > 0 && !hasAnyTickets && (
          <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 8, textAlign: 'center' }}>בחרו לפחות כרטיס אחד</p>
        )}
      </div>
    </aside>
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
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: COLORS.background, color: COLORS.text, fontFamily: font }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .muni-event-btn { min-height: 52px; padding: 0 22px; border-radius: 14px; font-size: 1.05rem; font-weight: 800; border: none; cursor: pointer; background: ${COLORS.primary}; color: #fff; font-family: ${font}; }
        .muni-event-btn:focus-visible { outline: 3px solid rgba(0,195,122,0.45); outline-offset: 2px; }
        .muni-event-secondary { background: #fff; color: ${COLORS.primary}; border: 2px solid ${COLORS.primary}; }
        .muni-portal-header { display: flex !important; flex-direction: column; width: 100%; }
        .muni-portal-header-inner { display: flex !important; width: 100%; }
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
      `}</style>

      <header
        className="muni-portal-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="muni-portal-header-inner"
          style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 16px', alignItems: 'center', gap: 14 }}
        >
          <Link to={`/muni/${citySlug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: COLORS.text, fontSize: 16, fontWeight: 700 }}>
            <ArrowRight size={22} aria-hidden />
            חזרה
          </Link>
          {logoUrl && <img src={logoUrl} alt="" width={44} height={44} style={{ borderRadius: 10, marginRight: 'auto' }} />}
        </div>
      </header>

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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 100px' }}>
        {titleSection}
        {ticketPanel}
        {descriptionSection}
        {faqSection}
        {contactSection}

        {!externalUrl && (
          <div style={{ marginTop: 24 }}>
            <Link
              to={`/e/${event.slug}`}
              className="muni-event-btn muni-event-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', width: '100%', maxWidth: 400 }}
            >
              דף הרשמה מלא (תשלום מאובטח)
            </Link>
          </div>
        )}
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

      <SmartRegistrationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        citySlug={citySlug}
        event={event}
        ticketTypes={ticketTypes}
        externalUrl={externalUrl}
        apiBase={API_BASE}
        cssVars={cssVars}
      />
    </div>
  )
}
