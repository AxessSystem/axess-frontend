import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Monitor, CheckCircle, ArrowLeft, Clock, Upload } from 'lucide-react'
import ImportModal from '@/components/ui/ImportModal'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972500000000'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`
const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const DEFAULT_TEMPLATES = [
  { name: 'הזמנה לאירוע', template_key: 'event_invite', campaign_type: 'event_invite', message_template: 'היי {{first_name}} 👋 מזמינים אותך ל{{event_name}} בתאריך {{event_date}}. לרכישת כרטיס: {{link}}', is_default: true },
  { name: 'תזכורת לאירוע', template_key: 'event_reminder', campaign_type: 'event_reminder', message_template: 'מחר! {{event_name}} 🎉 הכרטיס שלך מחכה: {{link}}', is_default: true },
  { name: 'Follow-up אחרי אירוע', template_key: 'event_followup', campaign_type: 'event_followup', message_template: 'תודה שהגעת ל{{event_name}} 🙏 הנה הטבה לאירוע הבא שלנו: {{link}}', is_default: true },
  { name: 'קמפיין כללי', template_key: 'general', campaign_type: 'general', message_template: 'היי {{first_name}}, {{message}} {{link}}', is_default: true },
]

const TYPE_DESCRIPTIONS = {
  club: 'אירועים, שולחנות VIP, יחצ"נים',
  festival: 'כרטוס, ישיבה, ניהול אמנים',
  venue: 'כנסים, חתונות, השקות',
  restaurant: 'קמפיינים, קופונים, לקוחות חוזרים',
  gym: 'מנויים, שיעורים, תזכורות',
  hotel: 'אורחים, הטבות, חוויה',
  retail: 'מבצעים, נאמנות, SMS',
  municipal: 'אירועים קהילתיים, הרשמות, דיווח',
  organization: 'ניהול חברים, אירועים, תרומות',
  general: 'כל הכלים לפי הצורך',
}

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [showImportBlock, setShowImportBlock] = useState(true)
  const businessId = searchParams.get('business_id') || null

  const [businessTypes, setBusinessTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [selectedSubType, setSelectedSubType] = useState(null)
  const [savingType, setSavingType] = useState(false)

  const hasBusinessTypeStep = !!businessId
  const totalSteps = hasBusinessTypeStep ? 3 : 2
  const stepForExpect = hasBusinessTypeStep ? 3 : 2

  useEffect(() => {
    fetch(`${API_BASE}/api/business-types`).then(r => r.ok ? r.json() : []).then(setBusinessTypes).catch(() => [])
  }, [])

  const saveBusinessTypeAndNext = async () => {
    if (!businessId || !selectedType) return
    setSavingType(true)
    try {
      const r = await fetch(`${API_BASE}/api/admin/businesses/${businessId}/type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: selectedType.type_key, business_sub_type: selectedSubType || null }),
      })
      if (!r.ok) throw new Error()
      await fetch(`${API_BASE}/api/admin/campaigns/templates/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, templates: DEFAULT_TEMPLATES }),
      }).then(res => { if (res.ok) return; throw new Error() }).catch(() => {})
      setStep(stepForExpect)
    } catch {
      setSavingType(false)
      return
    }
    setSavingType(false)
  }

  useEffect(() => {
    if (!businessId || step !== stepForExpect) return
    fetch(`${API_BASE}/api/admin/campaigns/templates/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId, templates: DEFAULT_TEMPLATES }),
    }).then(r => { if (r.ok) return; throw new Error() }).catch(() => {})
  }, [businessId, step])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
          <span className="text-lg font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>A</span>
        </div>
        <span className="text-2xl font-black text-dark" style={{ fontFamily: 'Outfit, sans-serif' }}>AXESS</span>
      </Link>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-card-hover p-8 lg:p-12">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className={`w-8 h-1.5 rounded-full ${hasBusinessTypeStep ? 'bg-gray-200' : 'bg-primary'}`} />
                  {hasBusinessTypeStep && <div className="w-8 h-1.5 rounded-full bg-gray-200" />}
                </div>
                <span className="text-gray-500 text-sm">שלב 1 מתוך {totalSteps}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-dark mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                איך תרצה להתחיל?
              </h1>
              <p className="text-gray-500 mb-10 text-lg">
                בחר את הדרך הנוחה לך להצטרף ל-AXESS
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                {/* WhatsApp option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(hasBusinessTypeStep ? 2 : stepForExpect)}
                  className="relative border-2 border-primary bg-primary/5 rounded-2xl p-6 text-right hover:shadow-glow-primary transition-all duration-200 cursor-pointer"
                >
                  {/* Recommended badge */}
                  <div className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    הכי מהיר ✨
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle size={28} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    📱 דרך WhatsApp
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    תתחיל אונבורדינג ישירות מהסמארטפון שלך — מהיר, קל, ללא טפסים
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-primary font-semibold text-sm">
                    בחר אפשרות זו
                    <ArrowLeft size={16} />
                  </div>
                </motion.button>

                {/* Web option — coming soon */}
                <div className="relative border-2 border-gray-200 bg-gray-50 rounded-2xl p-6 text-right opacity-60 cursor-not-allowed">
                  <div className="absolute top-4 left-4 bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                    בקרוב
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Monitor size={28} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    💻 דרך האתר
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    ממשק ניהול מלא בדפדפן — כניסה עם פרטי עסק
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center text-gray-400 text-sm">
                כבר יש לך חשבון?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  כניסה למערכת
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {hasBusinessTypeStep && step === 2 && (
          <motion.div
            key="step2-type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-4xl"
          >
            <div className="bg-white rounded-3xl shadow-card-hover p-8 lg:p-12">
              <div className="flex items-center gap-2 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-gray-200" />
                </div>
                <span className="text-gray-500 text-sm">שלב 2 מתוך 3</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                מה סוג העסק שלך?
              </h1>
              <p className="text-gray-500 mb-8 text-lg">נתאים את המערכת בדיוק עבורך</p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {businessTypes.map(t => {
                  const isSelected = selectedType?.type_key === t.type_key
                  const desc = TYPE_DESCRIPTIONS[t.type_key] || ''
                  return (
                    <motion.button
                      key={t.type_key}
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedType(t); setSelectedSubType(null) }}
                      className="text-right rounded-2xl p-5 transition-all duration-200"
                      style={{
                        border: isSelected ? '2px solid var(--primary, #00C37A)' : '1px solid var(--glass-border, #e5e7eb)',
                        background: isSelected ? 'rgba(0,195,122,0.05)' : 'transparent',
                      }}
                    >
                      <span className="text-4xl block mb-3" style={{ lineHeight: 1 }}>{t.emoji || '🏬'}</span>
                      <div className="font-bold text-dark mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{t.label}</div>
                      <div className="text-gray-500 text-sm">{desc}</div>
                    </motion.button>
                  )
                })}
              </div>

              {selectedType && Array.isArray(selectedType.sub_types) && selectedType.sub_types.length > 0 && (
                <div className="mb-8 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50">
                  <div className="font-semibold text-dark mb-4">ספר לנו יותר:</div>
                  <div className="flex flex-wrap gap-3">
                    {selectedType.sub_types.map(s => (
                      <label key={s.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sub_type"
                          checked={selectedSubType === s.key}
                          onChange={() => setSelectedSubType(s.key)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-dark">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  חזור
                </button>
                <button
                  onClick={saveBusinessTypeAndNext}
                  disabled={savingType || !selectedType}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingType ? '...' : 'המשך'}
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === stepForExpect && (
          <motion.div
            key="step-expect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-card-hover p-8 lg:p-12">
              <div className="flex items-center gap-2 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  <div className="w-8 h-1.5 rounded-full bg-primary" />
                  {hasBusinessTypeStep && <div className="w-8 h-1.5 rounded-full bg-primary" />}
                </div>
                <span className="text-gray-500 text-sm">שלב {stepForExpect} מתוך {totalSteps}</span>
              </div>

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-primary" />
                </div>
                <h2 className="text-3xl font-black text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  מה מצפה לך
                </h2>
                <p className="text-gray-500 text-lg">
                  תוך 3 דקות תהיה מוכן לשלוח קמפיין ראשון
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: '🏢', label: 'פרטי העסק', time: '2 דקות', color: 'bg-blue-50 border-blue-100' },
                  { icon: '📤', label: 'שם שולח SMS', time: '30 שניות', color: 'bg-purple-50 border-purple-100' },
                  { icon: '🚀', label: 'קמפיין ראשון', time: '1 דקה', color: 'bg-green-50 border-green-100' },
                ].map(({ icon, label, time, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${color}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-dark">{label}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock size={14} />
                      {time}
                    </div>
                    <CheckCircle size={18} className="text-accent flex-shrink-0" />
                  </motion.div>
                ))}
              </div>

              {/* Optional: Upload customers */}
              {showImportBlock && (
                <div className="mb-6 p-4 rounded-xl border-2 border-gray-100 bg-gray-50">
                  <div className="font-semibold text-dark mb-2">העלה את הלקוחות שלך (אופציונלי)</div>
                  <p className="text-gray-500 text-sm mb-3">ייבוא רשימת אנשי קשר מ-CSV או Excel — תוכל לשלוח קמפיין מהר יותר</p>
                  <button
                    onClick={() => setImportOpen(true)}
                    className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-colors"
                  >
                    <Upload size={20} />
                    העלה לקוחות
                  </button>
                  <button
                    onClick={() => setShowImportBlock(false)}
                    className="w-full mt-2 text-gray-400 hover:text-gray-600 text-sm py-2"
                  >
                    דלג — אוסיף מאוחר יותר
                  </button>
                </div>
              )}

              {/* CTA */}
              <motion.a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-glow-primary"
              >
                <MessageCircle size={22} />
                בואו נתחיל
                <ArrowLeft size={20} />
              </motion.a>

              <button
                onClick={() => setStep(hasBusinessTypeStep ? 2 : 1)}
                className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
              >
                חזור
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        businessId={businessId}
        onImportDone={() => { setImportOpen(false); setShowImportBlock(false) }}
      />
    </div>
  )
}
