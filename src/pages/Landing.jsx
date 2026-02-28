import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useAnimation } from 'framer-motion'
import {
  MessageCircle, BarChart3, Upload, CheckCircle, ArrowLeft,
  Menu, X, Star, Zap, Shield, Clock, TrendingUp, Users,
  QrCode, ChevronDown, ExternalLink,
  Utensils, Music, Hotel, ShoppingBag, Dumbbell, Building2
} from 'lucide-react'
import LivePreview from '@/components/LivePreview'
import ROISection from '@/components/ROISection'
import SmartInsights from '@/components/SmartInsights'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972500000000'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

/* ── Scroll Reveal Hook ── */
function useScrollReveal() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, isInView }
}

/* ── Counter Animation ── */
function CounterNumber({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const { ref, isInView } = useScrollReveal()

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, step)
    return () => clearInterval(timer)
  }, [isInView, end])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('he-IL')}{suffix}
    </span>
  )
}

/* ── WhatsApp Animation ── */
function WhatsAppAnimation() {
  const messages = [
    { type: 'bot', text: 'ברוך הבא ל-AXESS 👋 מה שם העסק שלך?', delay: 0 },
    { type: 'user', text: 'קפה רוטשילד', delay: 1500 },
    { type: 'typing', delay: 2800 },
    { type: 'bot', text: 'מעולה! 🎉 הקמפיין הראשון שלך מוכן לשליחה', delay: 3200 },
    { type: 'sms', delay: 4800 },
  ]

  const [visible, setVisible] = useState([])
  const [showTyping, setShowTyping] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    setVisible([])
    setShowTyping(false)
    const timers = []

    timers.push(setTimeout(() => setVisible(v => [...v, 0]), 300))
    timers.push(setTimeout(() => setVisible(v => [...v, 1]), 1800))
    timers.push(setTimeout(() => setShowTyping(true), 3100))
    timers.push(setTimeout(() => { setShowTyping(false); setVisible(v => [...v, 3]) }, 3500))
    timers.push(setTimeout(() => setVisible(v => [...v, 4]), 5100))

    const reset = setTimeout(() => {
      timers.forEach(clearTimeout)
      setCycle(c => c + 1)
    }, 9000)
    timers.push(reset)

    return () => timers.forEach(clearTimeout)
  }, [cycle])

  return (
    <div className="phone-frame w-[260px] mx-auto animate-float">
      {/* Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-dark rounded-full z-10" />

      <div className="phone-screen" style={{ minHeight: 480 }}>
        {/* WA Header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 pt-8">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold">AXESS Bot</div>
            <div className="text-white/70 text-xs">מקוון</div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-3 flex flex-col gap-2 overflow-hidden" style={{ minHeight: 380 }}>
          {visible.includes(0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="self-start"
            >
              <div className="wa-bubble-bot text-xs">{messages[0].text}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 mr-1">09:41 ✓✓</div>
            </motion.div>
          )}

          {visible.includes(1) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="self-end"
            >
              <div className="wa-bubble-user text-xs">{messages[1].text}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 ml-1 text-left">09:41 ✓✓</div>
            </motion.div>
          )}

          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="self-start"
            >
              <div className="wa-bubble-bot flex gap-1 items-center px-3 py-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
              </div>
            </motion.div>
          )}

          {visible.includes(3) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="self-start"
            >
              <div className="wa-bubble-bot text-xs">{messages[3].text}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 mr-1">09:42 ✓✓</div>
            </motion.div>
          )}

          {visible.includes(4) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="self-start w-full"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-xs">
                <div className="text-[10px] text-gray-500 mb-1 font-medium">📱 SMS Preview</div>
                <div className="text-dark text-[11px] leading-relaxed">
                  שלום דני, קפה רוטשילד מזמינים אותך לארוחת בוקר מיוחדת! הצג הודעה זו לקבלת 20% הנחה 🎁
                </div>
                <div className="mt-2 bg-primary text-white text-center text-[10px] py-1 rounded-lg font-semibold">
                  לחץ לממש
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Validator Animation ── */
function ValidatorAnimation() {
  const [phase, setPhase] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 1600)
    const t3 = setTimeout(() => setPhase(3), 2200)
    const t4 = setTimeout(() => setPhase(4), 2700)
    const reset = setTimeout(() => setCycle(c => c + 1), 7000)
    return () => [t1, t2, t3, t4, reset].forEach(clearTimeout)
  }, [cycle])

  return (
    <div className="phone-frame w-[220px] mx-auto">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-dark rounded-full z-10" />
      <div className="bg-white rounded-[2rem] overflow-hidden" style={{ minHeight: 420 }}>
        {/* Validator screen */}
        <div
          className="flex flex-col items-center justify-center h-full p-5 transition-all duration-500"
          style={{ minHeight: 420, background: phase >= 3 ? '#10B981' : 'white' }}
        >
          {phase < 3 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl font-black text-primary">K</span>
              </div>
              <div className="text-dark font-bold text-sm mb-1">קפה רוטשילד</div>
              <div className="text-gray-500 text-xs mb-1">הנחה 20% לארוחת בוקר</div>
              <div className="text-gray-400 text-xs mb-4">תוקף: 31.03.2026</div>

              <div className="w-full bg-gray-100 rounded-xl p-3 mb-4 text-center">
                <div className="text-xs text-gray-500 mb-1">קוד קופון</div>
                <div className="text-lg font-black text-dark tracking-widest">AX-2847</div>
              </div>

              <motion.button
                className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm relative overflow-hidden"
                animate={phase === 2 ? { scale: [1, 0.95, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {phase === 2 && (
                  <motion.div
                    className="absolute inset-0 bg-white/30 rounded-xl"
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                מימוש קופון
              </motion.button>

              {phase === 1 && (
                <motion.div
                  className="absolute bottom-24 right-8 text-2xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                >
                  👆
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-6xl"
              >
                ✅
              </motion.div>
              {phase >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-white font-black text-lg">אושר בהצלחה!</div>
                  <div className="text-white/80 text-xs mt-1">הקופון מומש בהצלחה</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Section Wrapper ── */
function Section({ children, className = '', id = '' }) {
  const { ref, isInView } = useScrollReveal()
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/* ── Main Landing ── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
              <span className="text-base font-black text-white">A</span>
            </div>
            <span className="text-xl font-black text-dark" style={{ fontFamily: 'Outfit, sans-serif' }}>
              AXESS
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'מוצר', href: '#how' },
              { label: 'תמחור', href: '#pricing' },
              { label: 'דוגמאות', href: '#usecases' },
              { label: 'כניסה', href: '/login' },
            ].map(({ label, href }) => (
              href.startsWith('/') ? (
                <Link key={label} to={href} className="text-gray-500 hover:text-dark font-medium text-sm transition-colors">
                  {label}
                </Link>
              ) : (
                <a key={label} href={href} className="text-gray-500 hover:text-dark font-medium text-sm transition-colors">
                  {label}
                </a>
              )
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-gray-500 hover:text-dark font-medium text-sm transition-colors">
              כניסה
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-landing-primary text-sm px-5 py-2.5">
              התחל בחינם
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} className="text-dark" /> : <Menu size={22} className="text-dark" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3"
          >
            {['מוצר', 'תמחור', 'דוגמאות'].map(item => (
              <a key={item} href={`#${item}`} className="text-gray-600 font-medium py-2 border-b border-gray-50">
                {item}
              </a>
            ))}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="btn-landing-primary text-center mt-2">
              התחל בחינם
            </a>
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-grid pt-20" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0FDF4 100%)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                פלטפורמת SMS Marketing #1 בישראל 🇮🇱
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-5xl lg:text-6xl xl:text-7xl font-black text-dark leading-tight mb-6"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                שווק חכם.
                <br />
                <span className="text-gradient-primary">מדוד תוצאות.</span>
                <br />
                צמח מהר.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed"
              >
                שלח קמפיינים ממוקדים, עקוב אחר כל לחיצה, מדוד כל מימוש — הכל מתוך WhatsApp שלך
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-landing-primary text-base px-8 py-3.5 gap-2"
                >
                  <MessageCircle size={20} />
                  התחל בחינם
                </a>
                <a
                  href="#demo"
                  className="btn-landing-secondary text-base px-8 py-3.5"
                >
                  צפה בהדגמה
                  <ChevronDown size={18} />
                </a>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                {['ללא עמלת הצטרפות', 'קרדיטים לא פגים', 'תמיכה בעברית'].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckCircle size={15} className="text-accent" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Phone Animation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex justify-center lg:justify-start"
              id="demo"
            >
              <WhatsAppAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ROI NUMBERS ── */}
      <Section className="bg-primary py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: 201, suffix: ' תווים', label: 'במחיר הודעה אחת', icon: '📝' },
              { value: 3, suffix: ' דקות', label: 'מקמפיין לשליחה', icon: '⚡' },
              { value: 40, suffix: '%', label: 'אחוז מימוש ממוצע', prefix: 'עד ', icon: '🎯' },
            ].map(({ value, suffix, label, icon, prefix }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-white"
              >
                <div className="text-4xl mb-2">{icon}</div>
                <div className="text-5xl lg:text-6xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <CounterNumber end={value} suffix={suffix} prefix={prefix} />
                </div>
                <div className="text-white/70 text-lg">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Zap size={14} />
              פשוט להתחיל
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-dark mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              פשוט. מהיר. רווחי.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              שלושה שלבים פשוטים מהרשמה ועד קמפיין חי
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
            {/* Connecting arrows (desktop) */}
            <div className="hidden md:block absolute top-12 right-[calc(33%+24px)] left-[calc(33%+24px)] h-0.5 bg-gradient-to-l from-primary/30 to-primary/30 via-primary/60" />

            {[
              {
                step: '01',
                icon: '📋',
                title: 'העלה רשימה',
                desc: 'CSV, Excel או הדבקה ישירה — המערכת מנרמלת הכל אוטומטית',
                color: 'bg-blue-50 border-blue-100',
                iconBg: 'bg-primary/10',
              },
              {
                step: '02',
                icon: '✍️',
                title: 'הגדר קמפיין',
                desc: 'כתוב הודעה, בחר קהל, תזמן — הכל מתוך WhatsApp',
                color: 'bg-purple-50 border-purple-100',
                iconBg: 'bg-purple-100',
              },
              {
                step: '03',
                icon: '📊',
                title: 'מדוד תוצאות',
                desc: 'קבל דוח חי: נשלח / נמסר / הוקלק / מומש',
                color: 'bg-green-50 border-green-100',
                iconBg: 'bg-accent/10',
              },
            ].map(({ step, icon, title, desc, color, iconBg }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`landing-card border-2 ${color} relative`}
              >
                <div className="absolute -top-4 right-6 w-8 h-8 rounded-full bg-primary text-white text-sm font-black flex items-center justify-center shadow-glow-primary">
                  {step}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-3xl mb-4 mt-2`}>
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── VALIDATOR (DIFFERENTIATOR) ── */}
      <Section className="py-20 lg:py-28 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
                <QrCode size={14} />
                הבידול שלנו
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-dark mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                הכרטיס הדיגיטלי החדש
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                כל לקוח מקבל כרטיס/קופון ייחודי שמגיע ב-SMS.
                לוחץ → רואה → ממש → נרשם בדאטהבייס שלך.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  'כרטיס כניסה לאירוע',
                  'קופון הנחה לחנות',
                  'הטבה למסעדה',
                  'אישור הזמנה למלון',
                  'כל עסק — כל שימוש',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-accent" />
                    </div>
                    <span className="text-dark font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validator Animation */}
            <div className="flex justify-center">
              <ValidatorAnimation />
            </div>
          </div>
        </div>
      </Section>

      {/* ── USE CASES ── */}
      <Section id="usecases" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black text-dark mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              מתאים לכל עסק
            </h2>
            <p className="text-gray-500 text-lg">מסעדות, אירועים, מלונות ועוד</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { Icon: Utensils,   name: 'מסעדות',     use: 'קופוני ארוחה ללקוחות חוזרים' },
              { Icon: Music,      name: 'אירועים',    use: 'כרטיסי כניסה דיגיטליים' },
              { Icon: Hotel,      name: 'מלונות',     use: 'אישורי הזמנה + הטבות' },
              { Icon: ShoppingBag,name: 'חנויות',     use: 'מבצעים ממוקדים לפי רכישות' },
              { Icon: Dumbbell,   name: 'חדרי כושר',  use: 'כרטיסיות וחידוש מנוי' },
              { Icon: Building2,  name: 'ארגונים',    use: 'תקשורת ממוקדת לחברים' },
            ].map(({ Icon, name, use }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-white rounded-2xl p-8 text-center cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                whileHover={{ borderColor: '#2563EB', boxShadow: '0 4px 20px rgba(37,99,235,0.10)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/12 transition-colors"
                  style={{ background: 'rgba(37,99,235,0.07)' }}>
                  <Icon size={22} className="text-primary" strokeWidth={1.5} />
                </div>
                <div className="font-bold text-dark text-sm mb-1.5">{name}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{use}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── LIVE PREVIEW ── */}
      <LivePreview />

      {/* ── ROI SECTION ── */}
      <ROISection />

      {/* ── SMART INSIGHTS ── */}
      <SmartInsights />

      {/* ── PRICING ── */}
      <Section id="pricing" className="py-20 lg:py-28 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <TrendingUp size={14} />
              תמחור שקוף
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-dark mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              תשלום רק על מה ששלחת
            </h2>
            <p className="text-gray-500 text-lg">
              קרדיטים לא פגים. אין חוזים. אין דמי מנוי.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Basic', price: '8', unit: 'אג׳ להודעה', range: 'עד 10,000 הודעות', featured: false },
              { name: 'Business', price: '7', unit: 'אג׳ להודעה', range: '10,001–50,000 הודעות', featured: true },
              { name: 'Premium', price: '6', unit: 'אג׳ להודעה', range: '50,001–200,000 הודעות', featured: false },
              { name: 'Enterprise', price: '5', unit: 'אג׳ להודעה', range: '200,001+ הודעות', featured: false },
            ].map(({ name, price, unit, range, featured }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={featured ? 'pricing-card-featured' : 'pricing-card'}
              >
                {featured && (
                  <div className="absolute top-4 left-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                    הכי פופולרי
                  </div>
                )}
                <div className={`text-sm font-semibold mb-4 ${featured ? 'text-white/80' : 'text-gray-500'}`}>
                  {name}
                </div>
                <div className={`text-5xl font-black mb-1 ${featured ? 'text-white' : 'text-dark'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {price}
                </div>
                <div className={`text-sm mb-2 ${featured ? 'text-white/80' : 'text-gray-500'}`}>{unit}</div>
                <div className={`text-xs mb-6 ${featured ? 'text-white/60' : 'text-gray-400'}`}>{range}</div>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    featured
                      ? 'bg-white text-primary hover:bg-primary-light'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  התחל עכשיו
                </a>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 text-gray-500 text-sm">
            מינימום רכישה: 1,500 הודעות • ללא עמלת הצטרפות • תמיכה בעברית
          </div>
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-bl from-[#1E40AF] to-[#2563EB] p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                מוכן להכפיל את ההכנסות שלך?
              </h2>
              <p className="text-white/70 text-lg mb-8">
                הצטרף לאלפי עסקים שכבר שולחים עם AXESS
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-primary font-bold text-lg px-10 py-4 rounded-xl hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                <MessageCircle size={22} />
                פתח חשבון עכשיו
              </a>
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-white/60 text-sm">
                <span>✓ מינימום 1,500 הודעות</span>
                <span>✓ ללא עמלת הצטרפות</span>
                <span>✓ תמיכה בעברית</span>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-base font-black text-white">A</span>
                </div>
                <span className="text-xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>AXESS</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                פלטפורמת SMS Marketing המובילה בישראל. שלח, מדוד, צמח.
              </p>
              <div className="flex gap-3">
                {['📱', '💬', '📧'].map((icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-sm">
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4 text-white">מוצר</h4>
              <ul className="space-y-2.5">
                {['תכונות', 'תמחור', 'API', 'Validator'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4 text-white">משפטי</h4>
              <ul className="space-y-2.5">
                <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">תנאי שימוש</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">מדיניות פרטיות</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
            © 2026 AXESS. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  )
}
