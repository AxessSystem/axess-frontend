import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export default function PaymentModal({
  orderId,
  amount,
  customerName,
  customerPhone,
  customerEmail,
  onSuccess,
  onError,
  onClose,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    createSession()
  }, [])

  const createSession = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || '',
        }),
      })
      const data = await res.json()
      if (data.payment_link) {
        loadHostedFields()
      } else {
        setError('שגיאה ביצירת תשלום')
      }
    } catch {
      setError('שגיאה בחיבור לשרת התשלום')
    } finally {
      setLoading(false)
    }
  }

  const loadHostedFields = () => {
    if (window.PayPlus) {
      initHostedFields()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://gateway.payplus.co.il/js/v1/payplus.js'
    script.onload = initHostedFields
    document.head.appendChild(script)
  }

  const initHostedFields = () => {
    if (!window.PayPlus) return
    const payplus = new window.PayPlus(
      import.meta.env.VITE_PAYPLUS_PUBLIC_KEY || 'SANDBOX_PUBLIC_KEY',
    )
    const elements = payplus.elements()
    elements
      .create('cardNumber', {
        style: { base: { color: 'var(--text)', fontSize: '16px' } },
      })
      .mount('#pp-card-number')
    elements
      .create('cardExpiry', {
        style: { base: { color: 'var(--text)', fontSize: '16px' } },
      })
      .mount('#pp-card-expiry')
    elements
      .create('cardCvv', {
        style: { base: { color: 'var(--text)', fontSize: '16px' } },
      })
      .mount('#pp-card-cvv')
    window._payplusInstance = payplus
  }

  const handlePay = async () => {
    // placeholder — יושלם עם מפתחות אמיתיים
    onSuccess?.()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* כותרת */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
          <h3 style={{ margin: 0, fontSize: 17 }}>תשלום</h3>
        </div>

        {/* תוכן */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && (
            <p style={{ textAlign: 'center', color: 'var(--v2-gray-400)' }}>טוען אפשרויות תשלום...</p>
          )}

          {error && <p style={{ textAlign: 'center', color: '#ff4444' }}>{error}</p>}

          {!loading && !error && (
            <>
              {/* שדות כרטיס */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 6,
                    textAlign: 'right',
                  }}
                >
                  מספר כרטיס
                </label>
                <div
                  id="pp-card-number"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    minHeight: 46,
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--v2-gray-400)',
                      display: 'block',
                      marginBottom: 6,
                      textAlign: 'right',
                    }}
                  >
                    תוקף
                  </label>
                  <div
                    id="pp-card-expiry"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      minHeight: 46,
                      background: 'var(--glass)',
                      border: '1px solid var(--glass-border)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--v2-gray-400)',
                      display: 'block',
                      marginBottom: 6,
                      textAlign: 'right',
                    }}
                  >
                    CVV
                  </label>
                  <div
                    id="pp-card-cvv"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      minHeight: 46,
                      background: 'var(--glass)',
                      border: '1px solid var(--glass-border)',
                    }}
                  />
                </div>
              </div>

              {/* שיטות מהירות */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {['ביט', '🍎 Pay', 'G Pay'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 10,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* סיכום */}
              <div
                style={{
                  background: 'rgba(0,195,122,0.05)',
                  border: '1px solid rgba(0,195,122,0.2)',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'right',
                }}
              >
                <p style={{ margin: 0, fontSize: 15 }}>
                  סה"כ לתשלום:{' '}
                  <strong style={{ color: '#00C37A' }}>₪{amount?.toLocaleString()}</strong>
                </p>
              </div>
            </>
          )}
        </div>

        {/* כפתור תשלום */}
        {!loading && !error && (
          <div
            style={{
              padding: 16,
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            <button
              type="button"
              onClick={handlePay}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                background: '#00C37A',
                color: '#000',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              שלם ₪{amount?.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
