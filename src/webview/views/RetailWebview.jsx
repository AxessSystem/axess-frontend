import { useState, useMemo } from 'react'
import WebviewCart from '../components/WebviewCart'

export default function RetailWebview({ business, items }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [address, setAddress] = useState('')
  const [cartItems, setCartItems] = useState(() => {
    const flat = []
    if (items?.retail?.length) flat.push(...items.retail)
    if (items?.general?.length) flat.push(...items.general)
    return flat.map((i) => ({ ...i, quantity: 0 }))
  })

  const categories = useMemo(() => {
    const set = new Set()
    for (const item of cartItems) {
      if (item.category) set.add(item.category)
    }
    return ['all', ...Array.from(set)]
  }, [cartItems])

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'all') return cartItems
    return cartItems.filter((i) => i.category === selectedCategory)
  }, [cartItems, selectedCategory])

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) }
          : item,
      ),
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13 }}>כתובת / פרטי משלוח</label>
        <textarea
          placeholder="כתובת מדויקת, קומה, הערות לשליח"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.5)',
            background: 'rgba(15,23,42,0.7)',
            color: 'var(--wv-text, #fff)',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '4px 2px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: 'none',
              whiteSpace: 'nowrap',
              background:
                selectedCategory === cat ? 'var(--wv-primary, #22C55E)' : 'rgba(15,23,42,0.9)',
              color: selectedCategory === cat ? '#000' : 'var(--wv-text, #fff)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {cat === 'all' ? 'הכל' : cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 12,
              background: 'var(--wv-card, #111827)',
            }}
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.name}
              </div>
              {item.description && (
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  {item.description}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600 }}>‎₪{Number(item.price || 0).toFixed(0)}</div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(15,23,42,0.9)',
                borderRadius: 999,
                padding: '4px 6px',
              }}
            >
              <button
                type="button"
                onClick={() => updateQuantity(item.id, -1)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(148,163,184,0.3)',
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>
                {Number(item.quantity || 0)}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, 1)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--wv-primary, #22C55E)',
                  color: '#000',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <WebviewCart
        items={cartItems.map((i) => ({
          ...i,
          metadata: { ...(i.metadata || {}), address: address || null },
        }))}
      />
    </div>
  )
}

