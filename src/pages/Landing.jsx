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
import Header from '@/components/Header'
import BusinessModal from '@/components/BusinessModal'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
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

/* ── Campaign Mock (card 2 alternating) ── */
function CampaignMock() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 2), 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: 'relative', height: 90, overflow: 'hidden' }}>
      {/* WA mock */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#075E54',
          borderRadius: 12,
          padding: 12,
          fontSize: 11,
          opacity: phase === 0 ? 1 : 0,
          transform: phase === 0 ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 8px', color: '#fff', marginBottom: 6, display: 'inline-block', maxWidth: '90%' }}>
          שלח הודעה: &quot;מבצע סוף שבוע...&quot;
        </div>
        <div style={{ background: '#dcf8c6', borderRadius: 8, padding: '5px 8px', color: '#075E54', display: 'inline-block', maxWidth: '90%', float: 'left' }}>
          ✓ הוגדר! 500 נמענים מוכנים
        </div>
      </div>
      {/* Dashboard mock */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--v2-dark-3)',
          borderRadius: 12,
          padding: 12,
          fontSize: 11,
          border: '1px solid rgba(255,255,255,0.07)',
          opacity: phase === 1 ? 1 : 0,
          transform: phase === 1 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <span style={{ color: 'var(--v2-gray-400)', fontSize: 10 }}>שם קמפיין</span>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--v2-gray-400)', fontSize: 10 }}>תאריך שליחה</span>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        </div>
        <div style={{ background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          שלח עכשיו ▶
        </div>
      </div>
    </div>
  )
}

/* ── Hero H1 Slider ── */
const HERO_SLIDES = [
  'מערכת שיווק חכמה לתוצאות מיידיות ברווחים',
  'ניהול קמפיינים ייחודיים להגברת מעורבות ושדרוג חווית לקוח',
  'נגישות מירבית לתפעול קל ונוח כולל שימוש בכלים מותאמים אישית',
]

