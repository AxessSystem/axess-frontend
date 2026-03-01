import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, Users, Zap, QrCode, MessageSquare, TrendingUp, Calendar, Hotel, Utensils, ShoppingBag, Dumbbell, Building2, Music } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const BIZ_DATA = {
  events: {
    icon: Music,
    name: 'אירועים',
    headline: 'AXESS עבור אירועים',
    tagline: 'מכרו יותר כרטיסים. מדדו כל יחצ"ן. הגדילו הכנסות.',
    color: '#A855F7',
    features: [
      {
        icon: BarChart3,
        title: 'ניתוח מכירות בזמן אמת',
        desc: 'גרף חי של כרטיסים שנמכרו לפי שעה — ראה מה עובד עוד לפני שהאירוע מתחיל',
      },
      {
        icon: Users,
        title: 'ניהול יחצ"נים ורשימות',
        desc: 'כל יחצ"ן עם קוד ייחודי, מעקב מכירות בזמן אמת, עמלות אוטומטיות',
      },
      {
        icon: Zap,
        title: 'דחיפה לנוטשים',
        desc: 'SMS אוטומטי ל-250 שגלשו ולא קנו — עם קופון ₪20 ל-15 דקות',
      },
      {
        icon: QrCode,
        title: 'כרטיס כניסה דיגיטלי',
        desc: 'QR ייחודי לכל קונה, ולידציה בשניות בכניסה, ללא תורים',
      },
    ],
    stats: [
      { value: '+34%', label: 'יותר מכירות' },
      { value: '3 דק׳', label: 'עד שליחה' },
      { value: '0 עמלה', label: 'הצטרפות' },
    ],
  },
  hotels: {
    icon: Hotel,
    name: 'מלונות',
    headline: 'AXESS עבור מלונות',
    tagline: 'חסכו בעמלות בוקינג. שדרגו חוויית אורח. הגדילו Upsell.',
    color: '#B8860B',
    features: [
      {
        icon: Calendar,
        title: "צ'ק-אין דיגיטלי",
        desc: "אורחים מקבלים כרטיס דיגיטלי ב-SMS — ללא תורים, ללא נייר",
      },
      {
        icon: TrendingUp,
        title: 'Upsell אוטומטי',
        desc: 'שלח הצעות שדרוג, ספא, ארוחות — בדיוק כשהאורח הכי קשוב',
      },
      {
        icon: MessageSquare,
        title: 'תקשורת ישירה',
        desc: 'Room service, בקשות מיוחדות, פידבק — הכל דרך SMS',
      },
      {
        icon: BarChart3,
        title: 'חיסכון בעמלות',
        desc: 'הפחת תלות ב-Booking ו-Airbnb — בנה ערוץ ישיר עם האורחים',
      },
    ],
    stats: [
      { value: '₪12K', label: 'חיסכון חודשי' },
      { value: '+28%', label: 'Upsell rate' },
      { value: '4.8★', label: 'שביעות רצון' },
    ],
  },
  restaurants: {
    icon: Utensils,
    name: 'מסעדות',
    headline: 'AXESS עבור מסעדות',
    tagline: 'הפוך לקוחות חד-פעמיים ללקוחות קבועים.',
    color: '#E85D04',
    features: [
      {
        icon: Users,
        title: 'ניהול לקוחות חוזרים',
        desc: 'זהה VIP אוטומטית, שלח הצעות מותאמות, בנה נאמנות אמיתית',
      },
      {
        icon: QrCode,
        title: 'תפריט דיגיטלי + הזמנה',
        desc: 'QR בשולחן → תפריט → הזמנה → תשלום. ללא מלצר בשלב הראשון',
      },
      {
        icon: Zap,
        title: 'קמפיין "לא ביקרת 30 יום"',
        desc: 'מערכת מזהה לקוחות שנעלמו ושולחת הצעה אוטומטית לחזרה',
      },
      {
        icon: Calendar,
        title: 'ניהול הזמנות',
        desc: 'אישור הזמנה ב-SMS, תזכורת שעה לפני, ביטול עם לחיצה',
      },
    ],
    stats: [
      { value: '+40%', label: 'לקוחות חוזרים' },
      { value: '₪4.2K', label: 'הכנסה נוספת/חודש' },
      { value: '8 דק׳', label: 'הגדרה ראשונית' },
    ],
  },
  stores: {
    icon: ShoppingBag,
    name: 'חנויות',
    headline: 'AXESS עבור חנויות',
    tagline: 'שיווק ממוקד. פחות הנחות. יותר רכישות.',
    color: '#0EA5E9',
    features: [
      {
        icon: Users,
        title: 'סגמנטציה חכמה',
        desc: 'שלח הצעות לפי היסטוריית רכישות — לא לכולם, לנכונים',
      },
      {
        icon: QrCode,
        title: 'קופון ייחודי לכל לקוח',
        desc: 'כל לקוח מקבל קוד אישי — מדידה מדויקת של כל קמפיין',
      },
      {
        icon: TrendingUp,
        title: 'מבצעי Flash',
        desc: 'שלח מבצע ל-2 שעות — צור דחיפות, מדוד תגובה בזמן אמת',
      },
      {
        icon: BarChart3,
        title: 'ROI לכל קמפיין',
        desc: 'ראה בדיוק כמה כסף הכניס כל SMS — עלות vs הכנסה',
      },
    ],
    stats: [
      { value: '4,475%', label: 'ממוצע ROI' },
      { value: '+22%', label: 'ממוצע סל קנייה' },
      { value: '48h', label: 'זמן עד תוצאה' },
    ],
  },
  gyms: {
    icon: Dumbbell,
    name: 'חדרי כושר',
    headline: 'AXESS עבור חדרי כושר',
    tagline: 'הפחת נטישה. הגדל חידושי מנוי. שמור על חברים.',
    color: '#10B981',
    features: [
      {
        icon: Calendar,
        title: 'כרטיסיית כניסה דיגיטלית',
        desc: 'כל כניסה נרשמת אוטומטית — ראה מי פעיל ומי עומד לנטוש',
      },
      {
        icon: Zap,
        title: 'תזכורת חידוש מנוי',
        desc: 'SMS אוטומטי שבוע לפני פקיעה — עם הצעה מיוחדת לחידוש מוקדם',
      },
      {
        icon: Users,
        title: 'זיהוי נוטשים',
        desc: 'חבר שלא הגיע 14 יום? מקבל הודעה אישית עם תמריץ לחזרה',
      },
      {
        icon: TrendingUp,
        title: 'מכירת שירותים נוספים',
        desc: 'Personal Training, תזונה, ציוד — שלח הצעות לחברים הנכונים',
      },
    ],
    stats: [
      { value: '-38%', label: 'נטישת חברים' },
      { value: '+55%', label: 'חידוש מנוי' },
      { value: '2 דק׳', label: 'הגדרת קמפיין' },
    ],
  },
  orgs: {
    icon: Building2,
    name: 'ארגונים',
    headline: 'AXESS עבור ארגונים',
    tagline: 'תקשורת ממוקדת לחברים. מדידה. שקיפות.',
    color: '#6366F1',
    features: [
      {
        icon: Users,
        title: 'ניהול חברים',
        desc: 'רשימת חברים מרכזית עם תגיות, מעמד, היסטוריה — הכל במקום אחד',
      },
      {
        icon: MessageSquare,
        title: 'תקשורת ממוקדת',
        desc: 'שלח לכל קבוצה את המסר הרלוונטי — ללא רעש, ללא ספאם',
      },
      {
        icon: QrCode,
        title: 'כרטיס חבר דיגיטלי',
        desc: 'כל חבר עם כרטיס ייחודי — כניסה לאירועים, הטבות, אימות זהות',
      },
      {
        icon: BarChart3,
        title: 'דוחות מעורבות',
        desc: 'ראה מי קרא, מי לחץ, מי מימש — מדד מעורבות לכל תקשורת',
      },
    ],
    stats: [
      { value: '96%', label: 'Delivery rate' },
      { value: '+45%', label: 'מעורבות חברים' },
      { value: '5 דק׳', label: 'עד קמפיין חי' },
    ],
  },
}

