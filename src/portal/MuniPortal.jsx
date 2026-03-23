import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Calendar, Loader2, MapPin, Search } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

export const MUNI_CATEGORIES = [
  { value: 'workshop', label: 'סדנאות' },
  { value: 'show', label: 'מופעים' },
  { value: 'standup', label: 'סטנדאפ' },
  { value: 'festival', label: 'פסטיבלים' },
  { value: 'art_class', label: 'כיתת אמן' },
  { value: 'holiday', label: 'חגים' },
  { value: 'summer', label: 'אירועי קיץ' },
  { value: 'draft_ceremony', label: 'כנס מתגייסים' },
  { value: 'discharge_ceremony', label: 'כנס משתחררים' },
  { value: 'party', label: 'מסיבה' },
  { value: 'seminar', label: 'ימי עיון' },
  { value: 'activity', label: 'פעילויות' },
  { value: 'family', label: 'לכל המשפחה' },
  { value: 'lecture', label: 'הרצאות' },
  { value: 'other', label: 'אחר' },
]

const categoryLabel = (v) => MUNI_CATEGORIES.find((c) => c.value === v)?.label || v || 'אחר'

function brandVars(business) {
  const ba = business?.brand_assets && typeof business.brand_assets === 'object' ? business.brand_assets : {}
  const colors = ba.colors && typeof ba.colors === 'object' ? ba.colors : {}
  return {
    '--muni-primary': colors.primary || '#0f766e',
    '--muni-secondary': colors.secondary || '#14b8a6',
    '--muni-accent': colors.primary || '#0d9488',
    '--muni-page-bg': '#f8fafc',
    '--muni-surface': '#ffffff',
    '--muni-text': '#0f172a',
    '--muni-muted': '#475569',
    '--muni-border': '#e2e8f0',
  }
}

