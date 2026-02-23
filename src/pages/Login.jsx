import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Zap, Shield, TrendingUp } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, session, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session && profile) {
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (profile.role === 'producer') {
        navigate('/producer', { replace: true })
      }
    }
  }, [session, profile, navigate])

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
    { icon: Zap, text: 'ניהול אירועים בזמן אמת' },
    { icon: Shield, text: 'RLS — בידוד נתונים מלא' },
    { icon: TrendingUp, text: 'דוחות ועמלות אוטומטיות' },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #25D366, transparent)' }}
      />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-wa mb-4 glow-wa">
            <span className="text-3xl font-black text-white">A</span>
          </div>
          <h1 className="text-3xl font-black text-gradient-wa tracking-tight">AXESS</h1>
          <p className="text-muted text-sm mt-1">Event OS & Marketing Engine</p>
        </div>

        {/* Login Card */}
        <div className="card border-border-light">
          <h2 className="text-xl font-bold text-white mb-1">כניסה למערכת</h2>
          <p className="text-muted text-sm mb-6">אנא הכנס את פרטי החשבון שלך</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">אימייל</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
                dir="ltr"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label" htmlFor="password">סיסמה</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  autoComplete="current-password"
                  dir="ltr"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-subtle transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  מתחבר...
                </>
              ) : (
                'כניסה'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">מערכת מאובטחת</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Features */}
          <div className="space-y-2">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted">
                <div className="w-6 h-6 rounded-lg bg-wa/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-wa" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          © 2025 Axess — Event OS. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  )
}