export default function BusinessModal({ bizKey, onClose }) {
  const biz = BIZ_DATA[bizKey]

  useEffect(() => {
    if (bizKey) {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [bizKey])

  if (!biz) return null

  const Icon = biz.icon

  return (
    <AnimatePresence>
      {bizKey && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              inset: '0 0 0 0',
              zIndex: 201,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0 0 0 0',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 760,
                maxHeight: '90vh',
                background: 'var(--v2-dark-2)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '24px 24px 0 0',
                overflowY: 'auto',
                pointerEvents: 'all',
                padding: '32px 28px 40px',
              }}
              className="md:rounded-3xl md:my-auto md:mx-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    cursor: 'pointer',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: `${biz.color}18`,
                    border: `1px solid ${biz.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={26} style={{ color: biz.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: 24,
                      color: '#ffffff',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {biz.headline}
                  </h2>
                  <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, margin: '4px 0 0' }}>
                    {biz.tagline}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                {biz.stats.map(stat => (
                  <div
                    key={stat.label}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: '14px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Bricolage Grotesque', monospace",
                        fontWeight: 800,
                        fontSize: 22,
                        color: biz.color,
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ color: 'var(--v2-gray-400)', fontSize: 12 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Features grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                  marginBottom: 28,
                }}
              >
                {biz.features.map((f, i) => {
                  const FIcon = f.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16,
                        padding: '18px 16px',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: `${biz.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FIcon size={18} style={{ color: biz.color }} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 4 }}>
                          {f.title}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', lineHeight: 1.6 }}>
                          {f.desc}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* CTA */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-v2-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '16px 32px' }}
              >
                התחל עם {biz.name} — חינם ←
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
