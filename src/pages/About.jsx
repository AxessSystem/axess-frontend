import { motion } from 'framer-motion'
import Header from '@/components/Header'
import { Link } from 'react-router-dom'
import { Users, Zap, Shield, TrendingUp, MessageCircle } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const TEAM = [
  { name: 'ארז', role: 'מייסד ומנכ"ל', emoji: '👨‍💼' },
  { name: 'צוות פיתוח', role: 'Full-Stack Engineers', emoji: '👨‍💻' },
  { name: 'צוות שיווק', role: 'Growth & Marketing', emoji: '📈' },
]

const VALUES = [
  {
    icon: Zap,
    title: 'פשטות מעל הכל',
    desc: 'כל תכונה חייבת להיות ניתנת להפעלה תוך 3 דקות. אם לא — אנחנו מפשטים אותה.',
  },
  {
    icon: Shield,
    title: 'שקיפות מלאה',
    desc: 'אין עמלות נסתרות. אין חוזים. אין הפתעות. תשלום רק על מה ששלחת.',
  },
  {
    icon: TrendingUp,
    title: 'תוצאות מדידות',
    desc: 'כל שקל שמושקע בפלטפורמה חייב להחזיר יותר. אנחנו מודדים, מוכיחים, משפרים.',
  },
  {
    icon: Users,
    title: 'לקוח במרכז',
    desc: 'כל החלטה מתחילה בשאלה: "האם זה עוזר לעסק של הלקוח לצמוח?"',
  },
]

const TIMELINE = [
  { year: '2023', event: 'AXESS נוסדת בתל אביב עם חזון אחד: שיווק SMS שעובד.' },
  { year: '2024', event: 'השקת Validator — הכרטיס הדיגיטלי שמשנה את חוקי המשחק.' },
  { year: '2025', event: 'חצינו 500 עסקים פעילים ו-10 מיליון הודעות שנשלחו.' },
  { year: '2026', event: 'השקת פלטפורמה מלאה עם Dashboard, Audiences, ו-Text Lead.' },
]

export default function About() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#ffffff' }}>
      <Header />

      {/* Hero */}
      <section
        style={{
          padding: 'var(--space-16) 0 var(--space-12)',
          background: 'var(--v2-dark)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            insetInline: 0,
            height: 400,
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,195,122,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
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
              הסיפור שלנו
            </div>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h1)',
                color: '#ffffff',
                marginBottom: 20,
                letterSpacing: '-0.02em',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              בנינו את הכלי שרצינו לעצמנו
            </h1>
            <p
              style={{
                fontSize: 'var(--text-body-lg)',
                color: 'var(--v2-gray-400)',
                lineHeight: 'var(--line-height-body)',
                maxWidth: 560,
                margin: '0 auto',
              }}
            >
              AXESS נולדה מתוך תסכול. ראינו עסקים ישראלים מוציאים הון על פרסום
              שלא ניתן למדוד. החלטנו לבנות משהו אחר.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: 'var(--v2-dark-2)', borderTop: '1px solid var(--glass-border)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 48,
              alignItems: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
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
                המשימה שלנו
              </h2>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, lineHeight: 1.8, marginBottom: 16 }}>
                לתת לכל עסק בישראל — קטן או גדול — את הכלים שעד היום היו שמורים
                רק לתאגידים גדולים עם תקציבי שיווק ענקיים.
              </p>
              <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, lineHeight: 1.8 }}>
                SMS Marketing עם Validator, מדידה מדויקת, ו-ROI שניתן להוכיח —
                בלחיצה אחת, ב-3 דקות, ללא הדרכות.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)',
              }}
            >
              {[
                { value: '500+', label: 'עסקים פעילים' },
                { value: '10M+', label: 'הודעות שנשלחו' },
                { value: '40%', label: 'אחוז מימוש ממוצע' },
                { value: '4.9★', label: 'דירוג לקוחות' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--v2-gray-400)', fontSize: 15 }}>{stat.label}</span>
                  <span
                    style={{
                      fontFamily: "'Bricolage Grotesque', monospace",
                      fontWeight: 800,
                      fontSize: 24,
                      color: 'var(--v2-primary)',
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: 'var(--v2-dark)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h2)',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              הערכים שמנחים אותנו
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {VALUES.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="stat-card-v2"
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(0,195,122,0.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Icon size={22} style={{ color: 'var(--v2-primary)' }} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#ffffff', marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.7 }}>{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ background: 'var(--v2-dark-2)', borderTop: '1px solid var(--glass-border)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h2)',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              הדרך עד כאן
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TIMELINE.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex',
                  gap: 24,
                  paddingBottom: i < TIMELINE.length - 1 ? 32 : 0,
                  position: 'relative',
                }}
              >
                {/* Line */}
                {i < TIMELINE.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 19,
                      top: 40,
                      bottom: 0,
                      width: 2,
                      background: 'rgba(255,255,255,0.07)',
                    }}
                  />
                )}
                {/* Dot */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--v2-dark-3)',
                    border: '2px solid var(--v2-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bricolage Grotesque', monospace",
                      fontWeight: 800,
                      fontSize: 10,
                      color: 'var(--v2-primary)',
                    }}
                  >
                    {item.year.slice(2)}
                  </span>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <div
                    style={{
                      fontFamily: "'Bricolage Grotesque', monospace",
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--v2-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {item.year}
                  </div>
                  <p style={{ color: 'var(--v2-gray-400)', fontSize: 15, lineHeight: 1.6 }}>{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--v2-dark)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
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
            בוא נצמח יחד
          </h2>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, marginBottom: 32 }}>
            הצטרף לאלפי עסקים שכבר שולחים עם AXESS
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-v2-primary"
            style={{ fontSize: 16, padding: '14px 36px' }}
          >
            <MessageCircle size={18} />
            התחל בחינם
          </a>
        </div>
      </section>

      {/* Footer minimal */}
      <footer
        style={{
          background: 'var(--v2-dark-2)',
          borderTop: '1px solid var(--glass-border)',
          padding: 'var(--space-4) 0',
          textAlign: 'center',
          color: 'var(--v2-gray-400)',
          fontSize: 13,
        }}
      >
        © 2026 AXESS. כל הזכויות שמורות. •{' '}
        <Link to="/terms" style={{ color: 'var(--v2-gray-400)', textDecoration: 'none' }}>תנאי שימוש</Link>
        {' '}•{' '}
        <Link to="/privacy" style={{ color: 'var(--v2-gray-400)', textDecoration: 'none' }}>פרטיות</Link>
      </footer>
    </div>
  )
}
