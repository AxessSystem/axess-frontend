import { UtensilsCrossed } from 'lucide-react'

export default function ProductCard({ item, quantity, onAdd, onRemove }) {
  const q = Number(quantity || 0)

  return (
    <div
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
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(15,23,42,0.9)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(148,163,184,0.9)',
          fontSize: 20,
        }}
      >
        {item?.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <UtensilsCrossed size={20} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
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
              fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
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
          onClick={onRemove}
          disabled={q <= 0}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: q > 0 ? 'rgba(15,23,42,0.9)' : 'rgba(30,41,59,0.7)',
            color: 'rgba(248,250,252,0.85)',
            fontSize: 18,
            cursor: q > 0 ? 'pointer' : 'default',
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
          {q}
        </span>
        <button
          type="button"
          onClick={onAdd}
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
  )
}

