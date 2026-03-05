import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Save, Building2, MessageSquare, CreditCard, Bell, Wallet, User, Link2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

const TABS = [
  { id: 'account',       label: 'חשבון',      icon: User },
  { id: 'business',      label: 'פרטי עסק',   icon: Building2 },
  { id: 'sms',           label: 'הגדרות SMS', icon: MessageSquare },
  { id: 'links',         label: 'לינקים',     icon: Link2 },
  { id: 'payments',      label: 'תשלומים',    icon: Wallet },
  { id: 'billing',       label: 'חיוב',       icon: CreditCard },
  { id: 'notifications', label: 'התראות',     icon: Bell },
]

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'
const SMS_LINK_BASE = import.meta.env.VITE_SMS_LINK_BASE || 'https://axss.me'

const cardStyle = { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }
const sectionH2 = { fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 17, color: '#ffffff', marginBottom: 16 }

function LinksTab({ businessId }) {
  const [links, setLinks] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [destType, setDestType] = useState('external_url')
  const [destId, setDestId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [events, setEvents] = useState([])
  const [creating, setCreating] = useState(false)
  const [createdLink, setCreatedLink] = useState(null)

  useEffect(() => {
    if (businessId) {
      fetch(`${API_BASE}/api/admin/business-links?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setLinks).catch(() => [])
    }
  }, [businessId])

  useEffect(() => {
    if (modalOpen && businessId) {
      fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(e => setEvents(Array.isArray(e) ? e : [])).catch(() => [])
    }
  }, [modalOpen, businessId])

  const handleCreate = async () => {
    if (!label.trim() || !businessId) return
    setCreating(true)
    try {
      const body = { business_id: businessId, label: label.trim(), destination_type: destType }
      if (destType === 'event_page' && destId) body.destination_id = destId
      if (destType === 'external_url') body.metadata = { url: externalUrl }
      const r = await fetch(`${API_BASE}/api/admin/business-links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setCreatedLink(data)
      setLinks(prev => [{ ...data, label: label.trim(), destination_type: destType, clicks: 0 }, ...prev])
      setLabel('')
      setDestId('')
      setExternalUrl('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const shortUrl = createdLink ? `${SMS_LINK_BASE}/s/${createdLink.slug}` : ''

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={sectionH2}>Smart Links</h2>
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>לינקים קצרים לשיתוף ברשתות חברתיות, WhatsApp או בפרופיל</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>שם</th>
              <th style={{ textAlign: 'right', padding: 12 }}>slug</th>
              <th style={{ textAlign: 'right', padding: 12 }}>יעד</th>
              <th style={{ textAlign: 'right', padding: 12 }}>קליקים</th>
              <th style={{ textAlign: 'right', padding: 12 }}>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {links.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: 12 }}>{l.label || '—'}</td>
                <td style={{ padding: 12 }}>{l.slug}</td>
                <td style={{ padding: 12 }}>{l.destination_type}</td>
                <td style={{ padding: 12 }}>{l.clicks ?? 0}</td>
                <td style={{ padding: 12 }}>{l.created_at ? new Date(l.created_at).toLocaleDateString('he-IL') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => { setModalOpen(true); setCreatedLink(null) }} className="btn-primary" style={{ alignSelf: 'flex-start' }}>+ צור לינק חדש</button>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalOpen(false)}>
          <div dir="rtl" style={{ background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>צור לינק חדש</h3>
            {!createdLink ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">שם הלינק (לשימוש פנימי)</label>
                  <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="למשל: פרופיל אינסטגרם" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="label">סוג</label>
                  <select className="input" value={destType} onChange={e => setDestType(e.target.value)}>
                    <option value="event_page">אירוע</option>
                    <option value="external_url">URL חיצוני</option>
                  </select>
                </div>
                {destType === 'event_page' && (
                  <div style={{ marginBottom: 12 }}>
                    <select className="input" value={destId} onChange={e => setDestId(e.target.value)}>
                      <option value="">בחר אירוע</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                )}
                {destType === 'external_url' && (
                  <div style={{ marginBottom: 12 }}>
                    <input className="input" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." dir="ltr" />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={handleCreate} disabled={creating || !label.trim()} className="btn-primary">צור לינק</button>
                  <button onClick={() => setModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: 12, background: 'var(--v2-dark-3)', borderRadius: 8, marginBottom: 12, wordBreak: 'break-all' }}>{shortUrl}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard?.writeText(shortUrl).then(() => toast.success('הועתק'))} className="btn-primary">העתק</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shortUrl)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 16px', background: '#25D366', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
                </div>
                <button onClick={() => { setCreatedLink(null); setModalOpen(false) }} style={{ marginTop: 12, padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', borderRadius: 8, cursor: 'pointer' }}>סגור</button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function formatPhone(p) {
  if (!p) return '—'
  const d = String(p).replace(/\D/g, '')
  if (d.startsWith('972') && d.length >= 12) return `0${d.slice(3, 5)}-${d.slice(5, 8)}-${d.slice(8)}`
  if (d.length >= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return p
}

function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('972')) return `+${digits}`
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`
  if (digits.length >= 9) return `+972${digits}`
  return null
}

function AccountChangeModal({ type, onClose, updateUser, toE164 }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const isPhone = type === 'phone'

  const handleSubmit = async () => {
    if (!value.trim()) return
    setLoading(true)
    try {
      if (isPhone) {
        const e164 = toE164(value)
        if (!e164) throw new Error('מספר טלפון לא תקין')
        await updateUser({ phone: e164 })
        toast.success('קוד אימות נשלח — אמת בטלפון החדש')
      } else {
        await updateUser({ email: value.trim() })
        toast.success('קישור אימות נשלח למייל')
      }
      onClose()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div dir="rtl" style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 360, width: '90%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>שינוי {isPhone ? 'טלפון' : 'מייל'}</h3>
        <input
          className="input"
          type={isPhone ? 'tel' : 'email'}
          dir="ltr"
          placeholder={isPhone ? '05XXXXXXXX' : 'email@example.com'}
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>ביטול</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '10px 20px' }}>
            {loading ? '...' : isPhone ? 'שלח קוד אימות' : 'שלח קישור אימות'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
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

  const [accountChange, setAccountChange] = useState(null)
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

      {/* Account Tab */}
      {activeTab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={sectionH2}>שיתוף חשבון</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>טלפון מקושר</div>
                <div dir="ltr" style={{ fontWeight: 500, color: '#fff' }}>{user?.phone ? formatPhone(user.phone) : '—'}</div>
              </div>
              <button onClick={() => setAccountChange('phone')} style={{ padding: '8px 14px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>שנה</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>מייל מקושר</div>
                <div dir="ltr" style={{ fontWeight: 500, color: '#fff' }}>{user?.email || '—'}</div>
              </div>
              <button onClick={() => setAccountChange('email')} style={{ padding: '8px 14px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>שנה</button>
            </div>
          </div>
          {accountChange && (
            <AccountChangeModal
              type={accountChange}
              onClose={() => setAccountChange(null)}
              updateUser={updateUser}
              toE164={toE164}
            />
          )}
        </motion.div>
      )}

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

      {/* Links Tab */}
      {activeTab === 'links' && (
        <LinksTab businessId={businessId} />
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
