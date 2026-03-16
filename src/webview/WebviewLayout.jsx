export default function WebviewLayout({ business, children }) {
  const brand = business?.brand_assets || {}
  const logoUrl = brand.logo_url || null

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.close()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--wv-bg, #000)',
        color: 'var(--wv-text, #fff)',
        fontFamily: 'var(--wv-font, system-ui)',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0.7))',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={business?.name || 'עסק'}
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--wv-primary, #22C55E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {(business?.name || 'A').slice(0, 1)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {business?.name || 'עסק'}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>
              {business?.business_type === 'hotel'
                ? 'שירות חדרים'
                : business?.business_type === 'event'
                ? 'הזמנת שולחן והטבות'
                : business?.business_type === 'retail'
                ? 'קטלוג מוצרים'
                : 'טופס הזמנה'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          style={{
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--wv-text, #fff)',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 12 }}>✕</span>
          <span>סגור</span>
        </button>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 8px 72px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  )
}

