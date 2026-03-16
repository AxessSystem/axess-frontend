import { useEffect, useState, useMemo } from 'react'
import { Routes, Route, useParams, useLocation } from 'react-router-dom'
import WebviewLayout from './WebviewLayout'
import HotelWebview from './views/HotelWebview'
import EventWebview from './views/EventWebview'
import RetailWebview from './views/RetailWebview'
import GeneralWebview from './views/GeneralWebview'
import WebviewSuccess from './components/WebviewSuccess'

const DEFAULT_BRAND = {
  colors: {
    primary: '#22C55E',
    secondary: '#16A34A',
    background: '#0A0A0A',
    text: '#FFFFFF',
    card: '#1A1A2E',
  },
  logo_url: null,
  font_family: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
}

function applyBrandToCssVars(brand) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const colors = brand?.colors || {}
  root.style.setProperty('--wv-primary', colors.primary || DEFAULT_BRAND.colors.primary)
  root.style.setProperty('--wv-secondary', colors.secondary || DEFAULT_BRAND.colors.secondary)
  root.style.setProperty('--wv-bg', colors.background || DEFAULT_BRAND.colors.background)
  root.style.setProperty('--wv-text', colors.text || DEFAULT_BRAND.colors.text)
  root.style.setProperty('--wv-card', colors.card || DEFAULT_BRAND.colors.card)
  root.style.setProperty('--wv-font', brand?.font_family || DEFAULT_BRAND.font_family)
}

export default function WebviewApp() {
  const { slug } = useParams()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [context, setContext] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadContext() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/w/${encodeURIComponent(slug)}/context`)
        if (!res.ok) {
          throw new Error('שגיאה בטעינת הדף')
        }
        const data = await res.json()
        if (cancelled) return
        const brand = data?.business?.brand_assets || DEFAULT_BRAND
        applyBrandToCssVars(brand)
        setContext(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'שגיאה בטעינה')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (slug) {
      loadContext()
      // fire-and-forget analytics: opened
      fetch(`/api/w/${encodeURIComponent(slug)}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'opened' }),
      }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [slug])

  const business = context?.business || null
  const items = context?.items || []

  const categorizedItems = useMemo(() => {
    const byCategory = { hotel: [], event: [], retail: [], general: [] }
    for (const item of items) {
      const cat = (item.category || item.business_type || 'general').toLowerCase()
      if (cat.includes('hotel')) byCategory.hotel.push(item)
      else if (cat.includes('event')) byCategory.event.push(item)
      else if (cat.includes('retail')) byCategory.retail.push(item)
      else byCategory.general.push(item)
    }
    return byCategory
  }, [items])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--wv-bg, #000)',
          color: 'var(--wv-text, #fff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: 'var(--wv-primary, #22C55E)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--wv-bg, #000)',
          color: 'var(--wv-text, #fff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          direction: 'rtl',
          fontFamily: 'var(--wv-font, system-ui)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>לא הצלחנו לטעון את הדף</h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return null
  }

  const mainView = (() => {
    const type = (business.business_type || '').toLowerCase()
    if (type === 'hotel') {
      return <HotelWebview business={business} items={categorizedItems.hotel.length ? categorizedItems.hotel : items} />
    }
    if (type === 'event') {
      return <EventWebview business={business} items={categorizedItems.event.length ? categorizedItems.event : items} extra={context} />
    }
    if (type === 'retail') {
      return <RetailWebview business={business} items={categorizedItems} />
    }
    return <GeneralWebview business={business} items={items} />
  })()

  return (
    <WebviewLayout business={business}>
      <Routes location={location}>
        <Route path="/" element={mainView} />
        <Route path="success" element={<WebviewSuccess business={business} />} />
      </Routes>
    </WebviewLayout>
  )
}

