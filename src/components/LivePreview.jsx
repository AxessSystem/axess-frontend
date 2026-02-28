import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

/* ── Mini line chart SVG ── */
function MiniChart({ color = '#2563EB' }) {
  const points = [10, 25, 18, 40, 35, 55, 48, 70, 62, 85]
  const w = 120, h = 40
  const max = Math.max(...points)
  const coords = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / max) * h}`)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── QR Code SVG (geometric placeholder) ── */
function QRCodeSVG({ size = 80, color = '#ffffff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="2" y="2" width="24" height="24" rx="2" stroke={color} strokeWidth="2.5" fill="none" />
      <rect x="8" y="8" width="12" height="12" rx="1" fill={color} />
      <rect x="54" y="2" width="24" height="24" rx="2" stroke={color} strokeWidth="2.5" fill="none" />
      <rect x="60" y="8" width="12" height="12" rx="1" fill={color} />
      <rect x="2" y="54" width="24" height="24" rx="2" stroke={color} strokeWidth="2.5" fill="none" />
      <rect x="8" y="60" width="12" height="12" rx="1" fill={color} />
      <rect x="34" y="2" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="2" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="8" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="8" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="14" width="4" height="4" rx="0.5" fill={color} />
      <rect x="46" y="14" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="46" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="52" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="40" width="4" height="4" rx="0.5" fill={color} />
      <rect x="46" y="40" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="46" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="46" width="4" height="4" rx="0.5" fill={color} />
      <rect x="52" y="46" width="4" height="4" rx="0.5" fill={color} />
      <rect x="54" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="60" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="66" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="72" y="34" width="4" height="4" rx="0.5" fill={color} />
      <rect x="60" y="40" width="4" height="4" rx="0.5" fill={color} />
      <rect x="72" y="40" width="4" height="4" rx="0.5" fill={color} />
      <rect x="54" y="46" width="4" height="4" rx="0.5" fill={color} />
      <rect x="66" y="46" width="4" height="4" rx="0.5" fill={color} />
      <rect x="54" y="52" width="4" height="4" rx="0.5" fill={color} />
      <rect x="60" y="52" width="4" height="4" rx="0.5" fill={color} />
      <rect x="72" y="52" width="4" height="4" rx="0.5" fill={color} />
      <rect x="54" y="58" width="4" height="4" rx="0.5" fill={color} />
      <rect x="66" y="58" width="4" height="4" rx="0.5" fill={color} />
      <rect x="72" y="58" width="4" height="4" rx="0.5" fill={color} />
      <rect x="54" y="64" width="4" height="4" rx="0.5" fill={color} />
      <rect x="60" y="64" width="4" height="4" rx="0.5" fill={color} />
      <rect x="66" y="64" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="52" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="52" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="58" width="4" height="4" rx="0.5" fill={color} />
      <rect x="46" y="58" width="4" height="4" rx="0.5" fill={color} />
      <rect x="40" y="64" width="4" height="4" rx="0.5" fill={color} />
      <rect x="34" y="70" width="4" height="4" rx="0.5" fill={color} />
      <rect x="46" y="70" width="4" height="4" rx="0.5" fill={color} />
    </svg>
  )
}

/* ── TAB CONFIGS ── */
const TABS = [
  {
    id: 'events',
    label: 'אירועים',
    theme: {
      bg: '#0F172A',
      accent: '#A855F7',
      accentLight: '#F3E8FF',
      text: '#ffffff',
      subtext: '#94A3B8',
      cardBg: '#1E293B',
      cardBorder: '#334155',
    },
    dashboard: {
      title: 'לוח בקרה — אירועים',
      kpi: { label: 'נמכרו הלילה', value: '847', unit: 'כרטיסים', color: '#A855F7' },
      list: [
        { name: 'TLV Promotions', count: '312', pct: '37%' },
        { name: 'Night Agency', count: '289', pct: '34%' },
        { name: 'Direct Sales', count: '246', pct: '29%' },
      ],
      cta: { icon: '⚡', text: 'שלח דחיפה לנוטשים (250)' },
    },
    validator: {
      bg: 'linear-gradient(160deg, #0F172A 0%, #1E1040 100%)',
      accent: '#A855F7',
      title: 'TECHNO FRIDAY',
      subtitle: '14.03.2026 • The Block TLV',
      badge: 'כרטיס כניסה',
      btns: [
        { icon: '🗺️', text: 'נווט למסיבה' },
        { icon: '🍾', text: 'הזמן בקבוק לשולחן' },
      ],
    },
  },
  {
    id: 'hotels',
    label: 'מלונות',
    theme: {
      bg: '#FAFAF7',
      accent: '#B8860B',
      accentLight: '#FEF9EE',
      text: '#1C1917',
      subtext: '#78716C',
      cardBg: '#FFFFFF',
      cardBorder: '#E7E5E4',
    },
    dashboard: {
      title: 'לוח בקרה — מלונות',
      kpi: { label: "צ'ק-אין דיגיטלי היום", value: '24', unit: 'אורחים', color: '#B8860B' },
      list: [
        { name: "חדר 302 — Room Service", count: '✓', pct: '' },
        { name: 'חדר 415 — Late Checkout', count: '✓', pct: '' },
        { name: 'חדר 108 — Airport Taxi', count: '⏳', pct: '' },
      ],
      cta: { icon: '📤', text: 'שלח הצעת Upsell לאורחים פעילים' },
      stat: 'חסכנו: ₪12,400 עמלות בוקינג החודש',
    },
    validator: {
      bg: 'linear-gradient(160deg, #FFFDF5 0%, #FEF3C7 100%)',
      accent: '#B8860B',
      title: 'כרטיס אורח דיגיטלי',
      subtitle: 'שלום David, ברוכים הבאים',
      badge: 'חדר 412 — Deluxe Suite',
      btns: [
        { icon: '🔑', text: 'פתח דלת' },
        { icon: '🛎️', text: 'בקש שירות' },
      ],
      dark: false,
    },
  },
  {
    id: 'restaurants',
    label: 'מסעדות',
    theme: {
      bg: '#FFFBF5',
      accent: '#E85D04',
      accentLight: '#FFF0E6',
      text: '#1C1917',
      subtext: '#78716C',
      cardBg: '#FFFFFF',
      cardBorder: '#FED7AA',
    },
    dashboard: {
      title: 'לוח בקרה — מסעדות',
      kpi: { label: 'רשימת המתנה פעילה', value: '8', unit: 'שולחנות', color: '#E85D04' },
      list: [
        { name: 'לקוחות VIP חוזרים היום', count: '3', pct: '' },
        { name: 'מכירת חבילות מראש', count: '₪4,200', pct: '' },
        { name: 'הזמנות לשישי הקרוב', count: '47', pct: '' },
      ],
      cta: { icon: '🎯', text: "שלח הצעה ללקוחות שלא ביקרו 30 יום" },
    },
    validator: {
      bg: 'linear-gradient(160deg, #FFFBF5 0%, #FEE2CC 100%)',
      accent: '#E85D04',
      title: 'הזמנה מאושרת ✓',
      subtitle: 'משפחת כהן — שולחן 8',
      badge: 'היום, 19:30',
      btns: [
        { icon: '📖', text: 'תפריט דיגיטלי' },
        { icon: '🤚', text: 'קרא למלצר' },
        { icon: '💳', text: 'בקש חשבון' },
      ],
      dark: false,
    },
  },
]

/* ── Browser Mock Frame ── */
function BrowserFrame({ children, bg = '#ffffff' }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 text-center mx-2">
          axess.co.il/dashboard
        </div>
      </div>
      <div style={{ background: bg }}>
        {children}
      </div>
    </div>
  )
}

/* ── Dashboard Panel ── */
function DashboardPanel({ tab }) {
  const { theme, dashboard } = tab
  const isDark = theme.bg === '#0F172A'

  return (
    <BrowserFrame bg={theme.bg}>
      <div className="p-4 space-y-3" style={{ minHeight: 320 }}>
        {/* Header */}
        <div className="text-xs font-semibold mb-3" style={{ color: theme.subtext }}>
          {dashboard.title}
        </div>

        {/* KPI Card */}
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          <div>
            <div className="text-xs mb-1" style={{ color: theme.subtext }}>{dashboard.kpi.label}</div>
            <div className="text-2xl font-black" style={{ color: dashboard.kpi.color, fontFamily: 'Outfit, sans-serif' }}>
              {dashboard.kpi.value}
              <span className="text-sm font-medium mr-1" style={{ color: theme.subtext }}>{dashboard.kpi.unit}</span>
            </div>
          </div>
          <MiniChart color={dashboard.kpi.color} />
        </div>

        {/* Stat (hotels only) */}
        {dashboard.stat && (
          <div
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.accent}30` }}
          >
            💰 {dashboard.stat}
          </div>
        )}

        {/* List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${theme.cardBorder}` }}
        >
          {dashboard.list.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 text-xs"
              style={{
                background: i % 2 === 0 ? theme.cardBg : `${theme.cardBg}88`,
                borderBottom: i < dashboard.list.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
                color: theme.text,
              }}
            >
              <span style={{ color: theme.subtext }}>{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: theme.text }}>{item.count}</span>
                {item.pct && <span style={{ color: theme.accent }}>{item.pct}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: theme.accent, color: '#ffffff' }}
        >
          {dashboard.cta.icon} {dashboard.cta.text}
        </button>
      </div>
    </BrowserFrame>
  )
}

/* ── Phone / Validator Panel ── */
function ValidatorPanel({ tab }) {
  const { validator } = tab
  const isDark = !validator.dark && validator.bg.includes('#0F172A') || validator.bg.includes('#1E1040')
  const textColor = isDark ? '#ffffff' : '#1C1917'
  const subtextColor = isDark ? 'rgba(255,255,255,0.6)' : '#78716C'

  return (
    <div
      className="rounded-[2rem] overflow-hidden shadow-2xl mx-auto"
      style={{ width: 200, background: validator.bg }}
    >
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-16 h-4 rounded-full" style={{ background: isDark ? '#1E293B' : '#E2E8F0' }} />
      </div>

      <div className="px-4 pb-5 pt-2 flex flex-col items-center gap-3">
        {/* Badge */}
        <div
          className="text-[10px] font-bold px-3 py-1 rounded-full"
          style={{ background: `${validator.accent}20`, color: validator.accent, border: `1px solid ${validator.accent}40` }}
        >
          {validator.badge}
        </div>

        {/* QR */}
        <QRCodeSVG size={70} color={isDark ? validator.accent : validator.accent} />

        {/* Title */}
        <div className="text-center">
          <div className="text-sm font-black" style={{ color: textColor, fontFamily: 'Outfit, sans-serif' }}>
            {validator.title}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: subtextColor }}>
            {validator.subtitle}
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-2">
          {validator.btns.map((btn, i) => (
            <button
              key={i}
              className="w-full py-2 rounded-xl text-[11px] font-semibold transition-all hover:opacity-90"
              style={
                i === 0
                  ? { background: validator.accent, color: '#ffffff' }
                  : { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: textColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` }
              }
            >
              {btn.icon} {btn.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function LivePreview() {
  const [activeTab, setActiveTab] = useState(0)
  const [mobileView, setMobileView] = useState('dashboard')

  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Preview
          </div>
          <h2
            className="text-4xl lg:text-5xl font-black text-dark mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            אותה מערכת. חוויה אחרת.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Axess מתאימה את עצמה ל-DNA של העסק שלך — ב-0 מאמץ.
          </p>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className="relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  color: activeTab === i ? '#ffffff' : '#64748B',
                }}
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Split Screen */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Desktop: 2 columns */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 items-center">
              {/* Left — Dashboard */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold mb-4">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Dashboard בעל העסק
                </div>
                <DashboardPanel tab={TABS[activeTab]} />
              </div>

              {/* Right — Validator */}
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  חוויית הלקוח
                </div>
                <ValidatorPanel tab={TABS[activeTab]} />
              </div>
            </div>

            {/* Mobile: toggle + swipe */}
            <div className="md:hidden">
              {/* Toggle */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex bg-gray-100 rounded-full p-1">
                  {['dashboard', 'validator'].map(v => (
                    <button
                      key={v}
                      onClick={() => setMobileView(v)}
                      className="relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ color: mobileView === v ? '#ffffff' : '#64748B' }}
                    >
                      {mobileView === v && (
                        <motion.div layoutId="mobile-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                      )}
                      <span className="relative z-10">{v === 'dashboard' ? '🖥️ Dashboard' : '📱 לקוח'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {mobileView === 'dashboard' ? (
                  <motion.div key="dash" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <DashboardPanel tab={TABS[activeTab]} />
                  </motion.div>
                ) : (
                  <motion.div key="val" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="flex justify-center">
                    <ValidatorPanel tab={TABS[activeTab]} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dot indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {['dashboard', 'validator'].map(v => (
                  <div key={v} className={`w-2 h-2 rounded-full transition-all ${mobileView === v ? 'bg-primary w-4' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-gray-500 text-base mb-6 max-w-2xl mx-auto">
            אותה מערכת, חוויה אחרת. Axess מתאימה את עצמה ל-DNA של העסק שלך ב-0 מאמץ.
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-primary inline-flex items-center gap-2"
          >
            <MessageCircle size={18} />
            פתח חשבון עכשיו ←
          </a>
        </motion.div>
      </div>
    </section>
  )
}
