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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          padding: '4px 4px 8px',
          fontSize: 14,
          opacity: 0.8,
        }}
      >
        בחר/י מההטבות / מוצרים הזמינים אצל {business?.name || 'העסק'}.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(cartItems || []).map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 16,
              borderRadius: 16,
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(148,163,184,0.25)',
              boxShadow: '0 18px 45px rgba(15,23,42,0.75)',
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
                  fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'right',
                }}
              >
                {item.name}
              </div>
              {item.description && (
                <div
                  style={{
                    fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 6,
                    textAlign: 'right',
                  }}
                >
                  {item.description}
                </div>
              )}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--wv-primary, #22C55E)',
                  textAlign: 'right',
                }}
              >
                ‎₪{Number(item.price || 0).toFixed(0)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => updateQuantity(item.id, -1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(15,23,42,0.9)',
                  color: 'rgba(248,250,252,0.85)',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span
                style={{
                  minWidth: 28,
                  textAlign: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--wv-text, #fff)',
                }}
              >
                {Number(item.quantity || 0)}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--wv-primary, #22C55E)',
                  color: '#000',
                  fontSize: 18,
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

