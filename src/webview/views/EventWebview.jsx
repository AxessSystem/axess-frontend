import { useState } from 'react'
import WebviewCart from '../components/WebviewCart'

export default function EventWebview({ business, items, extra }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(2)
  const [cartItems, setCartItems] = useState(() =>
    (items || []).map((i) => ({ ...i, quantity: 0 })),
  )

  const eventMeta = extra?.event_pages?.[0] || null

  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) }
          : item,
      ),
    )
  }

  const adjust = (id, sign) => updateQuantity(id, sign)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {eventMeta && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'var(--wv-card, #111827)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>{eventMeta.title || business?.name}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {eventMeta.date && <span>תאריך: {new Date(eventMeta.date).toLocaleDateString('he-IL')}</span>}
          </div>
        </div>
      )}

      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: 'rgba(15,23,42,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500 }}>הזמנת שולחן</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.5)',
              background: 'rgba(15,23,42,0.7)',
              color: 'var(--wv-text, #fff)',
              fontSize: 13,
            }}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.5)',
              background: 'rgba(15,23,42,0.7)',
              color: 'var(--wv-text, #fff)',
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>מספר אנשים</span>
          <div
            style={{
              marginInlineStart: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15,23,42,0.9)',
              borderRadius: 999,
              padding: '4px 8px',
            }}
          >
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(148,163,184,0.3)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              -
            </button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14 }}>{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--wv-primary, #22C55E)',
                color: '#000',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              +
            </button>
          </div>
        </div>
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
                  fontFamily: "var(--wv-font, 'Heebo', sans-serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
                    marginBottom: 4,
                  }}
                >
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
                onClick={() => adjust(item.id, -1)}
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
                onClick={() => adjust(item.id, 1)}
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
          metadata: {
            ...(i.metadata || {}),
            booking: {
              date: date || null,
              time: time || null,
              guests,
            },
          },
        }))}
      />
    </div>
  )
}

