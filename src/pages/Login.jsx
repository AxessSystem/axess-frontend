import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, TrendingUp, Send, Smartphone, Mail } from 'lucide-react'

/* ── Convert Israeli phone to E.164 ── */
function toE164(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return `+${digits}`
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`
  if (digits.length >= 9) return `+972${digits}`
  return null
}

/* ── 6-digit OTP input ── */
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([])

  const handleChange = (i, v) => {
    if (!/^\d*$/.test(v)) return
    const arr = value.split('')
    arr[i] = v.slice(-1)
    const next = arr.join('')
    onChange(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (pasted.length) {
      onChange(pasted)
      const idx = Math.min(pasted.length, 5)
      inputs.current[idx]?.focus()
    }
  }

  return (
    <div dir="ltr" style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          disabled={disabled}
          className="input"
          style={{ width: 40, height: 48, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
        />
      ))}
    </div>
  )
}

/* ── QR Logo (same as Layout.jsx DashLogo) ── */
function QRLogo() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
        <svg width={40} height={40} viewBox="0 0 36 36" fill="none">
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
            position: 'absolute', top: -5, right: -5,
            width: 12, height: 12,
            background: 'var(--v2-primary)',
            borderRadius: '50%',
            border: '2px solid var(--v2-dark)',
          }}
        />
      </div>
      <span style={{
        fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: 26,
        color: '#ffffff',
        letterSpacing: '-0.5px',
      }}>
        AXESS
      </span>
    </div>
  )
}

export default function Login() {
  useEffect(() => {
    window.history.pushState(null, '', '/login')
    window.onpopstate = () => {
      window.history.pushState(null, '', '/login')
    }
    return () => {
      window.onpopstate = null
    }
  }, [])

  const [tab, setTab] = useState('mobile') // 'mobile' | 'email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { signIn, signInWithOtp, verifyOtp, resetPasswordForEmail, session, isAxessAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === 'ok') {
      toast.success('קישור לאיפוס נשלח למייל שלך')
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  useEffect(() => {
    if (session && !authLoading) {
      const params = new URLSearchParams(window.location.search)
      const joinToken = params.get('join_token')
      if (joinToken) {
        navigate(`/join?token=${encodeURIComponent(joinToken)}`, { replace: true })
      } else if (isAxessAdmin) {
        navigate('/axess-admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [session, authLoading, isAxessAdmin, navigate])

  const handleSendCode = async () => {
    const e164 = toE164(phone)
    if (!e164) {
      toast.error('הכנס מספר טלפון תקין (05XXXXXXXX)')
      return
    }
    setLoading(true)
    try {
      await signInWithOtp(e164)
      setCodeSent(true)
      setOtp('')
      toast.success('קוד נשלח לטלפון')
    } catch (err) {
      toast.error(err.message || 'שגיאה בשליחת קוד')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const e164 = toE164(phone)
    if (!e164 || otp.length !== 6) {
      toast.error('הכנס קוד בן 6 ספרות')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(e164, otp)
      navigate('/dashboard')
      toast.success('ברוך הבא!')
    } catch (err) {
      const msg = err.message?.includes('Token has expired')
        ? 'הקוד פג תוקף — בקש קוד חדש'
        : err.message || 'קוד שגוי'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('נא למלא אימייל וסיסמה')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
      toast.success('ברוך הבא!')
    } catch (err) {
      const msg = err.message?.includes('Invalid login credentials')
        ? 'אימייל או סיסמה שגויים'
        : err.message || 'שגיאת כניסה'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('הכנס כתובת מייל')
      return
    }
    setForgotLoading(true)
    try {
      await resetPasswordForEmail(forgotEmail)
      toast.success('קישור לאיפוס נשלח למייל שלך')
      setForgotOpen(false)
      setForgotEmail('')
    } catch (err) {
      toast.error(err.message || 'שגיאה בשליחת קישור')
    } finally {
      setForgotLoading(false)
    }
  }

  const features = [
    { icon: Send, text: 'שליחת SMS קמפיינים בקליק' },
    { icon: Shield, text: 'אבטחה מלאה — RLS מובנה' },
    { icon: TrendingUp, text: 'דוחות ביצועים בזמן אמת' },
  ]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,195,122,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <QRLogo />
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>SMS Marketing Platform</p>
        </div>

        <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 4 }}>כניסה למערכת</h2>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 20 }}>אנא בחר אופן כניסה</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            <button
              type="button"
              onClick={() => { setTab('mobile'); setCodeSent(false); setOtp('') }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
                background: tab === 'mobile' ? 'var(--v2-primary)' : 'transparent',
                color: tab === 'mobile' ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Smartphone size={16} /> כניסה בנייד
            </button>
            <button
              type="button"
              onClick={() => setTab('email')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
                background: tab === 'email' ? 'var(--v2-primary)' : 'transparent',
                color: tab === 'email' ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Mail size={16} /> כניסה במייל
            </button>
          </div>

          {/* Mobile Tab */}
          {tab === 'mobile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!codeSent ? (
                <>
                  <div>
                    <label className="label" htmlFor="phone">מספר טלפון</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="input"
                      dir="ltr"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      'שלח קוד'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">קוד אימות (6 ספרות)</label>
                    <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      'אמת קוד'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodeSent(false); setOtp('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    שלח קוד מחדש
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email Tab */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label" htmlFor="email">אימייל</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                  dir="ltr"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label" htmlFor="password">סיסמה</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    style={{ paddingLeft: 40 }}
                    autoComplete="current-password"
                    dir="ltr"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--v2-gray-400)')}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--v2-primary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  שכחתי סיסמה
                </button>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    מתחבר...
                  </>
                ) : (
                  'כנס'
                )}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>מערכת מאובטחת</span>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--v2-gray-400)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,195,122,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} style={{ color: 'var(--v2-primary)' }} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 24 }}>© 2026 AXESS. כל הזכויות שמורות.</p>
      </div>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div
          onClick={() => !forgotLoading && setForgotOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            dir="rtl"
            style={{
              background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 360, width: '100%',
            }}
          >
            <h3 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 18, color: '#ffffff', marginBottom: 8 }}>שכחתי סיסמה</h3>
            <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 16 }}>הכנס את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה</p>
            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="input"
                dir="ltr"
                disabled={forgotLoading}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setForgotOpen(false)} disabled={forgotLoading}
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>ביטול</button>
                <button type="submit" className="btn-primary" disabled={forgotLoading}
                  style={{ padding: '10px 20px' }}>
                  {forgotLoading ? <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'שלח קישור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
