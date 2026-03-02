import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'

export default function IndustryPage({
  name,
  slug,
  icon: Icon,
  heroTitle,
  heroSubtitle,
  heroGradient,
  features = [],
  roiStats = [],
  validatorTitle = 'מה הלקוח שלך יראה',
  validatorDesc = 'כרטיס דיגיטלי ייחודי שמגיע ב-SMS — לוחץ, רואה, ממש.',
  accentColor = 'var(--v2-primary)',
}) {
  const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent(`שלום AXESS, אני עסק מסוג ${name} ואני רוצה להצטרף`)}`

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#ffffff' }}>
      <Header />

      {/* ── HERO ── */}
      <section
        style={{
          background: heroGradient || `linear-gradient(135deg, var(--v2-dark) 0%, var(--v2-dark-3) 100%)`,
          padding: 'var(--space-16) 0 var(--space-12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            background: accentColor,
            opacity: 0.08,
            borderRadius: '50%',
            filter: 'blur(120px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
          {/* Icon badge */}
          {Icon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(0,195,122,0.12)',
                border: '1px solid rgba(0,195,122,0.25)',
                marginBottom: 24,
              }}
            >
              <Icon size={36} style={{ color: accentColor }} strokeWidth={1.5} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: 13,
              color: 'var(--v2-gray-400)',
              marginBottom: 20,
            }}
          >
            <span style={{ color: accentColor }}>✦</span>
            AXESS עבור {name}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            style={{
              fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 56px)',
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: 20,
            }}
          >
            {heroTitle}
          </motion.h1>

          {heroSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontSize: 18,
                color: 'var(--v2-gray-400)',
                lineHeight: 1.75,
                maxWidth: 600,
                margin: '0 auto 32px',
              }}
            >
              {heroSubtitle}
            </motion.p>
          )}

          <motion.a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="btn-v2-primary"
            style={{ fontSize: 16, padding: '14px 36px' }}
          >
            <MessageCircle size={18} />
            התחל עם {name} — חינם
          </motion.a>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ background: 'var(--v2-dark-2)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(26px, 4vw, 40px)',
                color: '#ffffff',
                marginBottom: 12,
              }}
            >
              מה מקבלים עם AXESS
            </h2>
            <p style={{ fontSize: 16, color: 'var(--v2-gray-400)' }}>
              כלים חכמים שמותאמים בדיוק ל{name}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {features.map((feature, i) => {
              const FIcon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: 'var(--v2-dark-3)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--v2-primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {FIcon && (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(0,195,122,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <FIcon size={22} style={{ color: accentColor }} strokeWidth={1.5} />
                    </div>
                  )}
                  <h3
                    style={{
                      fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: '#ffffff',
                      marginBottom: 8,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--v2-gray-400)', lineHeight: 1.7 }}>
                    {feature.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── VALIDATOR DEMO ── */}
      <section style={{ background: 'var(--v2-dark-3)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 16px',
                  fontSize: 13,
                  color: 'var(--v2-gray-400)',
                  marginBottom: 20,
                }}
              >
                <span style={{ color: 'var(--v2-primary)' }}>◈</span>
                {validatorTitle}
              </div>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  color: '#ffffff',
                  marginBottom: 16,
                  lineHeight: 1.2,
                }}
              >
                הכרטיס הדיגיטלי של {name}
              </h2>
              <p style={{ fontSize: 16, color: 'var(--v2-gray-400)', lineHeight: 1.75, marginBottom: 24 }}>
                {validatorDesc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'לחיצה אחת — מימוש מיידי',
                  'QR ייחודי לכל לקוח',
                  'מעקב מדויק בדשבורד',
                  'תוקף מוגדר מראש',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={16} style={{ color: 'var(--v2-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 15, color: '#ffffff' }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Phone mock */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <ValidatorPhoneMock name={name} accentColor={accentColor} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ROI STATS ── */}
      {roiStats.length > 0 && (
        <section style={{ background: 'var(--v2-dark-2)', padding: 'var(--space-12) 0' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(24px, 3.5vw, 40px)',
                  color: '#ffffff',
                  marginBottom: 12,
                }}
              >
                תוצאות אמיתיות
              </h2>
              <p style={{ fontSize: 16, color: 'var(--v2-gray-400)' }}>
                מספרים מ{name} שעובדים עם AXESS
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
              }}
            >
              {roiStats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: 'var(--v2-dark-3)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px 24px',
                    textAlign: 'center',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--v2-primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Bricolage Grotesque', monospace",
                      fontWeight: 800,
                      fontSize: 'clamp(36px, 5vw, 52px)',
                      color: 'var(--v2-primary)',
                      lineHeight: 1,
                      marginBottom: 10,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', marginBottom: 6 }}>
                    {stat.label}
                  </div>
                  {stat.sub && (
                    <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{stat.sub}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{ background: 'var(--v2-dark)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, rgba(0,195,122,0.08) 0%, rgba(99,102,241,0.06) 100%)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '48px 32px',
            }}
          >
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                color: '#ffffff',
                marginBottom: 14,
              }}
            >
              מוכן להתחיל?
            </h2>
            <p style={{ fontSize: 16, color: 'var(--v2-gray-400)', marginBottom: 28, lineHeight: 1.7 }}>
              הצטרף לעסקי {name} שכבר שולחים עם AXESS ורואים תוצאות
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-v2-primary"
              style={{ fontSize: 16, padding: '14px 36px' }}
            >
              <MessageCircle size={18} />
              פתח חשבון — חינם
            </a>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--v2-gray-400)' }}>
              <span>✓ ללא עמלת הצטרפות</span>
              <span>✓ קרדיטים לא פגים</span>
              <span>✓ תמיכה בעברית</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

/* ── Validator Phone Mock ── */
function ValidatorPhoneMock({ name, accentColor }) {
  return (
    <div
      style={{
        width: 260,
        background: '#0F172A',
        borderRadius: 32,
        padding: 12,
        border: '3px solid #1e293b',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}
    >
      {/* Phone notch */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 9999 }} />
      </div>

      {/* Screen */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 22,
          overflow: 'hidden',
          minHeight: 380,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: accentColor || '#00C37A',
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>AXESS Validator</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{name}</div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px' }}>
          {/* QR placeholder */}
          <div
            style={{
              width: 120,
              height: 120,
              margin: '0 auto 16px',
              background: '#F8FAFC',
              border: '2px solid #E2E8F0',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="4" y="4" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="2" fill="none" />
              <rect x="10" y="10" width="18" height="18" rx="2" fill="#0F172A" />
              <rect x="46" y="4" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="2" fill="none" />
              <rect x="52" y="10" width="18" height="18" rx="2" fill="#0F172A" />
              <rect x="4" y="46" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="2" fill="none" />
              <rect x="10" y="52" width="18" height="18" rx="2" fill="#0F172A" />
              <rect x="46" y="46" width="8" height="8" rx="1" fill="#0F172A" />
              <rect x="58" y="46" width="8" height="8" rx="1" fill="#0F172A" />
              <rect x="46" y="58" width="8" height="8" rx="1" fill="#0F172A" />
              <rect x="58" y="58" width="18" height="8" rx="1" fill="#0F172A" />
            </svg>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
              הטבה ייחודית
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              סרוק לקבלת ההטבה
            </div>
          </div>

          {/* Redeem button */}
          <button
            style={{
              width: '100%',
              padding: '12px',
              background: accentColor || '#00C37A',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✓ מימוש הטבה
          </button>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
            תוקף: 31/03/2026
          </div>
        </div>
      </div>
    </div>
  )
}
