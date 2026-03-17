import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

  const addItem = (item) => {
    if (!item) return
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id)
      if (idx === -1) {
        return [...prev, { ...item, quantity: 1 }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], quantity: Number(next[idx].quantity || 0) + 1 }
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
      await fetch(`${API_BASE}/api/w/${encodeURIComponent(slug)}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type,
          customer_phone: recipient?.phone || null,
          metadata,
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

