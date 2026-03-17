import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE } from './config'

const WebviewContext = createContext(null)

export function WebviewProvider({ children, context }) {
  const slug = context?.business?.slug || context?.business?.id || ''
  const [cart, setCart] = useState([])
  const [recipient, setRecipient] = useState(context?.recipient || null)
  const [showPhoneInput, setShowPhoneInput] = useState(!context?.recipient)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
  }

  // hydrate cart from localStorage
  useEffect(() => {
    if (!slug) return
    try {
      const saved = localStorage.getItem(`wv:${slug}:cart`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCart(parsed)
      }
    } catch {
      // ignore
    }
  }, [slug])

  // persist cart
  useEffect(() => {
    if (!slug) return
    try {
      localStorage.setItem(`wv:${slug}:cart`, JSON.stringify(cart))
    } catch {
      // ignore
    }
  }, [slug, cart])

  const openedFired = useRef(false)
  useEffect(() => {
    if (slug && !openedFired.current) {
      openedFired.current = true
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
      const utm = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        referrer_url: typeof document !== 'undefined' ? document.referrer : null,
      }
      fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'opened',
          customer_phone: recipient?.phone || null,
          metadata: {},
          ...utm,
        }),
      }).catch(() => {})
    }
  }, [slug, recipient?.phone])

  const addItem = (item) => {
    if (!item) return
    setCart((prev) => {
      const hadItems = prev.length > 0
      const idx = prev.findIndex((i) => i.id === item.id)
      const next = idx === -1
        ? [...prev, { ...item, quantity: 1 }]
        : prev.map((i, j) => j === idx ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i)
      if (!hadItems && next.length > 0) {
        trackEvent('started_order').catch(() => {})
      }
      return next
    })
  }

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQty = (id, qty) => {
    const q = Math.max(0, Number(qty || 0))
    setCart((prev) => {
      if (q === 0) return prev.filter((i) => i.id !== id)
      return prev.map((i) => (i.id === id ? { ...i, quantity: q } : i))
    })
  }

  const clearCart = () => setCart([])

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0),
    [cart],
  )

  const trackEvent = async (event_type, metadata = {}) => {
    if (!slug || !event_type) return
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
      const utm = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        referrer_url: typeof document !== 'undefined' ? document.referrer : null,
      }
      await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type,
          customer_phone: recipient?.phone || null,
          metadata,
          ...utm,
        }),
      })
    } catch {
      // non-blocking
    }
  }

  const value = {
    business: context.business,
    items: context.items,
    cart,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    cartTotal,
    recipient,
    setRecipient,
    showPhoneInput,
    setShowPhoneInput,
    trackEvent,
    toastMessage,
    showToast,
    setToastMessage,
  }

  return <WebviewContext.Provider value={value}>{children}</WebviewContext.Provider>
}

export const useWebview = () => useContext(WebviewContext)

