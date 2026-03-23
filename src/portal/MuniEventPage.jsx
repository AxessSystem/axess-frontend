import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Calendar, Loader2, MapPin } from 'lucide-react'
import { MUNI_CATEGORIES } from './MuniPortal'
import SmartRegistrationModal from '../components/SmartRegistration/SmartRegistrationModal'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const categoryLabel = (v) => MUNI_CATEGORIES.find((c) => c.value === v)?.label || v || 'אחר'

function brandVars(business) {
  const ba = business?.brand_assets && typeof business.brand_assets === 'object' ? business.brand_assets : {}
  const colors = ba.colors && typeof ba.colors === 'object' ? ba.colors : {}
  return {
    '--muni-primary': colors.primary || '#0f766e',
    '--muni-secondary': colors.secondary || '#14b8a6',
    '--muni-page-bg': '#f8fafc',
    '--muni-surface': '#ffffff',
    '--muni-text': '#0f172a',
    '--muni-muted': '#475569',
    '--muni-border': '#e2e8f0',
  }
}

function formatWhen(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function MuniEventPage() {
  const { citySlug, eventSlug } = useParams()
  const [business, setBusiness] = useState(null)
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const cssVars = useMemo(() => brandVars(business), [business])

  const externalUrl = useMemo(() => {
    if (!event) return ''
    const s = event.settings && typeof event.settings === 'object' ? event.settings : {}
    return (event.external_url || s.external_url || '').trim()
  }, [event])

  const contact = useMemo(() => {
    if (!event?.contact_info || typeof event.contact_info !== 'object') return {}
    return event.contact_info
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
      setTicketTypes(eData.ticket_types || [])
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

  if (loading) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={40} aria-hidden style={{ color: '#0f766e', animation: 'spin 0.9s linear infinite' }} />
        <span className="sr-only">טוען אירוע</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
      </div>
    )
  }

  if (err || !event) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', padding: 24, background: '#f8fafc' }}>
        <main style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>האירוע לא נמצא</h1>
          <p style={{ fontSize: '1.125rem', color: '#475569' }}>{err}</p>
          <Link to={`/muni/${citySlug}`} style={{ display: 'inline-block', marginTop: 20, fontSize: '1.125rem', color: '#0f766e', fontWeight: 700 }}>
            חזרה לפורטל
          </Link>
        </main>
      </div>
    )
  }

  const logoUrl = business?.brand_assets?.logo_url
  const hero = event.cover_image_url || event.image_url
  const when = formatWhen(event.date)
  const reg = event.registrations_count ?? 0
  const cap = event.max_capacity
  const spots =
    cap != null && cap > 0 ? `${Math.max(0, cap - reg)} מקומות פנויים מתוך ${cap}` : event.tickets_remaining != null ? `${event.tickets_remaining} כרטיסים זמינים` : `${reg} נרשמו`

  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: 'var(--muni-page-bg)', color: 'var(--muni-text)', ...cssVars }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .muni-event-btn { min-height: 52px; padding: 0 22px; border-radius: 14px; font-size: 1.2rem; font-weight: 800; border: none; cursor: pointer; background: var(--muni-primary); color: #fff; }
        .muni-event-btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--muni-primary) 50%, white); outline-offset: 2px; }
        .muni-event-secondary { background: #fff; color: var(--muni-primary); border: 2px solid var(--muni-primary); }
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
      `}</style>

      <header style={{ background: 'var(--muni-surface)', borderBottom: '1px solid var(--muni-border)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to={`/muni/${citySlug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', fontSize: '1.125rem', fontWeight: 700 }}>
            <ArrowRight size={22} aria-hidden />
            חזרה
          </Link>
          {logoUrl && <img src={logoUrl} alt="" width={44} height={44} style={{ borderRadius: 10, marginRight: 'auto' }} />}
        </div>
      </header>

      <main id="muni-event-main" style={{ maxWidth: 800, margin: '0 auto', padding: '20px 20px 80px' }}>
        {hero ? (
          <img src={hero} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 16 }} />
        ) : (
          <div style={{ height: 200, borderRadius: 16, background: `linear-gradient(120deg, var(--muni-primary), var(--muni-secondary))` }} aria-hidden />
        )}

        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, margin: '20px 0 12px', lineHeight: 1.25 }}>{event.title}</h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--muni-muted)', margin: '0 0 8px' }}>קטגוריה: {categoryLabel(event.event_category)}</p>
        {event.dept_name && <p style={{ fontSize: '1.15rem', color: 'var(--muni-muted)', margin: '0 0 8px' }}>מחלקה: {event.dept_name}</p>}
        {when && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', margin: '12px 0' }}>
            <Calendar size={22} aria-hidden />
            {when}
          </p>
        )}
        {event.location && (
          <a
            href={event.location_url || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', color: 'var(--muni-primary)', fontWeight: 700 }}
          >
            <MapPin size={22} aria-hidden />
            {event.location}
          </a>
        )}
        <p style={{ fontSize: '1.15rem', marginTop: 16, fontWeight: 600 }} aria-live="polite">
          {spots}
        </p>

        {event.description && <p style={{ fontSize: '1.2rem', lineHeight: 1.7, marginTop: 20, whiteSpace: 'pre-wrap' }}>{event.description}</p>}
        {event.rich_description && (
          <div style={{ fontSize: '1.2rem', lineHeight: 1.75, marginTop: 16, whiteSpace: 'pre-wrap' }}>{event.rich_description}</div>
        )}

        {(contact.phone || contact.whatsapp || contact.email) && (
          <section aria-labelledby="contact-heading" style={{ marginTop: 28, padding: 20, background: 'var(--muni-surface)', borderRadius: 16, border: '1px solid var(--muni-border)' }}>
            <h2 id="contact-heading" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 12px' }}>
              צור קשר לאירוע
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.15rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contact.phone && (
                <li>
                  <a href={`tel:${String(contact.phone).replace(/\s/g, '')}`} style={{ color: 'var(--muni-primary)', fontWeight: 600 }}>
                    טלפון: {contact.phone}
                  </a>
                </li>
              )}
              {contact.whatsapp && (
                <li>
                  <a href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muni-primary)', fontWeight: 600 }}>
                    WhatsApp
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} style={{ color: 'var(--muni-primary)', fontWeight: 600 }}>
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}

        {ticketTypes.length > 0 && (
          <section aria-labelledby="tickets-heading" style={{ marginTop: 28 }}>
            <h2 id="tickets-heading" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              סוגי כניסה
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ticketTypes.map((tt) => (
                <li
                  key={tt.id}
                  style={{
                    padding: 16,
                    background: 'var(--muni-surface)',
                    borderRadius: 14,
                    border: '1px solid var(--muni-border)',
                    fontSize: '1.15rem',
                  }}
                >
                  <strong>{tt.name}</strong>
                  {tt.description && <div style={{ color: 'var(--muni-muted)', marginTop: 6 }}>{tt.description}</div>}
                  <div style={{ marginTop: 8, fontWeight: 700 }}>מחיר: ₪{Number(tt.price || 0).toFixed(0)}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" className="muni-event-btn" onClick={() => setModalOpen(true)}>
            הרשמה
          </button>
          {!externalUrl && (
            <Link
              to={`/e/${event.slug}`}
              className="muni-event-btn muni-event-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              דף הרשמה מלא (תשלום מאובטח)
            </Link>
          )}
        </div>
      </main>

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
