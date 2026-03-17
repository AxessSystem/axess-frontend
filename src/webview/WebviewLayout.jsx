import WebviewToast from './components/WebviewToast'
import { useWebview } from './WebviewContext'

export default function WebviewLayout({ business, children }) {
  const { toastMessage, setToastMessage } = useWebview()
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
        fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
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
          borderBottom: '1px solid rgba(148,163,184,0.25)',
          background: 'var(--wv-bg, #020617)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '999px',
              background: 'radial-gradient(circle at 30% 30%, #bbf7d0, var(--wv-primary, #22C55E))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(15,23,42,0.9), 0 8px 18px rgba(15,23,42,0.85)',
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={business?.name || 'עסק'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#020617',
                }}
              >
                {(business?.name || 'A').slice(0, 1)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {business?.name || 'עסק'}
            </span>
            <span style={{ fontSize: 12, opacity: 0.65 }}>
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
            background: 'rgba(15,23,42,0.85)',
            color: 'rgba(248,250,252,0.9)',
            borderRadius: '999px',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
          }}
        >
          <span style={{ fontSize: 14 }}>✕</span>
        </button>
      </header>

      {toastMessage && (
        <WebviewToast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
          duration={2500}
        />
      )}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 8px 90px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  )
}

