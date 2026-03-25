import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shield, Lock, Zap } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app').replace(/\/$/, '')

/** אייקון QR — כמו ב-Login.jsx (בלי טקסט AXESS) */
function QRLogo({ size = 40 }) {
  const dot = Math.max(8, Math.round(size * 0.3))
  const edge = Math.round(-size * 0.125)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-flex' }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <rect x="1" y="1" width="34" height="34" rx="6" stroke="var(--v2-primary)" strokeWidth="1.5" fill="#161E2E" />
        <rect x="5" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
        <rect x="7" y="7" width="6" height="6" rx="1" fill="#161E2E" />
        <rect x="9" y="9" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="21" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
        <rect x="23" y="7" width="6" height="6" rx="1" fill="#161E2E" />
        <rect x="25" y="9" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="5" y="21" width="10" height="10" rx="2" fill="var(--v2-primary)" />
        <rect x="7" y="23" width="6" height="6" rx="1" fill="#161E2E" />
        <rect x="9" y="25" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="17" y="5" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="17" y="9" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="21" y="17" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="25" y="17" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="17" y="21" width="2" height="2" fill="var(--v2-primary)" />
        <rect x="25" y="25" width="2" height="2" fill="var(--v2-primary)" />
      </svg>
      <div
        className="animate-pulse-green"
        style={{
          position: 'absolute',
          top: edge,
          right: edge,
          width: dot,
          height: dot,
          background: 'var(--v2-primary)',
          borderRadius: '50%',
          border: '2px solid var(--v2-dark)',
        }}
      />
    </div>
  )
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? decodeURIComponent(parts.slice(1).join('=')) : r
  }, '')
}

function setIdentity(id, phone) {
  setCookie('axess_uid', id, 365)
  setCookie('axess_phone', phone, 365)
  try {
    localStorage.setItem('axess_uid', id)
    localStorage.setItem('axess_phone', phone)
  } catch {
    /* ignore */
  }
}

function getIdentity() {
  return {
    uid: getCookie('axess_uid') || localStorage.getItem('axess_uid'),
    phone: getCookie('axess_phone') || localStorage.getItem('axess_phone'),
  }
}

export default function AuthConnect() {
  const [searchParams] = useSearchParams()
  const partner = searchParams.get('partner')
  const returnUrl = searchParams.get('return')
  const city = searchParams.get('city')

  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirectAttempts, setRedirectAttempts] = useState(0)

  const createTokenAndRedirect = useCallback(
    async (userPhone) => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/create-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: userPhone,
            partner,
            city,
            return_url: returnUrl,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'שגיאה')
        if (data.redirect_url) {
          setStep('success')
          window.location.href = data.redirect_url
          return
        }
        throw new Error('אין הפניה')
      } catch {
        setRedirectAttempts((a) => a + 1)
        setError('שגיאה — נסה שוב')
      }
    },
    [partner, city, returnUrl]
  )

  useEffect(() => {
    const { uid, phone: savedPhone } = getIdentity()
    if (uid && savedPhone && returnUrl) {
      createTokenAndRedirect(savedPhone)
    }
  }, [returnUrl, createTokenAndRedirect])

  if (!returnUrl) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, textAlign: 'center' }}>
          <QRLogo size={36} />
          <h2 style={{ color: '#0a1628', marginTop: 16, fontFamily: 'Heebo, sans-serif' }}>AXESS Identity</h2>
          <p style={{ color: '#6b7280', fontSize: 14, fontFamily: 'Heebo, sans-serif' }}>
            דף זה משמש לזיהוי משתמשים דרך שותפי AXESS.
          </p>
        </div>
      </div>
    )
  }

  const sendOTP = async () => {
    setLoading(true)
    setError('')
    try {
      const slug = city || 'axess'
      const res = await fetch(`${API_BASE}/api/portal/${encodeURIComponent(slug)}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'שגיאה בשליחת קוד')
      setStep('otp')
    } catch (e) {
      setError(e.message || 'שגיאה בשליחת קוד')
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    setLoading(true)
    setError('')
    try {
      const slug = city || 'axess'
      const res = await fetch(`${API_BASE}/api/portal/${encodeURIComponent(slug)}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.verified || !data.recipient?.master_recipient_id) {
        throw new Error(data.error || 'קוד שגוי — נסה שוב')
      }
      setIdentity(data.recipient.master_recipient_id, phone)
      await createTokenAndRedirect(phone)
    } catch (e) {
      setError(e.message || 'קוד שגוי — נסה שוב')
    }
    setLoading(false)
  }

  if (redirectAttempts >= 2) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: '#0a1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Heebo, sans-serif',
          padding: 16,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 380,
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#374151', marginBottom: 16 }}>משהו השתבש בזיהוי האוטומטי.</p>
          {returnUrl ? (
            <button
              type="button"
              onClick={() => {
                window.location.href = returnUrl
              }}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                background: '#0a1628',
                color: '#fff',
                border: 'none',
                fontFamily: 'Heebo',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              המשך בלי זיהוי →
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Heebo, sans-serif',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 380,
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <QRLogo size={36} />
            <span
              style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: 28,
                fontWeight: 900,
                color: '#0a1628',
                letterSpacing: -1,
              }}
            >
              AXESS
            </span>
          </div>
          {partner && (
            <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0', textAlign: 'center' }}>שותף: {partner}</p>
          )}
          {city && (
            <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0', textAlign: 'center' }}>זיהוי תושב — {city}</p>
          )}
        </div>

        {step === 'phone' && (
          <>
            <p style={{ color: '#374151', fontSize: 16, marginBottom: 20 }}>הזן מספר נייד לזיהוי מהיר</p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-0000000"
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                padding: '0 16px',
                fontSize: 18,
                textAlign: 'center',
                boxSizing: 'border-box',
                marginBottom: 16,
                fontFamily: 'Heebo',
              }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              type="button"
              onClick={sendOTP}
              disabled={loading || phone.replace(/\D/g, '').length < 9}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                background: loading ? '#9CA3AF' : '#0a1628',
                color: '#fff',
                border: 'none',
                fontFamily: 'Heebo',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {loading ? 'שולח...' : 'שלח קוד אימות'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p style={{ color: '#374151', fontSize: 15, marginBottom: 20 }}>הזן את הקוד שנשלח ל-{phone}</p>
            <input
              type="tel"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                padding: '0 16px',
                fontSize: 28,
                textAlign: 'center',
                letterSpacing: 8,
                boxSizing: 'border-box',
                marginBottom: 16,
                fontFamily: 'Heebo',
              }}
            />
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              type="button"
              onClick={verifyOTP}
              disabled={loading || otp.length < 6}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                background: loading ? '#9CA3AF' : '#00C37A',
                color: '#000',
                border: 'none',
                fontFamily: 'Heebo',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {loading ? 'מאמת...' : 'אמת וכנס'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: 13,
                cursor: 'pointer',
                marginTop: 12,
              }}
            >
              ← חזור
            </button>
          </>
        )}

        {step === 'success' && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#0a1628', fontSize: 22, fontWeight: 800 }}>זוהית בהצלחה!</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>מועבר לאתר...</p>
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            {[
              { icon: <Shield size={16} />, label: 'מאובטח' },
              { icon: <Lock size={16} />, label: 'פרטי' },
              { icon: <Zap size={16} />, label: 'מהיר' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF', fontSize: 12 }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>
            Powered by <span style={{ color: '#00C37A', fontWeight: 700 }}>AXESS</span>
          </p>
        </div>
      </div>
    </div>
  )
}
