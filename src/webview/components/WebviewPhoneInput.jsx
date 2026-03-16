import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { useWebview } from '../WebviewContext'

export default function WebviewPhoneInput() {
  const { slug } = useParams()
  const { recipient, setRecipient, showPhoneInput, setShowPhoneInput } = useWebview()
  const [phone, setPhone] = useState(recipient?.phone || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!showPhoneInput) return null

  const validate = (value) => /^05\d{8}$/.test(value.replace(/\D/g, ''))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const raw = phone.replace(/\D/g, '')
    if (!validate(raw)) {
      setError('מספר טלפון לא תקין. נא להזין בפורמט 05XXXXXXXX')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const url = new URL(`${API_BASE}/api/w/${encodeURIComponent(slug)}/context`)
      url.searchParams.set('phone', raw)
      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error('שגיאה באימות הטלפון')
      }
      const data = await res.json()
      const nextRecipient =
        data?.recipient || {
          phone: raw,
          master_recipient_id: null,
        }
      setRecipient(nextRecipient)
      setShowPhoneInput(false)
    } catch (err) {
      setError(err.message || 'שגיאה באימות הטלפון')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        direction: 'rtl',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(15,23,42,0.96)',
          borderRadius: 24,
          padding: 20,
          border: '1px solid rgba(148,163,184,0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            כדי להמשיך נדרש מספר טלפון
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            נשתמש במספר רק כדי לשלוח לך אישורים ועדכוני הזמנה.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>טלפון נייד</label>
          <input
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder="05XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.6)',
              background: 'rgba(15,23,42,0.9)',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#fecaca', marginTop: 4 }}>
              {error}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 16,
            width: '100%',
            border: 'none',
            borderRadius: 12,
            padding: '12px 10px',
            background: 'var(--wv-primary, #22C55E)',
            color: '#020617',
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'מאמת…' : 'המשך'}
        </button>
      </form>
    </div>
  )
}

