import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export default function PromoterJoinPage() {
  const { code } = useParams()
  const [promoter, setPromoter] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', identification_number: '', instagram: '' })
  const [step, setStep] = useState('loading')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!code) {
      setStep('error')
      return
    }
    fetch(`${API_BASE}/promoter/join/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.promoter) {
          setPromoter(d.promoter)
          setForm((f) => ({
            ...f,
            first_name: d.promoter.first_name || '',
            last_name: d.promoter.last_name || '',
            email: d.promoter.email || '',
            identification_number: d.promoter.identification_number || '',
            instagram: d.promoter.instagram || '',
          }))
          setStep('fill')
        } else {
          setStep('error')
        }
      })
      .catch(() => setStep('error'))
  }, [code])

  const handleSubmit = async () => {
    setSaving(true)
    const r = await fetch(`${API_BASE}/promoter/join/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json().catch(() => ({}))
    if (d.promoter) setPromoter((p) => ({ ...p, ...d.promoter }))
    setSaving(false)
    setStep('done')
  }

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        טוען...
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 12 }}>
        <p style={{ fontSize: 24 }}>❌</p>
        <p style={{ fontSize: 18, fontWeight: 700 }}>לינק לא תקין</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>הלינק פג תוקף או לא קיים</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 12, padding: 24 }}>
        <p style={{ fontSize: 40 }}>🎉</p>
        <p style={{ fontSize: 22, fontWeight: 800 }}>ברוך הבא למערכת!</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          הפרטים שלך עודכנו בהצלחה.
          <br />
          תקבל/י הודעה בWhatsApp עם הלינק האישי שלך.
        </p>
        <div style={{ background: 'rgba(0,195,122,0.1)', border: '1px solid rgba(0,195,122,0.3)', borderRadius: 12, padding: 16, marginTop: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#00C37A' }}>הקוד האישי שלך:</p>
          <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, letterSpacing: 3, color: '#00C37A' }}>{promoter?.seller_code}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', color: '#fff', padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 32, fontWeight: 900, color: '#00C37A', letterSpacing: 3, margin: '0 0 8px' }}>AXESS</p>
        <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>הצטרף כיחצ&quot;ן</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          שלום
          {' '}
          {promoter?.name || promoter?.phone}
          ! מלא/י את הפרטים החסרים
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>שם פרטי *</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="שם פרטי"
              style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0 14px', fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>שם משפחה *</label>
            <input
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="שם משפחה"
              style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0 14px', fontSize: 15, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>מייל *</label>
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="your@email.com"
            type="email"
            style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0 14px', fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>תעודת זהות (לחשבונית)</label>
          <input
            value={form.identification_number}
            onChange={(e) => setForm((f) => ({ ...f, identification_number: e.target.value }))}
            placeholder="מספר ת.ז"
            style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0 14px', fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>אינסטגרם (אופציונלי)</label>
          <input
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            placeholder="@username"
            style={{ width: '100%', height: 46, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0 14px', fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="button"
          disabled={!form.first_name || !form.last_name || !form.email || saving}
          onClick={handleSubmit}
          style={{
            height: 52,
            borderRadius: 12,
            border: 'none',
            background: form.first_name && form.last_name && form.email ? '#00C37A' : 'rgba(255,255,255,0.1)',
            color: form.first_name && form.last_name && form.email ? '#000' : 'rgba(255,255,255,0.3)',
            fontWeight: 800,
            fontSize: 17,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          {saving ? 'שומר...' : 'אישור ✓'}
        </button>
      </div>
    </div>
  )
}
