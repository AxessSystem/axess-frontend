import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase מטפל ב-hash אוטומטית דרך onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות')
      return
    }
    if (password.length < 6) {
      setError('סיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div style={{
      maxWidth: 400, margin: '80px auto',
      padding: 24, textAlign: 'center'
    }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <h2>הסיסמה עודכנה בהצלחה!</h2>
      <a href="/login" style={{ color: '#00C37A' }}>
        כנס למערכת
      </a>
    </div>
  )

  if (!ready) return (
    <div style={{
      maxWidth: 400, margin: '80px auto',
      padding: 24, textAlign: 'center'
    }}>
      <p>טוען...</p>
    </div>
  )

  return (
    <div style={{
      maxWidth: 400, margin: '80px auto',
      padding: 24, direction: 'rtl'
    }}>
      <h2 style={{ marginBottom: 24 }}>איפוס סיסמה</h2>
      <input
        type="password"
        placeholder="סיסמה חדשה"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{
          width: '100%', padding: 12,
          marginBottom: 12, borderRadius: 8,
          border: '1px solid #333', background: '#1a1a1a',
          color: '#fff', fontSize: 16
        }}
      />
      <input
        type="password"
        placeholder="אימות סיסמה"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        style={{
          width: '100%', padding: 12,
          marginBottom: 16, borderRadius: 8,
          border: '1px solid #333', background: '#1a1a1a',
          color: '#fff', fontSize: 16
        }}
      />
      {error && (
        <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
      )}
      <button
        onClick={handleReset}
        disabled={loading || !password}
        style={{
          width: '100%', padding: 14,
          background: '#00C37A', border: 'none',
          borderRadius: 8, color: '#fff',
          fontSize: 16, cursor: 'pointer',
          fontWeight: 700
        }}
      >
        {loading ? 'מעדכן...' : 'עדכן סיסמה'}
      </button>
    </div>
  )
}
