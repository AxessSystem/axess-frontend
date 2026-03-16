import { useState } from 'react'
import WebviewCart from '../components/WebviewCart'

export default function GeneralWebview({ business, items }) {
  const [cartItems, setCartItems] = useState(() =>
    (items || []).map((i) => ({ ...i, quantity: 0 })),
  )

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '4px 4px 8px', fontSize: 14, opacity: 0.85 }}>
        בחר/י מההטבות / מוצרים הזמינים אצל {business?.name || 'העסק'}.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(cartItems || []).map((item) => (
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

      <WebviewCart items={cartItems} />
    </div>
  )
}