function formatWhen(iso) {
  if (!iso) return 'תאריך יוכרז'
  try {
    return new Date(iso).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function priceLine(ev) {
  const r = ev.resident_only_price
  const n = ev.non_resident_price
  if (r != null && Number(r) === 0 && (n == null || Number(n) === 0)) return 'חינם'
  if (r != null && n != null) return `תושב ₪${Number(r).toFixed(0)} · חיצוני ₪${Number(n).toFixed(0)}`
  if (r != null) return `מתוך ₪${Number(r).toFixed(0)} לתושב`
  if (n != null) return `₪${Number(n).toFixed(0)}`
  return 'פרטים בדף האירוע'
}

function spotsLine(ev) {
  const reg = ev.registrations_count ?? 0
  const cap = ev.max_capacity
  const tr = ev.tickets_remaining
  if (cap != null && cap > 0) {
    const left = Math.max(0, cap - reg)
    return `${reg} נרשמו · נותרו ${left} מתוך ${cap}`
  }
  if (tr != null) return `${reg} נרשמו · כרטיסים זמינים: ${tr}`
  return `${reg} נרשמו`
}

export default function MuniPortal() {
  const { citySlug, deptSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [business, setBusiness] = useState(null)
  const [departments, setDepartments] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [err, setErr] = useState(null)

  const qSearch = searchParams.get('search') || ''
  const qCategory = searchParams.get('category') || ''
  const [searchDraft, setSearchDraft] = useState(qSearch)

  useEffect(() => {
    setSearchDraft(qSearch)
  }, [qSearch])

  const activeDept = useMemo(() => {
    if (!deptSlug) return null
    return departments.find((d) => d.portal_slug === deptSlug) || null
  }, [departments, deptSlug])

  const cssVars = useMemo(() => brandVars(business), [business])

  const loadPortal = useCallback(async () => {
    if (!citySlug) return
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(`${API_BASE}/api/portal/${encodeURIComponent(citySlug)}`)
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'לא ניתן לטעון את הפורטל')
      setBusiness(data.business)
      setDepartments(data.departments || [])
    } catch (e) {
      setErr(e.message || 'שגיאה')
      setBusiness(null)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [citySlug])

  const loadEvents = useCallback(async () => {
    if (!citySlug) return
    setEventsLoading(true)
    try {
      const sp = new URLSearchParams()
      if (deptSlug) sp.set('dept_slug', deptSlug)
      if (qCategory) sp.set('category', qCategory)
      if (qSearch.trim()) sp.set('search', qSearch.trim())
      const qs = sp.toString()
      const url = `${API_BASE}/api/portal/${encodeURIComponent(citySlug)}/events${qs ? `?${qs}` : ''}`
      const r = await fetch(url)
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'שגיאה בטעינת אירועים')
      setEvents(data.events || [])
    } catch {
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [citySlug, deptSlug, qCategory, qSearch])

  useEffect(() => {
    loadPortal()
  }, [loadPortal])

  useEffect(() => {
    if (!business) return
    loadEvents()
  }, [business, loadEvents])

  const applySearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchDraft.trim()) next.set('search', searchDraft.trim())
    else next.delete('search')
    setSearchParams(next)
  }

  const setCategory = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('category', value)
    else next.delete('category')
    setSearchParams(next)
  }

  const logoUrl = business?.brand_assets?.logo_url || business?.brand_assets?.banner_image

  if (loading) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={40} strokeWidth={2.5} aria-hidden style={{ color: '#0f766e', animation: 'spin 0.9s linear infinite' }} />
        <span className="sr-only">טוען פורטל</span>
      </div>
    )
  }

  if (err || !business) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', padding: 24, background: '#f8fafc', color: '#0f172a' }}>
        <main id="muni-main" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>הפורטל לא נמצא</h1>
          <p style={{ fontSize: '1.125rem', color: '#475569', marginTop: 12 }}>{err || 'נסו שוב מאוחר יותר'}</p>
        </main>
      </div>
    )
  }

  const footerDept = activeDept || departments[0]
  const deptBranding = footerDept?.branding && typeof footerDept.branding === 'object' ? footerDept.branding : {}
  const footerPhone = footerDept?.phone || deptBranding.phone
  const footerWa = deptBranding.whatsapp || deptBranding.wa
  const footerEmail = deptBranding.email || business.email

  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: 'var(--muni-page-bg)', color: 'var(--muni-text)', ...cssVars }}>
      <a href="#muni-main" className="muni-skip">
        דלג לתוכן
      </a>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .muni-skip { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }
        .muni-skip:focus { position: fixed; left: 12px; top: 12px; width: auto; height: auto; padding: 12px 16px; background: var(--muni-surface); border: 2px solid var(--muni-primary); border-radius: 8px; z-index: 10000; font-size: 1.1rem; }
        .muni-header { background: var(--muni-surface); border-bottom: 1px solid var(--muni-border); }
        .muni-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0 12px; -webkit-overflow-scrolling: touch; scroll-snap-type: x proximity; }
        .muni-tabs a { scroll-snap-align: start; flex: 0 0 auto; padding: 10px 16px; border-radius: 999px; font-size: 1.05rem; font-weight: 600; text-decoration: none; color: var(--muni-text); border: 2px solid transparent; min-height: 44px; display: inline-flex; align-items: center; }
        .muni-tabs a[aria-current="page"] { background: color-mix(in srgb, var(--muni-primary) 18%, white); border-color: var(--muni-primary); color: #0f172a; }
        .muni-card { background: var(--muni-surface); border: 1px solid var(--muni-border); border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .muni-btn { min-height: 48px; padding: 0 20px; border-radius: 12px; font-size: 1.125rem; font-weight: 700; border: none; cursor: pointer; background: var(--muni-primary); color: #fff; }
        .muni-btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--muni-primary) 55%, white); outline-offset: 2px; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      `}</style>

      <header className="muni-header" role="banner">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="" width={56} height={56} style={{ borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: `linear-gradient(135deg, var(--muni-primary), var(--muni-secondary))` }} aria-hidden />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: 800 }}>{business.name || 'פורטל עירוני'}</h1>
              <p style={{ margin: '6px 0 0', fontSize: '1.125rem', color: 'var(--muni-muted)' }}>אירועים ופעילות לתושבים</p>
            </div>
          </div>

          <nav aria-label="מחלקות" style={{ marginTop: 16 }}>
            <div className="muni-tabs" role="tablist">
              <Link to={`/muni/${citySlug}`} aria-current={!deptSlug ? 'page' : undefined}>
                כללי
              </Link>
              {departments.map((d) =>
                d.portal_slug ? (
                  <Link
                    key={d.id}
                    to={`/muni/${citySlug}/${encodeURIComponent(d.portal_slug)}`}
                    aria-current={deptSlug === d.portal_slug ? 'page' : undefined}
                  >
                    {d.name}
                  </Link>
                ) : (
                  <span
                    key={d.id}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 999,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--muni-muted)',
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="הוגדר slug למחלקה כדי לקשר לכאן"
                  >
                    {d.name}
                  </span>
                )
              )}
            </div>
          </nav>

          <form onSubmit={applySearch} role="search" aria-label="חיפוש אירועים" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <label htmlFor="muni-search" className="sr-only">
              חיפוש לפי שם אירוע
            </label>
            <input
              id="muni-search"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="חיפוש אירועים…"
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: '1.125rem',
                padding: '0 14px',
                borderRadius: 12,
                border: `2px solid var(--muni-border)`,
                background: '#fff',
              }}
            />
            <button type="submit" className="muni-btn" aria-label="בצע חיפוש" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Search size={22} aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <main id="muni-main" style={{ maxWidth: 960, margin: '0 auto', padding: '20px 20px 96px' }}>
        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">
            סינון לפי קטגוריה
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              className="muni-btn"
              onClick={() => setCategory('')}
              style={{
                background: !qCategory ? 'var(--muni-primary)' : '#e2e8f0',
                color: !qCategory ? '#fff' : '#0f172a',
              }}
            >
              הכל
            </button>
            {MUNI_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                style={{
                  minHeight: 44,
                  padding: '0 14px',
                  borderRadius: 999,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  border: `2px solid ${qCategory === c.value ? 'var(--muni-primary)' : 'var(--muni-border)'}`,
                  background: qCategory === c.value ? 'color-mix(in srgb, var(--muni-primary) 15%, white)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {eventsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 size={36} aria-hidden style={{ color: 'var(--muni-primary)', animation: 'spin 0.9s linear infinite' }} />
            <span className="sr-only">טוען אירועים</span>
          </div>
        ) : events.length === 0 ? (
          <p style={{ fontSize: '1.2rem', color: 'var(--muni-muted)' }} role="status">
            אין אירועים להצגה כרגע.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {events.map((ev) => {
              const img = ev.cover_image_url || ev.image_url
              return (
                <li key={ev.id}>
                  <article className="muni-card" aria-labelledby={`ev-title-${ev.id}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 0 }}>
                      {img ? (
                        <img src={img} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: 160, background: `linear-gradient(120deg, var(--muni-primary), var(--muni-secondary))` }} aria-hidden />
                      )}
                      <div style={{ padding: 18 }}>
                        <h3 id={`ev-title-${ev.id}`} style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                          {ev.title}
                        </h3>
                        <div style={{ marginTop: 10, fontSize: '1.1rem', color: 'var(--muni-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={20} aria-hidden />
                            {formatWhen(ev.date)}
                          </span>
                          {ev.dept_name && <span>מחלקה: {ev.dept_name}</span>}
                          <span>קטגוריה: {categoryLabel(ev.event_category)}</span>
                          {ev.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <MapPin size={20} aria-hidden />
                              {ev.location}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: 'var(--muni-text)' }}>{priceLine(ev)}</span>
                          <span>{spotsLine(ev)}</span>
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <Link
                            to={`/muni/${citySlug}/event/${encodeURIComponent(ev.slug)}`}
                            className="muni-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          >
                            פרטים והרשמה
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <footer
        role="contentinfo"
        style={{
          marginTop: 'auto',
          padding: '24px 20px',
          background: 'var(--muni-surface)',
          borderTop: '1px solid var(--muni-border)',
          fontSize: '1.125rem',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px' }}>יצירת קשר {footerDept ? `— ${footerDept.name}` : ''}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {footerPhone && (
              <li>
                <a href={`tel:${String(footerPhone).replace(/\s/g, '')}`} style={{ color: 'var(--muni-primary)', fontWeight: 600 }}>
                  טלפון: {footerPhone}
                </a>
              </li>
            )}
            {footerWa && (
              <li>
                <a
                  href={`https://wa.me/${String(footerWa).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--muni-primary)', fontWeight: 600 }}
                >
                  WhatsApp
                </a>
              </li>
            )}
            {footerEmail && (
              <li>
                <a href={`mailto:${footerEmail}`} style={{ color: 'var(--muni-primary)', fontWeight: 600 }}>
                  אימייל: {footerEmail}
                </a>
              </li>
            )}
            {!footerPhone && !footerWa && !footerEmail && <li style={{ color: 'var(--muni-muted)' }}>פרטי קשר יעודכנו בקרוב</li>}
          </ul>
        </div>
      </footer>
    </div>
  )
}