function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % HERO_SLIDES.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const goTo = (idx) => {
    if (idx === current) return
    setVisible(false)
    setTimeout(() => {
      setCurrent(idx)
      setVisible(true)
    }, 400)
  }

  return (
    <div>
      <div
        style={{
          minHeight: 160,
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 'var(--text-hero)',
            lineHeight: 'var(--line-height-tight)',
            color: '#ffffff',
            marginBottom: 0,
            letterSpacing: '-0.02em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {HERO_SLIDES[current]}
        </h1>
      </div>
      {/* Dot indicators */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 24 }}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? 'var(--v2-primary)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Main Landing ── */
export default function Landing() {
  const [activeBiz, setActiveBiz] = useState(null)

  return (
    <div
      dir="rtl"
      style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#ffffff' }}
    >
      {/* ── HEADER ── */}
      <Header />

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'var(--v2-dark)',
        }}
      >
        {/* Scrolling grid */}
        <div
          className="hero-grid-bg"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            height: '200%',
          }}
        />

        {/* Radial green glow center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,195,122,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Orb 1 — green top-right */}
        <div
          className="animate-float-v2"
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'var(--v2-primary)',
            opacity: 0.10,
            filter: 'blur(120px)',
            zIndex: 1,
            pointerEvents: 'none',
            animationDelay: '0s',
          }}
        />
        {/* Orb 2 — purple bottom-right */}
        <div
          className="animate-float-v2"
          style={{
            position: 'absolute',
            bottom: '-5%',
            right: '-5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'var(--v2-accent)',
            opacity: 0.09,
            filter: 'blur(100px)',
            zIndex: 1,
            pointerEvents: 'none',
            animationDelay: '2s',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 1280,
            margin: '0 auto',
            padding: '80px 24px 60px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
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
                transition={{ delay: 0 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--v2-gray-400)',
                  marginBottom: 24,
                }}
              >
                <span style={{ color: 'var(--v2-primary)' }}>✦</span>
                פלטפורמת השיווק החכמה של ישראל
              </motion.div>

              {/* H1 Slider */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7 }}
              >
                <HeroSlider />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{
                  fontSize: 'var(--text-body-lg)',
                  color: 'var(--v2-gray-400)',
                  lineHeight: 'var(--line-height-body)',
                  maxWidth: 520,
                  marginBottom: 36,
                }}
              >
                שלח קמפיינים ממוקדים, עקוב אחר כל לחיצה,
                מדוד כל מימוש — הכל מתוך WhatsApp שלך.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}
              >
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-v2-primary"
                >
                  <MessageCircle size={18} />
                  פתח חשבון — חינם
                </a>
              </motion.div>

              {/* Trust pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
              >
                {[
                  'מספר וירטואלי',
                  'הודעות חוזרות',
                  'ניהול קמפיין ודאטה',
                  'חשיפה ומעורבות',
                  'שימוש בכלים חכמים',
                ].map(item => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--text-micro)',
                      color: 'var(--v2-gray-400)',
                    }}
                  >
                    <span style={{ color: 'var(--v2-primary)', fontWeight: 700 }}>✓</span>
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Phone Animation (UNTOUCHED) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ display: 'flex', justifyContent: 'center' }}
              id="demo"
            >
              <div
                className="animate-float-v2"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(0,195,122,0.18))',
                }}
              >
                <WhatsAppAnimation />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ROI NUMBERS — v2 card style ── */}
      <section
        style={{
          background: 'var(--v2-dark-2)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          padding: 'var(--space-12) 0',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {[
              {
                value: 201,
                suffix: ' תווים',
                label: 'במחיר הודעה אחת',
                sub: '201 תווים, חיוב אחד. שלח יותר בפחות.',
                svgPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 10h8 M8 13h5',
              },
              {
                value: 3,
                suffix: ' דקות',
                label: 'מקמפיין לשליחה',
                sub: 'אונבורדינג מהיר. ממשק ב-WhatsApp. ללא הדרכות.',
                svgPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
              },
              {
                value: 40,
                suffix: '%',
                prefix: 'עד ',
                label: 'אחוז מימוש ממוצע',
                sub: 'Validator ייחודי לכל לקוח. מדידה מדויקת.',
                svgPath: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6',
              },
            ].map(({ value, suffix, prefix, label, sub, svgPath }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="stat-card-v2"
              >
                {/* SVG icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--v2-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginBottom: 16 }}
                >
                  {svgPath.split(' M ').map((seg, si) => (
                    <path key={si} d={si === 0 ? seg : 'M ' + seg} />
                  ))}
                </svg>

                {/* Counter */}
                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', 'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: 'clamp(48px, 7vw, 72px)',
                    lineHeight: 1,
                    color: '#ffffff',
                    marginBottom: 8,
                    letterSpacing: '-0.03em',
                  }}
                >
                  <CounterNumber end={value} suffix={suffix} prefix={prefix || ''} />
                </div>

                <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', lineHeight: 1.6 }}>
                  {sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <Section
        id="how"
        style={{ background: 'var(--v2-dark-2)', padding: 'var(--space-12) 0' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0,195,122,0.10)',
                border: '1px solid rgba(0,195,122,0.20)',
                color: 'var(--v2-primary)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <Zap size={13} />
              פשוט להתחיל
            </div>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h2)',
                color: '#ffffff',
                marginBottom: 12,
                letterSpacing: '-0.02em',
              }}
            >
              פשוט. מהיר. רווחי.
            </h2>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, maxWidth: 480, margin: '0 auto' }}>
              שלושה שלבים פשוטים מהרשמה ועד קמפיין חי
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">

            {/* Card 1 — Upload list with table mock */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0, duration: 0.5 }}
              className="stat-card-v2"
              style={{ position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -14, right: 20, width: 32, height: 32, borderRadius: '50%', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-green)' }}>01</div>
              {/* Table mock */}
              <div style={{ background: 'rgba(8,12,20,0.6)', borderRadius: 8, padding: 12, fontSize: 11, border: '1px solid var(--glass-border)', marginBottom: 16, marginTop: 8 }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 6, background: 'rgba(0,195,122,0.18)', borderRadius: 4, padding: '4px 6px' }}>
                  <span style={{ color: 'var(--v2-primary)', fontWeight: 700 }}>שם</span>
                  <span style={{ color: 'var(--v2-primary)', fontWeight: 700 }}>טלפון</span>
                  <span style={{ color: 'var(--v2-primary)', fontWeight: 700 }}>עיר</span>
                </div>
                {[
                  ['יוסי כהן', '054-***', 'תל אביב'],
                  ['מיכל לוי', '052-***', 'חיפה'],
                  ['דני מור',  '050-***', 'ירושלים'],
                ].map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: '3px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {row.map((cell, ci) => (
                      <span key={ci} style={{ color: 'var(--v2-gray-400)' }}>{cell}</span>
                    ))}
                  </div>
                ))}
                <div style={{ padding: '4px 6px', color: 'rgba(148,163,184,0.5)', fontStyle: 'italic' }}>... ועוד 847 איש</div>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 8 }}>העלה רשימה</h3>
              <p style={{ color: 'var(--v2-gray-400)', lineHeight: 1.7, fontSize: 15 }}>CSV, Excel או הדבקה ישירה — המערכת מנרמלת הכל אוטומטית</p>
            </motion.div>

            {/* Card 2 — Campaign with alternating mock */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="stat-card-v2"
              style={{ position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -14, right: 20, width: 32, height: 32, borderRadius: '50%', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-green)' }}>02</div>
              <div style={{ marginBottom: 16, marginTop: 8 }}>
                <CampaignMock />
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 8 }}>הגדר קמפיין</h3>
              <p style={{ color: 'var(--v2-gray-400)', lineHeight: 1.7, fontSize: 15 }}>כתוב הודעה, בחר קהל, תזמן — הכל מתוך WhatsApp</p>
            </motion.div>

            {/* Card 3 — Results mock with progress bars */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="stat-card-v2"
              style={{ position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: -14, right: 20, width: 32, height: 32, borderRadius: '50%', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-green)' }}>03</div>
              <div style={{ background: 'rgba(8,12,20,0.6)', borderRadius: 8, padding: 12, fontSize: 11, border: '1px solid var(--glass-border)', marginBottom: 16, marginTop: 8 }}>
                {[
                  { label: 'נשלח',  val: 847, pct: 100 },
                  { label: 'נמסר',  val: 821, pct: 97 },
                  { label: 'הוקלק', val: 340, pct: 40 },
                  { label: 'מומש',  val: 187, pct: 22 },
                ].map(({ label, val, pct }) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: 'var(--v2-gray-400)' }}>{label}</span>
                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{val.toLocaleString('he-IL')} <span style={{ color: 'var(--v2-gray-400)' }}>{pct}%</span></span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--v2-primary)', borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10, color: 'var(--v2-primary)', fontWeight: 700, fontSize: 12 }}>
                  💰 הכנסה משוערת: ₪12,400
                </div>
              </div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 8 }}>מדוד תוצאות</h3>
              <p style={{ color: 'var(--v2-gray-400)', lineHeight: 1.7, fontSize: 15 }}>קבל דוח חי: נשלח / נמסר / הוקלק / מומש</p>
            </motion.div>

          </div>
        </div>
      </Section>

      {/* ── VALIDATOR (DIFFERENTIATOR) ── */}
      <Section style={{ background: 'var(--v2-dark-3)', padding: 'var(--space-12) 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: 'var(--v2-accent)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                <QrCode size={13} />
                למה AXESS?
              </div>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 'var(--text-h2)',
                  color: '#ffffff',
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                הכרטיס הדיגיטלי החדש
              </h2>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, marginBottom: 28, lineHeight: 1.7 }}>
                כל לקוח מקבל כרטיס/קופון ייחודי שמגיע ב-SMS.
                לוחץ → רואה → ממש → נרשם בדאטהבייס שלך.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'כרטיס כניסה לאירוע',
                  'קופון הנחה לחנות',
                  'הטבה למסעדה',
                  'אישור הזמנה למלון',
                  'כל עסק — כל שימוש',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(0,195,122,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle size={14} style={{ color: 'var(--v2-primary)' }} />
                    </div>
                    <span style={{ color: '#ffffff', fontWeight: 500, fontSize: 15 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validator Animation — UNTOUCHED */}
            <div className="flex justify-center">
              <ValidatorAnimation />
            </div>
          </div>
        </div>
      </Section>

      {/* ── USE CASES — v2 dark ── */}
      <section
        id="usecases"
        style={{
          background: 'var(--v2-dark)',
          padding: 'var(--space-12) 0',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h2)',
                color: '#ffffff',
                marginBottom: 12,
                letterSpacing: '-0.02em',
              }}
            >
              לכל עסק — פתרון מדויק
            </h2>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 'var(--text-body)' }}>
              לחץ על סוג העסק שלך לראות איך AXESS עובד עבורך
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { Icon: Music,       name: 'אירועים',    use: 'כרטיסי כניסה דיגיטליים',      bizKey: 'events' },
              { Icon: Hotel,       name: 'מלונות',     use: 'אישורי הזמנה + Upsell',        bizKey: 'hotels' },
              { Icon: Utensils,    name: 'מסעדות',     use: 'קופוני ארוחה ללקוחות חוזרים', bizKey: 'restaurants' },
              { Icon: ShoppingBag, name: 'חנויות',     use: 'מבצעים ממוקדים לפי רכישות',   bizKey: 'stores' },
              { Icon: Dumbbell,    name: 'חדרי כושר',  use: 'כרטיסיות וחידוש מנוי',         bizKey: 'gyms' },
              { Icon: Building2,   name: 'ארגונים',    use: 'תקשורת ממוקדת לחברים',         bizKey: 'orgs' },
            ].map(({ Icon, name, use, bizKey }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="biz-card-v2"
                onClick={() => setActiveBiz(bizKey)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setActiveBiz(bizKey)}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(0,195,122,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--v2-primary)' }} strokeWidth={1.5} />
                </div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 15, marginBottom: 6 }}>
                  {name}
                </div>
                <div style={{ color: 'var(--v2-gray-400)', fontSize: 13, lineHeight: 1.5 }}>
                  {use}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: 'var(--v2-primary)',
                    fontWeight: 600,
                  }}
                >
                  ← פרטים נוספים
                </div>
              </motion.div>
            ))}
          </div>

          {/* See all link */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a
              href="/industries"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--v2-primary)',
                fontSize: 'var(--text-body)',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--v2-primary)',
                borderRadius: 'var(--radius-full)',
                padding: '12px 28px',
                transition: '200ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,195,122,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              מעבר לכל סוגי העסקים ←
            </a>
          </div>
        </div>
      </section>

      {/* ── BUSINESS MODAL ── */}
      <BusinessModal bizKey={activeBiz} onClose={() => setActiveBiz(null)} />

      {/* ── LIVE PREVIEW ── */}
      <LivePreview />

      {/* ── ROI SECTION ── */}
      <ROISection />

      {/* ── SMART INSIGHTS ── */}
      <SmartInsights />

      {/* ── PRICING ── */}
      <section
        id="pricing"
        style={{ background: 'var(--v2-dark-2)', padding: 'var(--space-12) 0' }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0,195,122,0.10)',
                border: '1px solid rgba(0,195,122,0.20)',
                color: 'var(--v2-primary)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <TrendingUp size={13} />
              תמחור שקוף
            </div>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h2)',
                color: '#ffffff',
                marginBottom: 12,
                letterSpacing: '-0.02em',
              }}
            >
              תשלום רק על מה ששלחת
            </h2>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 18 }}>
              קרדיטים לא פגים. אין חוזים. אין דמי מנוי.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {[
              { name: 'Basic',      price: '8', unit: 'אג׳ להודעה', range: 'עד 10,000 הודעות',         featured: false },
              { name: 'Business',   price: '7', unit: 'אג׳ להודעה', range: '10,001–50,000 הודעות',      featured: true  },
              { name: 'Premium',    price: '6', unit: 'אג׳ להודעה', range: '50,001–200,000 הודעות',     featured: false },
              { name: 'Enterprise', price: '5', unit: 'אג׳ להודעה', range: '200,001+ הודעות',           featured: false },
            ].map(({ name, price, unit, range, featured }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: featured ? 'var(--v2-primary)' : 'var(--v2-dark-3)',
                  border: featured ? 'none' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: featured ? 'var(--shadow-glow-green)' : 'none',
                }}
              >
                {featured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--v2-dark)',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    הכי פופולרי
                  </div>
                )}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 16,
                    color: featured ? 'rgba(8,12,20,0.75)' : 'var(--v2-gray-400)',
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', monospace",
                    fontWeight: 800,
                    fontSize: 52,
                    lineHeight: 1,
                    color: featured ? 'var(--v2-dark)' : '#ffffff',
                    marginBottom: 4,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {price}
                </div>
                <div style={{ fontSize: 13, color: featured ? 'rgba(8,12,20,0.7)' : 'var(--v2-gray-400)', marginBottom: 4 }}>
                  {unit}
                </div>
                <div style={{ fontSize: 12, color: featured ? 'rgba(8,12,20,0.55)' : 'var(--v2-gray-400)', marginBottom: 24 }}>
                  {range}
                </div>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                    background: featured ? 'rgba(8,12,20,0.15)' : 'var(--v2-primary)',
                    color: featured ? 'var(--v2-dark)' : 'var(--v2-dark)',
                  }}
                >
                  התחל עכשיו
                </a>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--v2-gray-400)', fontSize: 14 }}>
            מינימום רכישה: 1,500 הודעות • ללא עמלת הצטרפות • תמיכה בעברית
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: 'var(--v2-dark)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(0,195,122,0.12) 0%, rgba(99,102,241,0.10) 100%)',
              border: '1px solid rgba(0,195,122,0.20)',
              padding: 'var(--space-12)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'var(--v2-primary)',
                opacity: 0.06,
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />
            {/* Content wrapper — max 640px centered */}
            <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 'var(--text-h1)',
                  color: '#ffffff',
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                מוכן להכפיל את ההכנסות שלך?
              </h2>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, marginBottom: 32 }}>
                הצטרף לאלפי עסקים שכבר שולחים עם AXESS
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-v2-primary"
                style={{
                  fontSize: 17,
                  padding: '16px 40px',
                  display: 'inline-flex',
                  width: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <MessageCircle size={20} />
                פתח חשבון עכשיו
              </a>
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 24,
                  color: 'var(--v2-gray-400)',
                  fontSize: 13,
                }}
              >
                <span>✓ מינימום 1,500 הודעות</span>
                <span>✓ ללא עמלת הצטרפות</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: 'var(--v2-dark-2)',
          borderTop: '1px solid var(--glass-border)',
          padding: 'var(--space-12) 0 var(--space-8)',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 40,
              marginBottom: 48,
            }}
          >
            {/* Brand — QR Logo */}
            <div>
              <div style={{ marginBottom: 14 }}>
                {/* QR Logo (same as Header) */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 32, height: 32 }}>
                    <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                      <rect x="1" y="1" width="34" height="34" rx="6" stroke="var(--v2-primary)" strokeWidth="1.5" fill="#161E2E" />
                      <rect x="5" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
                      <rect x="7" y="7" width="6" height="6" rx="1" fill="#161E2E" />
                      <rect x="9" y="9" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="21" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
                      <rect x="23" y="7" width="6" height="6" rx="1" fill="#161E2E" />
                      <rect x="25" y="9" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="5" y="21" width="10" height="10" rx="2" fill="var(--v2-primary)" />
                      <rect x="7" y="23" width="6" height="6" rx="1" fill="#161E2E" />
                      <rect x="9" y="25" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="17" y="5" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="17" y="9" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="21" y="17" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="25" y="17" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="17" y="21" width="2" height="2" fill="var(--v2-primary)" />
                      <rect x="25" y="25" width="2" height="2" fill="var(--v2-primary)" />
                    </svg>
                    <div
                      className="animate-pulse-green"
                      style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: 'var(--v2-primary)', borderRadius: '50%', border: '2px solid #080C14' }}
                    />
                  </div>
                  <span style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: '#ffffff', letterSpacing: '-0.5px' }}>
                    AXESS
                  </span>
                </div>
              </div>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.7 }}>
                פלטפורמת SMS Marketing המובילה בישראל. שלח, מדוד, צמח.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 16, color: '#ffffff', fontSize: 15 }}>מוצר</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'תכונות', href: '/features' },
                  { label: 'תמחור', href: '/pricing' },
                  { label: 'Validator', href: '/#validator' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      style={{ color: 'var(--v2-gray-400)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.target.style.color = '#ffffff')}
                      onMouseLeave={e => (e.target.style.color = 'var(--v2-gray-400)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 16, color: '#ffffff', fontSize: 15 }}>סוגי עסקים</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'אירועים',   href: '/industries/events' },
                  { label: 'מלונות',    href: '/industries/hotels' },
                  { label: 'מסעדות',    href: '/industries/restaurants' },
                  { label: 'חנויות',    href: '/industries/retail' },
                  { label: 'חדרי כושר', href: '/industries/gyms' },
                  { label: 'ארגונים',   href: '/industries/organizations' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      style={{ color: 'var(--v2-gray-400)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.target.style.color = '#ffffff')}
                      onMouseLeave={e => (e.target.style.color = 'var(--v2-gray-400)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 16, color: '#ffffff', fontSize: 15 }}>חברה</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'עלינו', href: '/about' },
                  { label: 'תנאי שימוש', href: '/terms' },
                  { label: 'מדיניות פרטיות', href: '/privacy' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      style={{ color: 'var(--v2-gray-400)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.target.style.color = '#ffffff')}
                      onMouseLeave={e => (e.target.style.color = 'var(--v2-gray-400)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: 24,
              textAlign: 'center',
              color: 'var(--v2-gray-400)',
              fontSize: 13,
            }}
          >
            © 2026 AXESS. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  )
}
