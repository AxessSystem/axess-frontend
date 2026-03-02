import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, TrendingUp, Send } from 'lucide-react'

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
        {/* Green pulse dot */}
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, session, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true })
    }
  }, [session, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('נא למלא אימייל וסיסמה')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
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

  const features = [
    { icon: Send,       text: 'שליחת SMS קמפיינים בקליק' },
    { icon: Shield,     text: 'אבטחה מלאה — RLS מובנה' },
    { icon: TrendingUp, text: 'דוחות ביצועים בזמן אמת' },
  ]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,195,122,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <QRLogo />
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>
            SMS Marketing Platform
          </p>
        </div>

        {/* Login Card */}
        <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 4 }}>
            כניסה למערכת
          </h2>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 24 }}>אנא הכנס את פרטי החשבון שלך</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              ) : 'כניסה'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>מערכת מאובטחת</span>
            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
          </div>

          {/* Features */}
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

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 24 }}>
          © 2026 AXESS. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  )
}
