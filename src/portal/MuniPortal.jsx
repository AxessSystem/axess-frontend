import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Filter,
  Heart,
  Layers,
  Loader2,
  MapPin,
  Menu,
  Mic2,
  Music,
  Search,
  Star,
  Sun,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export const COLORS = {
  primary: '#020c3d',
  accent: '#00C37A',
  background: '#ffffff',
  text: '#020c3d',
  textLight: '#6b7280',
  border: '#e5e7eb',
  cardBg: '#ffffff',
}

const CATEGORY_ICON_COMPONENTS = {
  festival: Star,
  show: Music,
  standup: Mic2,
  workshop: BookOpen,
  family: Heart,
  seminar: Users,
  party: Sun,
  lecture: Layers,
  art_class: Layers,
  holiday: Sun,
  summer: Sun,
  draft_ceremony: Users,
  discharge_ceremony: Users,
  activity: Coffee,
  other: Tag,
}

function CategoryPillIcon({ value }) {
  const Cmp = CATEGORY_ICON_COMPONENTS[value] || Tag
  return <Cmp size={15} aria-hidden strokeWidth={2} />
}

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

const font = "'Open Sans Hebrew', 'Open Sans', system-ui, sans-serif"

function formatDate(iso) {
  if (!iso) return 'תאריך יוכרז'
  try {
    return new Date(iso).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatDayDate(iso) {
  if (!iso) return 'תאריך יוכרז'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  } catch {
    return iso
  }
}

function eventCity(ev) {
  return [ev.city_name, ev.city_code].filter(Boolean).join(', ') || ''
}

function isFreeEvent(ev) {
  const r = ev.resident_only_price
  const n = ev.non_resident_price
  if (r != null && Number(r) === 0 && (n == null || Number(n) === 0)) return true
  return false
}

function cardPrice(ev) {
  if (isFreeEvent(ev)) return { free: true, amount: 0 }
  const r = ev.resident_only_price
  const n = ev.non_resident_price
  if (r != null && n != null) return { free: false, amount: Math.min(Number(r), Number(n)) }
  if (r != null) return { free: false, amount: Number(r) }
  if (n != null) return { free: false, amount: Number(n) }
  return { free: false, amount: null }
}

function useIsDesktop(breakpoint = 768) {
  const [wide, setWide] = useState(typeof window !== 'undefined' && window.innerWidth >= breakpoint)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const fn = () => setWide(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [breakpoint])
  return wide
}

function EventCard({ ev, citySlug, isMobile, pagePad }) {
  const navigate = useNavigate()
  const img = ev.cover_image_url || ev.image_url
  const cp = cardPrice(ev)
  const imgH = isMobile ? 220 : 387
  const cardPad = pagePad ?? (isMobile ? 16 : 24)
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/muni/${citySlug}/event/${encodeURIComponent(ev.slug)}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/muni/${citySlug}/event/${encodeURIComponent(ev.slug)}`)
        }
      }}
      style={{
        width: isMobile ? '100%' : '100%',
        minWidth: isMobile ? 280 : 'unset',
        maxWidth: isMobile ? 350 : '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${COLORS.border}`,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'block',
        boxSizing: 'border-box',
      }}
      className="muni-portal-card"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: imgH,
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        {img ? (
          <img
            src={img}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: imgH, objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: imgH,
              background: `linear-gradient(135deg, ${COLORS.primary}, #01061f)`,
            }}
          />
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 5,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ padding: cardPad, background: '#fff' }}>
        <h3
          style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 15,
            color: COLORS.primary,
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}
        >
          {ev.title}
        </h3>
        <div style={{ fontSize: 13, color: COLORS.textLight, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color={COLORS.textLight} aria-hidden />
            {formatDayDate(ev.date)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color={COLORS.textLight} aria-hidden />
            {ev.location || '—'}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          {cp.free ? (
            <span
              style={{
                background: COLORS.accent,
                color: '#fff',
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              חינם
            </span>
          ) : cp.amount != null ? (
            <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: 14 }}>מ-₪{cp.amount.toFixed(0)}</span>
          ) : (
            <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: 14 }}>מחיר בדף</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MuniPortal() {
  const navigate = useNavigate()
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
  const categoryFilter = searchParams.get('category') || ''
  const qDateFrom = searchParams.get('date_from') || ''
  const qDateTo = searchParams.get('date_to') || ''

  const [searchDraft, setSearchDraft] = useState(qSearch)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sliderIndex, setSliderIndex] = useState(0)

  const [draftDateFrom, setDraftDateFrom] = useState(qDateFrom)
  const [draftDateTo, setDraftDateTo] = useState(qDateTo)
  const [draftCategory, setDraftCategory] = useState(qCategory)
  const [draftAudience, setDraftAudience] = useState('')
  const [draftPrice, setDraftPrice] = useState('all')

  const isDesktop = useIsDesktop()
  const isMobile = !isDesktop
  const pagePad = isMobile ? 16 : 24
  const heroBannerH = isMobile ? 280 : 480

  const next30Days = useMemo(() => {
    const out = []
    const base = new Date()
    base.setHours(12, 0, 0, 0)
    for (let i = 0; i < 30; i++) {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      const value = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })
      out.push({ value, label })
    }
    return out
  }, [])

  const filterSelectBase = {
    minHeight: 44,
    height: 44,
    padding: '0 12px',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontFamily: font,
    fontSize: 16,
    flex: '0 0 auto',
    boxSizing: 'border-box',
  }

  useEffect(() => {
    setSearchDraft(qSearch)
  }, [qSearch])

  useEffect(() => {
    setDraftDateFrom(qDateFrom)
    setDraftDateTo(qDateTo)
    setDraftCategory(qCategory)
  }, [qDateFrom, qDateTo, qCategory])

  const activeDept = useMemo(() => {
    if (!deptSlug) return null
    return departments.find((d) => d.portal_slug === deptSlug) || null
  }, [departments, deptSlug])

  const portalListPath = useMemo(
    () => (deptSlug ? `/muni/${citySlug}/${encodeURIComponent(deptSlug)}` : `/muni/${citySlug}`),
    [citySlug, deptSlug]
  )

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
      if (qDateFrom) sp.set('date_from', qDateFrom)
      if (qDateTo) sp.set('date_to', qDateTo)
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
  }, [citySlug, deptSlug, qCategory, qSearch, qDateFrom, qDateTo])

  useEffect(() => {
    loadPortal()
  }, [loadPortal])

  useEffect(() => {
    if (!business) return
    loadEvents()
  }, [business, loadEvents])

  const filteredEvents = useMemo(() => {
    let list = events
    if (categoryFilter) {
      list = list.filter((e) => (e.event_category || 'other') === categoryFilter)
    }
    if (draftPrice === 'free') list = list.filter(isFreeEvent)
    else if (draftPrice === 'paid') list = list.filter((e) => !isFreeEvent(e))
    if (draftAudience.trim()) {
      const t = draftAudience.trim().toLowerCase()
      list = list.filter((e) => String(e.target_audience || '').toLowerCase().includes(t))
    }
    return list
  }, [events, categoryFilter, draftPrice, draftAudience])

  const applySearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchDraft.trim()) next.set('search', searchDraft.trim())
    else next.delete('search')
    setSearchParams(next)
  }

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams)
    if (draftDateFrom) next.set('date_from', draftDateFrom)
    else next.delete('date_from')
    if (draftDateTo) next.set('date_to', draftDateTo)
    else next.delete('date_to')
    if (draftCategory) next.set('category', draftCategory)
    else next.delete('category')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftDateFrom('')
    setDraftDateTo('')
    setDraftCategory('')
    setDraftAudience('')
    setDraftPrice('all')
    setSearchDraft('')
    setSearchParams(new URLSearchParams())
  }

  const setCategoryTab = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('category', value)
    else next.delete('category')
    setSearchParams(next)
  }

  const heroSlides = useMemo(() => filteredEvents.slice(0, 5), [filteredEvents])

  const prevSlide = useCallback(() => {
    setSliderIndex((i) => {
      const n = heroSlides.length
      if (!n) return 0
      return (i - 1 + n) % n
    })
  }, [heroSlides.length])

  const nextSlide = useCallback(() => {
    setSliderIndex((i) => {
      const n = heroSlides.length
      if (!n) return 0
      return (i + 1) % n
    })
  }, [heroSlides.length])

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined
    const t = setInterval(() => {
      setSliderIndex((i) => (i + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(t)
  }, [heroSlides.length])

  useEffect(() => {
    setSliderIndex(0)
  }, [heroSlides.length, citySlug])

  useEffect(() => {
    if (!categoryFilter || eventsLoading) return
    const id = `muni-cat-${categoryFilter}`
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        document.getElementById('muni-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
    return () => window.clearTimeout(timer)
  }, [categoryFilter, eventsLoading, filteredEvents.length])

  const groupedByCategory = useMemo(() => {
    const order = MUNI_CATEGORIES.map((c) => c.value)
    const map = new Map()
    for (const ev of filteredEvents) {
      const k = ev.event_category || 'other'
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(ev)
    }
    const rows = []
    for (const key of order) {
      if (map.has(key) && map.get(key).length) rows.push({ key, label: categoryLabel(key), items: map.get(key) })
    }
    for (const [key, items] of map) {
      if (!order.includes(key) && items.length) rows.push({ key, label: categoryLabel(key), items })
    }
    return rows
  }, [filteredEvents])

  const logoUrl = business?.brand_assets?.logo_url || business?.brand_assets?.banner_image

  if (loading) {
    return (
      <div
        dir="rtl"
        lang="he"
        style={{
          minHeight: '100vh',
          overflowX: 'hidden',
          maxWidth: '100vw',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.background,
          fontFamily: font,
        }}
      >
        <Loader2 size={40} strokeWidth={2.5} aria-hidden style={{ color: COLORS.primary, animation: 'spin 0.9s linear infinite' }} />
        <span className="sr-only">טוען פורטל</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
      </div>
    )
  }

  if (err || !business) {
    return (
      <div
        dir="rtl"
        lang="he"
        style={{
          minHeight: '100vh',
          overflowX: 'hidden',
          maxWidth: '100vw',
          position: 'relative',
          padding: 24,
          background: COLORS.background,
          color: COLORS.text,
          fontFamily: font,
        }}
      >
        <main id="muni-main" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>הפורטל לא נמצא</h1>
          <p style={{ fontSize: '1.125rem', color: COLORS.textLight, marginTop: 12 }}>{err || 'נסו שוב מאוחר יותר'}</p>
        </main>
      </div>
    )
  }

  const slide = heroSlides[sliderIndex]

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
      <a href="#muni-main" className="muni-skip">
        דלג לתוכן
      </a>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .muni-skip { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }
        .muni-skip:focus { position: fixed; left: 12px; top: 12px; width: auto; height: auto; padding: 12px 16px; background: #fff; border: 2px solid ${COLORS.primary}; border-radius: 8px; z-index: 10000; font-size: 1rem; }
        .muni-portal-card:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(10,22,40,0.14); }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
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
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${pagePad}px`,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: 12 }}>
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
                height: 44,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: COLORS.primary,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                fontFamily: font,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxSizing: 'border-box',
              }}
            >
              <User size={18} aria-hidden />
              התחבר
            </button>
          </div>
          <Link to={portalListPath} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: COLORS.text, minWidth: 0 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="" width={40} height={40} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.primary}, #2d5a8a)`, flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: 800, fontSize: 15, maxWidth: 140, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeDept?.name || business.name}
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
              padding: pagePad,
              overflowY: 'auto',
              fontFamily: font,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pagePad }}>
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

      <div style={{ marginTop: 70 }}>
        <section aria-label="אירועים מובחרים" style={{ position: 'relative' }}>
          {heroSlides.length > 0 && slide ? (
            <div style={{ position: 'relative' }}>
              <div
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/muni/${citySlug}/event/${encodeURIComponent(slide.slug)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/muni/${citySlug}/event/${encodeURIComponent(slide.slug)}`)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', height: heroBannerH, overflow: 'hidden', background: COLORS.primary }}>
                  {slide.cover_image_url || slide.image_url ? (
                    <img
                      key={slide.id}
                      src={slide.cover_image_url || slide.image_url}
                      alt=""
                      style={{ width: '100%', height: heroBannerH, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      key={slide.id}
                      style={{
                        width: '100%',
                        height: heroBannerH,
                        background: `linear-gradient(135deg, ${COLORS.primary}, #01061f)`,
                      }}
                    />
                  )}
                  <button
                    type="button"
                    aria-label="שקופית קודמת"
                    onClick={(e) => {
                      e.stopPropagation()
                      prevSlide()
                    }}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '40%',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      fontSize: 18,
                      zIndex: 10,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="שקופית הבאה"
                    onClick={(e) => {
                      e.stopPropagation()
                      nextSlide()
                    }}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '40%',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      fontSize: 18,
                      zIndex: 10,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={18} aria-hidden />
                  </button>
                </div>
                <div
                  style={{
                    background: '#fff',
                    padding: pagePad,
                    borderBottom: `3px solid ${COLORS.accent}`,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: font,
                      fontWeight: 700,
                      fontSize: 28,
                      color: COLORS.primary,
                      margin: '0 0 8px',
                    }}
                  >
                    {slide.title}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      color: COLORS.textLight,
                      fontSize: 14,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color={COLORS.textLight} aria-hidden />
                      {formatDate(slide.date)}
                    </span>
                    <span style={{ color: COLORS.accent }}>|</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color={COLORS.textLight} aria-hidden />
                      {[slide.location, eventCity(slide)].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/muni/${citySlug}/event/${encodeURIComponent(slide.slug)}`)
                    }}
                    style={{
                      marginTop: 12,
                      height: 44,
                      padding: '0 24px',
                      background: COLORS.primary,
                      color: '#fff',
                      borderRadius: 8,
                      border: 'none',
                      fontFamily: font,
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    לרכישת כרטיסים
                  </button>
                </div>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0', background: COLORS.background }}
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`שקופית ${i + 1}`}
                    onClick={() => setSliderIndex(i)}
                    style={{
                      width: i === sliderIndex ? 22 : 8,
                      height: 8,
                      borderRadius: 999,
                      border: 'none',
                      background: i === sliderIndex ? COLORS.accent : COLORS.border,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'width 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                height: heroBannerH,
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, #01061f 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              אירועים יתווספו בקרוב
            </div>
          )}
        </section>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: `0 ${pagePad}px` }}>
        <main id="muni-main" style={{ marginTop: 0, paddingBottom: 100 }}>
        <form
          onSubmit={applySearch}
          role="search"
          aria-label="חיפוש אירועים"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginBottom: pagePad,
            height: 50,
            boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(26,58,92,0.08)',
            borderRadius: 8,
            padding: '0 12px 0 16px',
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <label htmlFor="muni-search" className="sr-only">
            חיפוש
          </label>
          <input
            id="muni-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="חפש לפי סוג אירוע, אמן או מקום..."
            style={{
              flex: 1,
              height: 44,
              minHeight: 44,
              fontSize: 16,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: font,
              color: COLORS.text,
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 8,
              border: 'none',
              background: COLORS.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              fontFamily: font,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
            }}
          >
            <Search size={16} aria-hidden />
            חיפוש
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 10,
            marginBottom: pagePad,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
            alignItems: 'center',
          }}
        >
          <Filter size={18} color={COLORS.textLight} aria-hidden style={{ flex: '0 0 auto' }} />
          <select
            value={draftDateFrom}
            onChange={(e) => setDraftDateFrom(e.target.value)}
            style={{
              ...filterSelectBase,
              minWidth: 148,
              color: draftDateFrom ? COLORS.text : '#9ca3af',
            }}
            aria-label="בחירת תאריך התחלה"
          >
            <option value="">בחר תאריך התחלה</option>
            {next30Days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={draftDateTo}
            onChange={(e) => setDraftDateTo(e.target.value)}
            style={{
              ...filterSelectBase,
              minWidth: 140,
              color: draftDateTo ? COLORS.text : '#9ca3af',
            }}
            aria-label="בחירת תאריך סיום"
          >
            <option value="">בחר תאריך סיום</option>
            {next30Days.map((d) => (
              <option key={`to-${d.value}`} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 12px',
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontFamily: font,
              fontSize: 16,
              flex: '0 0 auto',
              minWidth: 120,
              boxSizing: 'border-box',
            }}
            aria-label="קטגוריה"
          >
            <option value="">קטגוריה</option>
            {MUNI_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={draftAudience}
            onChange={(e) => setDraftAudience(e.target.value)}
            placeholder="קהל יעד"
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 12px',
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontFamily: font,
              fontSize: 16,
              flex: '0 0 auto',
              minWidth: 100,
              boxSizing: 'border-box',
            }}
            aria-label="קהל יעד"
          />
          <select
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 12px',
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontFamily: font,
              fontSize: 16,
              flex: '0 0 auto',
              boxSizing: 'border-box',
            }}
            aria-label="מחיר"
          >
            <option value="all">מחיר</option>
            <option value="free">חינם</option>
            <option value="paid">בתשלום</option>
          </select>
          <button
            type="button"
            onClick={applyFilters}
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 18px',
              borderRadius: 8,
              border: 'none',
              background: COLORS.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: font,
              cursor: 'pointer',
              flex: '0 0 auto',
              boxSizing: 'border-box',
            }}
          >
            בחר
          </button>
          <button
            type="button"
            onClick={clearFilters}
            style={{
              height: 44,
              minHeight: 44,
              padding: '0 18px',
              borderRadius: 8,
              border: `2px solid ${COLORS.primary}`,
              background: 'transparent',
              color: COLORS.primary,
              fontWeight: 700,
              fontSize: 16,
              fontFamily: font,
              cursor: 'pointer',
              flex: '0 0 auto',
              boxSizing: 'border-box',
            }}
          >
            נקה
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 12,
            WebkitOverflowScrolling: 'touch',
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setCategoryTab('')}
            style={{
              flex: '0 0 auto',
              minHeight: 44,
              padding: '0 18px',
              borderRadius: 8,
              border: `2px solid ${!qCategory ? COLORS.accent : COLORS.border}`,
              background: !qCategory ? `${COLORS.accent}18` : COLORS.cardBg,
              color: COLORS.text,
              fontWeight: 700,
              fontFamily: font,
              cursor: 'pointer',
              fontSize: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxSizing: 'border-box',
            }}
          >
            <Tag size={15} aria-hidden />
            הכל
          </button>
          {MUNI_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoryTab(c.value)}
              style={{
                flex: '0 0 auto',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 8,
                border: `2px solid ${qCategory === c.value ? COLORS.accent : COLORS.border}`,
                background: qCategory === c.value ? `${COLORS.accent}18` : COLORS.cardBg,
                color: COLORS.text,
                fontWeight: 700,
                fontFamily: font,
                cursor: 'pointer',
                fontSize: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxSizing: 'border-box',
              }}
            >
              <CategoryPillIcon value={c.value} />
              {c.label}
            </button>
          ))}
        </div>

        <p style={{ color: COLORS.textLight, fontSize: 15, lineHeight: 1.6, margin: `4px 0 ${pagePad}px` }}>
          נמצאו {filteredEvents.length} אירועים
        </p>

        {eventsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={36} aria-hidden style={{ color: COLORS.primary, animation: 'spin 0.9s linear infinite' }} />
            <span className="sr-only">טוען אירועים</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <p style={{ fontSize: 17, color: COLORS.textLight }} role="status">
            אין אירועים להצגה כרגע.
          </p>
        ) : (
          groupedByCategory.map(({ key, label, items }) => (
            <section key={key} aria-labelledby={`muni-cat-${key}`} style={{ marginBottom: pagePad * 2 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                  borderBottom: `2px solid ${COLORS.accent}`,
                  paddingBottom: pagePad,
                }}
              >
                <h2
                  id={`muni-cat-${key}`}
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.2,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Link
                    to={`${portalListPath}?category=${encodeURIComponent(key)}`}
                    style={{
                      color: COLORS.text,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ChevronLeft size={22} aria-hidden />
                    {label}
                  </Link>
                </h2>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`${portalListPath}?category=${encodeURIComponent(key)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`${portalListPath}?category=${encodeURIComponent(key)}`)
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    color: COLORS.accent,
                    fontWeight: 700,
                    fontSize: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  הצג הכל
                  <ChevronRight size={18} aria-hidden />
                </span>
              </div>
              <div
                style={
                  isMobile
                    ? {
                        display: 'flex',
                        flexDirection: 'row',
                        overflowX: 'auto',
                        gap: pagePad,
                        paddingBottom: 8,
                        WebkitOverflowScrolling: 'touch',
                      }
                    : {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: pagePad,
                        paddingBottom: 0,
                      }
                }
              >
                {items.map((ev) => (
                  <div key={ev.id} style={{ width: isMobile ? 'auto' : '100%', flexShrink: isMobile ? 0 : undefined }}>
                    <EventCard ev={ev} citySlug={citySlug} isMobile={isMobile} pagePad={pagePad} />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
      </div>

      <footer
        role="contentinfo"
        style={{
          background: COLORS.background,
          borderTop: `1px solid ${COLORS.accent}`,
          fontSize: 12,
          color: COLORS.text,
          fontFamily: font,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: pagePad }}>
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
                height: 44,
                padding: '0 24px',
                borderRadius: 8,
                border: 'none',
                background: COLORS.accent,
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                fontFamily: font,
                boxSizing: 'border-box',
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
              <span style={{ color: COLORS.accent, fontWeight: 700, fontFamily: font }}>AXESS</span>
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
