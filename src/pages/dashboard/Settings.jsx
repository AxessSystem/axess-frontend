import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Building2, MessageSquare, CreditCard, Bell, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

const TABS = [
  { id: 'business',      label: 'פרטי עסק',   icon: Building2 },
  { id: 'sms',           label: 'הגדרות SMS', icon: MessageSquare },
  { id: 'payments',      label: 'תשלומים',    icon: Wallet },
  { id: 'billing',       label: 'חיוב',       icon: CreditCard },
  { id: 'notifications', label: 'התראות',     icon: Bell },
]

const cardStyle = { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }
const sectionH2 = { fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 17, color: '#ffffff', marginBottom: 16 }

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)

  const [businessForm, setBusinessForm] = useState({
    name: 'קפה רוטשילד', phone: '050-1234567',
    email: 'info@rotschild.co.il', address: 'רוטשילד 22, תל אביב',
    website: 'https://rotschild.co.il',
  })

  const [smsForm, setSmsForm] = useState({
    senderName: 'RotschildCafe',
    defaultMessage: 'שלום {שם}, קפה רוטשילד מזמינים אותך...',
    optOutText: 'להסרה שלח STOP',
  })

  const [notifications, setNotifications] = useState({
    campaignSent: true, lowBalance: true, redemption: false, weeklyReport: true,
  })

  const [stripeStatus, setStripeStatus] = useState({ stripe_account_status: 'not_connected', service_fee_percent: 0 })
  const [stripeLoading, setStripeLoading] = useState(false)
  const [serviceFee, setServiceFee] = useState(0)
  const businessId = 'placeholder'

  useEffect(() => {
    if (activeTab === 'payments' && businessId) {
      fetch(`${API_BASE}/api/stripe/status/${businessId}`)
        .then(r => r.ok ? r.json() : {})
        .then(data => {
          setStripeStatus(data)
          setServiceFee(data.service_fee_percent ?? 0)
        })
        .catch(() => {})
    }
  }, [activeTab, businessId])

  const handleStripeConnect = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, email: businessForm.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      if (data.onboardingUrl) window.location.href = data.onboardingUrl
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleSaveServiceFee = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/service-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, service_fee_percent: serviceFee }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setStripeStatus(s => ({ ...s, service_fee_percent: data.service_fee_percent }))
      toast.success('עמלת התפעול נשמרה')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    toast.success('ההגדרות נשמרו בהצלחה')
  }

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">
      <div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>הגדרות</h1>
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>נהל את פרטי העסק והעדפות המערכת</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 4, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                background: isActive ? 'var(--v2-primary)' : 'transparent',
                color: isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--v2-gray-400)' }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Business Tab */}
      {activeTab === 'business' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>פרטי העסק</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { label: 'שם העסק', key: 'name', type: 'text' },
              { label: 'טלפון', key: 'phone', type: 'text' },
              { label: 'אימייל', key: 'email', type: 'email' },
              { label: 'כתובת', key: 'address', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} className="input" value={businessForm[key]} onChange={e => setBusinessForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">אתר אינטרנט</label>
              <input className="input" value={businessForm.website} onChange={e => setBusinessForm(f => ({ ...f, website: e.target.value }))} />
            </div>
          </div>
          <SaveButton saving={saving} onClick={handleSave} label="שמור שינויים" />
        </motion.div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>תשלומים דרך Stripe</h2>
          {stripeStatus.stripe_account_status === 'not_connected' && (
            <>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>חבר חשבון Stripe לקבלת תשלומים מאירועים ומכירת כרטיסים</p>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                {stripeLoading ? 'טוען...' : 'חבר עכשיו'}
              </button>
            </>
          )}
          {stripeStatus.stripe_account_status === 'pending' && (
            <>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>ממתין לאישור Stripe — השלם את תהליך ההרשמה</p>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="btn-primary"
                style={{ alignSelf: 'flex-start' }}
              >
                {stripeLoading ? 'טוען...' : 'המשך הגדרה'}
              </button>
            </>
          )}
          {stripeStatus.stripe_account_status === 'active' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v2-primary)' }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <span style={{ fontWeight: 600 }}>חשבון מחובר ופעיל</span>
              </div>
              <div>
                <label className="label">עמלת תפעול (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={serviceFee}
                  onChange={e => setServiceFee(parseFloat(e.target.value) || 0)}
                  className="input"
                  style={{ maxWidth: 120 }}
                />
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>נוספת ל-5% עמלת פלטפורמה</div>
              </div>
              <SaveButton saving={stripeLoading} onClick={handleSaveServiceFee} label="שמור" />
            </>
          )}
        </motion.div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>הגדרות SMS</h2>
          <div>
            <label className="label">שם שולח (Sender ID)</label>
            <input className="input" value={smsForm.senderName} maxLength={11} onChange={e => setSmsForm(f => ({ ...f, senderName: e.target.value }))} />
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>עד 11 תווים, ללא רווחים. זה מה שהנמען יראה כשולח.</div>
          </div>
          <div>
            <label className="label">הודעת ברירת מחדל</label>
            <textarea className="input" style={{ resize: 'none' }} rows={3} value={smsForm.defaultMessage} onChange={e => setSmsForm(f => ({ ...f, defaultMessage: e.target.value }))} />
          </div>
          <div>
            <label className="label">טקסט הסרה (Opt-out)</label>
            <input className="input" value={smsForm.optOutText} onChange={e => setSmsForm(f => ({ ...f, optOutText: e.target.value }))} />
          </div>
          <SaveButton saving={saving} onClick={handleSave} label="שמור" />
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Current plan */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>חבילה נוכחית</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: '#ffffff' }}>Basic</div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', marginTop: 2 }}>8 אג׳ להודעה • עד 10,000 הודעות</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 26, color: 'var(--v2-primary)', lineHeight: 1 }}>4,820</div>
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>הודעות נותרות</div>
              </div>
            </div>
          </div>

          {/* Upgrade options */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>שדרג חבילה</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Business', price: '7', range: '10,001–50,000', highlight: true },
                { name: 'Premium',  price: '6', range: '50,001–200,000', highlight: false },
                { name: 'Enterprise', price: '5', range: '200,001+',    highlight: false },
              ].map(plan => (
                <div key={plan.name}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${plan.highlight ? 'rgba(0,195,122,0.35)' : 'var(--glass-border)'}`,
                    background: plan.highlight ? 'rgba(0,195,122,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 14 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{plan.range} הודעות</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>{plan.price} אג׳</div>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>להודעה</div>
                    </div>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>שדרג</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase credits */}
          <div style={cardStyle}>
            <h2 style={sectionH2}>רכישת קרדיטים</h2>
            <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', marginBottom: 16 }}>הקרדיטים לא פגים ואין דמי מנוי. שלם רק על מה ששלחת.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { amount: '5,000', price: '₪40' },
                { amount: '10,000', price: '₪80' },
                { amount: '50,000', price: '₪350' },
              ].map(opt => (
                <button key={opt.amount}
                  style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,195,122,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 14 }}>{opt.amount}</div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>הודעות</div>
                  <div style={{ color: 'var(--v2-primary)', fontWeight: 700, fontSize: 14, marginTop: 4 }}>{opt.price}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={sectionH2}>העדפות התראות</h2>
          {[
            { key: 'campaignSent',  label: 'קמפיין נשלח',    desc: 'קבל התראה כשקמפיין מסתיים' },
            { key: 'lowBalance',    label: 'יתרה נמוכה',      desc: 'התראה כשיתרה מתחת ל-500 הודעות' },
            { key: 'redemption',    label: 'מימוש Validator', desc: 'התראה על כל מימוש קופון' },
            { key: 'weeklyReport',  label: 'דוח שבועי',       desc: 'סיכום שבועי באימייל' },
          ].map(({ key, label, desc }, idx, arr) => (
            <div key={key}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{desc}</div>
              </div>
              <button onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                style={{ width: 48, height: 24, borderRadius: 9999, background: notifications[key] ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)', border: notifications[key] ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: notifications[key] ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
              </button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <SaveButton saving={saving} onClick={handleSave} label="שמור" />
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SaveButton({ saving, onClick, label }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {saving
        ? <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--v2-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        : <Save size={16} />
      }
      {label}
    </button>
  )
}
