import { useState, useEffect } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const ROLE_LABELS = {
  owner: 'בעלים',
  manager: 'מנהל',
  event_manager: 'מנהל אירועים',
  promoter_manager: 'מנהל יחצ"נים',
  table_manager: 'מנהל שולחנות',
  door_staff: 'צוות כניסות',
  bar_staff: 'צוות בר',
  viewer: 'צופה',
}

export default function Join() {
  const [searchParams] = useSearchParams()
  const { token: tokenParam } = useParams()
  const token = tokenParam || searchParams.get('token')
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
    fetch(`${API_BASE}/api/invitations/validate?token=${encodeURIComponent(token)}`)
      .then(r => {
        if (!r.ok) throw new Error('הזמנה לא תקפה או שפג תוקפה')
        return r.json()
      })
      .then(data => {
        setInvitation(data)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!token || !session?.access_token) {
      navigate(`/login?join_token=${encodeURIComponent(token || '')}`)
      return
    }
    setAccepting(true)
    try {
      const res = await fetch(`${API_BASE}/api/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
          <button onClick={() => navigate('/')} className="btn-primary">חזרה לדף הבית</button>
        </div>
      </div>
    )
  }

  const roleLabel = ROLE_LABELS[invitation.role] || invitation.role
  const needsLogin = !session?.access_token

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 12 }}>
          הוזמנת להצטרף ל{invitation.business_name || 'עסק'}
        </h1>
        <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>בתפקיד: {roleLabel}</p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="btn-primary"
          style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700 }}
        >
          {accepting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              מעבד...
            </span>
          ) : needsLogin ? (
            'התחבר / הירשם לקבל הזמנה'
          ) : (
            'קבל הזמנה'
          )}
        </button>
        {needsLogin && (
          <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 16 }}>
            תועבר לדף הכניסה. אחרי ההתחברות תתווסף אוטומטית
          </p>
        )}
      </div>
    </div>
  )
}
