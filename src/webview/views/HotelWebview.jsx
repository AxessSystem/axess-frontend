import { useState } from 'react'
import WebviewCart from '../components/WebviewCart'

export default function HotelWebview({ business, items }) {
  const [roomNumber, setRoomNumber] = useState('')
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

  const handleAdd = (id) => updateQuantity(id, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '8px 4px' }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
          מספר חדר
        </label>
        <input
          type="text"
          placeholder="לדוגמה: 418"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.5)',
            background: 'rgba(15,23,42,0.7)',
            color: 'var(--wv-text, #fff)',
            fontSize: 14,
            outline: 'none',
          }}
        />
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
            <button
              type="button"
              onClick={() => handleAdd(item.id)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '6px 12px',
                background: 'var(--wv-primary, #22C55E)',
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              הוסף
            </button>
          </div>
        ))}
      </div>
      <WebviewCart
        items={cartItems.map((i) => ({ ...i, metadata: { ...(i.metadata || {}), room_number: roomNumber || null } }))}
      />
    </div>
  )
}

