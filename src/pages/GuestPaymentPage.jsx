import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const stripePromise = import.meta.env.VITE_STRIPE_PK ? loadStripe(import.meta.env.VITE_STRIPE_PK) : null

function PaymentForm({ data, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: undefined,
        },
      })
      if (error) throw new Error(error.message)
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'שגיאה בתשלום')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || loading} style={{ width: '100%', marginTop: 20, padding: 16, background: data?.branding?.primary_color || '#00C37A', color: '#0a0a0a', fontWeight: 700, border: 'none', borderRadius: 999, cursor: loading ? 'wait' : 'pointer' }}>
        שלם ואשר הגעה →
      </button>
    </form>
  )
}

export default function GuestPaymentPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/g/token/${token}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d)
        if (d?.client_secret) setClientSecret(d.client_secret)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [token])

  const branding = data?.branding || {}
  const bg = branding.bg_color || '#0a0a0a'
  const primary = branding.primary_color || '#00C37A'

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: primary }}>טוען...</div>
      </div>
    )
  }
  if (!data) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
        הקישור לא תקין או פג תוקף
      </div>
    )
  }

  if (paid) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: bg, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>תשלומך אושר!</h1>
        <p style={{ color: 'var(--v2-gray-400)' }}>הכרטיס שלך נשלח ב-SMS</p>
        <a href="#" onClick={e => { e.preventDefault(); window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.event_title)}&dates=`, '_blank') }} style={{ padding: '12px 24px', background: primary, color: '#0a0a0a', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>הוסף ליומן</a>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{data.event_title}</h1>
        <p style={{ color: 'var(--v2-gray-400)', marginTop: 8 }}>הוזמנת לשולחן {data.table_number} על ידי {data.host_name}</p>
      </header>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        {data.event_date && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v2-gray-400)', marginBottom: 8 }}><Calendar size={16} />{new Date(data.event_date).toLocaleDateString('he-IL')}</div>}
        {data.location && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v2-gray-400)', marginBottom: 16 }}><MapPin size={16} />{data.location}</div>}
        <div style={{ fontSize: 24, fontWeight: 700, color: primary }}>סכום לתשלום: ₪{Number(data.amount || 0).toFixed(0)}</div>
      </div>

      {data.amount > 0 && stripePromise && clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
          <PaymentForm data={data} onSuccess={() => setPaid(true)} />
        </Elements>
      ) : data.amount === 0 ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>אין תשלום נדרש — הכרטיס יגיע ב-SMS</div>
      ) : (
        <div style={{ color: 'var(--v2-gray-400)' }}>תשלום לא זמין כרגע — פנה למארגן</div>
      )}
    </div>
  )
}
