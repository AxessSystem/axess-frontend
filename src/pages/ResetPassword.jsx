import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password
    })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <h2>✅ הסיסמה עודכנה בהצלחה</h2>
      <a href="/login">כנס למערכת</a>
    </div>
  )

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>איפוס סיסמה</h2>
      <input
        type="password"
        placeholder="סיסמה חדשה"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 16 }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleReset} disabled={loading}>
        {loading ? 'מעדכן...' : 'עדכן סיסמה'}
      </button>
    </div>
  )
}
