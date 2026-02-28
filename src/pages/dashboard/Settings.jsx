import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Building2, Phone, MessageSquare, CreditCard, Bell, Shield, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'business', label: 'פרטי עסק',   icon: Building2 },
  { id: 'sms',      label: 'הגדרות SMS', icon: MessageSquare },
  { id: 'billing',  label: 'חיוב',       icon: CreditCard },
  { id: 'notifications', label: 'התראות', icon: Bell },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)

  const [businessForm, setBusinessForm] = useState({
    name: 'קפה רוטשילד',
    phone: '050-1234567',
    email: 'info@rotschild.co.il',
    address: 'רוטשילד 22, תל אביב',
    website: 'https://rotschild.co.il',
  })

  const [smsForm, setSmsForm] = useState({
    senderName: 'RotschildCafe',
    defaultMessage: 'שלום {שם}, קפה רוטשילד מזמינים אותך...',
    optOutText: 'להסרה שלח STOP',
  })

  const [notifications, setNotifications] = useState({
    campaignSent: true,
    lowBalance: true,
    redemption: false,
    weeklyReport: true,
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    toast.success('ההגדרות נשמרו בהצלחה')
  }

  return (
    <div className="max-w-3xl space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          הגדרות
        </h1>
        <p className="text-muted text-sm mt-0.5">נהל את פרטי העסק והעדפות המערכת</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 border border-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-subtle hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Business Tab */}
      {activeTab === 'business' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-5"
        >
          <h2 className="font-bold text-white">פרטי העסק</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">שם העסק</label>
              <input
                className="input"
                value={businessForm.name}
                onChange={e => setBusinessForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">טלפון</label>
              <input
                className="input"
                value={businessForm.phone}
                onChange={e => setBusinessForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">אימייל</label>
              <input
                type="email"
                className="input"
                value={businessForm.email}
                onChange={e => setBusinessForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">כתובת</label>
              <input
                className="input"
                value={businessForm.address}
                onChange={e => setBusinessForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">אתר אינטרנט</label>
              <input
                className="input"
                value={businessForm.website}
                onChange={e => setBusinessForm(f => ({ ...f, website: e.target.value }))}
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            שמור שינויים
          </button>
        </motion.div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-5"
        >
          <h2 className="font-bold text-white">הגדרות SMS</h2>

          <div>
            <label className="label">שם שולח (Sender ID)</label>
            <input
              className="input"
              value={smsForm.senderName}
              onChange={e => setSmsForm(f => ({ ...f, senderName: e.target.value }))}
              maxLength={11}
            />
            <div className="text-xs text-muted mt-1">
              עד 11 תווים, ללא רווחים. זה מה שהנמען יראה כשולח.
            </div>
          </div>

          <div>
            <label className="label">הודעת ברירת מחדל</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={smsForm.defaultMessage}
              onChange={e => setSmsForm(f => ({ ...f, defaultMessage: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">טקסט הסרה (Opt-out)</label>
            <input
              className="input"
              value={smsForm.optOutText}
              onChange={e => setSmsForm(f => ({ ...f, optOutText: e.target.value }))}
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            שמור
          </button>
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Current plan */}
          <div className="card">
            <h2 className="font-bold text-white mb-4">חבילה נוכחית</h2>
            <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <div>
                <div className="text-lg font-black text-white">Basic</div>
                <div className="text-sm text-muted">8 אג׳ להודעה • עד 10,000 הודעות</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary">4,820</div>
                <div className="text-xs text-muted">הודעות נותרות</div>
              </div>
            </div>
          </div>

          {/* Upgrade options */}
          <div className="card">
            <h2 className="font-bold text-white mb-4">שדרג חבילה</h2>
            <div className="space-y-3">
              {[
                { name: 'Business', price: '7', range: '10,001–50,000', highlight: true },
                { name: 'Premium', price: '6', range: '50,001–200,000', highlight: false },
                { name: 'Enterprise', price: '5', range: '200,001+', highlight: false },
              ].map(plan => (
                <div
                  key={plan.name}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    plan.highlight
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-surface-50 hover:border-border-light'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{plan.name}</div>
                    <div className="text-xs text-muted">{plan.range} הודעות</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-white">{plan.price} אג׳</div>
                      <div className="text-xs text-muted">להודעה</div>
                    </div>
                    <button className="btn-primary text-xs px-4 py-2">שדרג</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase credits */}
          <div className="card">
            <h2 className="font-bold text-white mb-4">רכישת קרדיטים</h2>
            <p className="text-muted text-sm mb-4">
              הקרדיטים לא פגים ואין דמי מנוי. שלם רק על מה ששלחת.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { amount: '5,000', price: '₪40' },
                { amount: '10,000', price: '₪80' },
                { amount: '50,000', price: '₪350' },
              ].map(opt => (
                <button
                  key={opt.amount}
                  className="p-3 bg-surface-50 border border-border rounded-xl hover:border-primary/40 transition-all text-center"
                >
                  <div className="font-black text-white text-sm">{opt.amount}</div>
                  <div className="text-xs text-muted">הודעות</div>
                  <div className="text-primary font-bold text-sm mt-1">{opt.price}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-4"
        >
          <h2 className="font-bold text-white">העדפות התראות</h2>

          {[
            { key: 'campaignSent',  label: 'קמפיין נשלח',        desc: 'קבל התראה כשקמפיין מסתיים' },
            { key: 'lowBalance',    label: 'יתרה נמוכה',          desc: 'התראה כשיתרה מתחת ל-500 הודעות' },
            { key: 'redemption',    label: 'מימוש Validator',     desc: 'התראה על כל מימוש קופון' },
            { key: 'weeklyReport',  label: 'דוח שבועי',           desc: 'סיכום שבועי באימייל' },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-muted mt-0.5">{desc}</div>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`w-12 h-6 rounded-full transition-all duration-200 flex items-center px-1 ${
                  notifications[key] ? 'bg-primary' : 'bg-surface-50 border border-border'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                  notifications[key] ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 mt-4 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            שמור
          </button>
        </motion.div>
      )}
    </div>
  )
}
