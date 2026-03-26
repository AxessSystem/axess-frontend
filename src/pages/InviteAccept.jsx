import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const ROLE_LABELS = {
  owner: 'בעלים',
  manager: 'מנהל',
  event_manager: 'מנהל אירועים',
  promoter_manager: 'מנהל יחצ"נים',
  table_manager: 'מנהל שולחנות',
  door_staff: 'צוות כניסות',
  bar_staff: 'צוות בר',
  viewer: 'צופה',
  inbox_agent: 'סוכן אינבוקס',
  event_producer: 'מפיק אירועים',
  campaign_manager: 'מנהל קמפיינים',
  scanner: 'סורק',
  analyst: 'אנליסט',
  coordinator: 'רכז',
  division_head: 'ראש מחלקה',
  department_manager: 'מנהל מחלקה',
  external_auditor: 'ביקורת חיצונית',
}

export default function InviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('חסר קישור הזמנה')
      setLoading(false)
      return
    }
    fetch(`${API_BASE}/api/staff/invite/validate?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || 'הזמנה לא תקפה או שפג תוקפה')
        return data
      })
      .then((data) => {
        setInvitation(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const goLogin = () => {
    if (token) sessionStorage.setItem('axess_invite_token', token)
    navigate('/login')
  }

  const handleAccept = async () => {
    if (!token || !session?.access_token) {
      goLogin()
      return
    }
    setAccepting(true)
    try {
      const res = await fetch(`${API_BASE}/api/staff/invite/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      toast.success('הצטרפת בהצלחה!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'שגיאה בקבלת ההזמנה')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(0,195,122,0.3)', borderTopColor: 'var(--v2-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 8 }}>הזמנה לא תקפה</h1>
          <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>{error}</p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', padding: '12px 24px', textDecoration: 'none' }}>חזרה לדף הבית</Link>
        </div>
      </div>
    )
  }

  const roleLabel = ROLE_LABELS[invitation.role] || invitation.custom_role || invitation.role
  const needsLogin = !session?.access_token

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 12 }}>
          הוזמנת ל-{invitation.business_name || 'עסק'}
        </h1>
        <p style={{ color: 'var(--v2-gray-400)', marginBottom: 28 }}>בתפקיד: {roleLabel}</p>

        {needsLogin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" onClick={goLogin} className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700 }}>
              צור חשבון
            </button>
            <button
              type="button"
              onClick={goLogin}
              style={{
                width: '100%',
                padding: 14,
                fontSize: 15,
                fontWeight: 700,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              התחבר עם חשבון קיים
            </button>
            <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', margin: 0 }}>אחרי התחברות תועבר לכאן כדי להשלים את ההצטרפות</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="btn-primary"
            style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700 }}
          >
            {accepting ? 'מעבד...' : 'השלם הצטרפות לדשבורד'}
          </button>
        )}
      </div>
    </div>
  )
}
