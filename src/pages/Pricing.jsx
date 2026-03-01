import { motion } from 'framer-motion'
import Header from '@/components/Header'
import { Link } from 'react-router-dom'
import { Check, MessageCircle, Zap, Shield, TrendingUp, Users } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const PLANS = [
  {
    name: 'Basic',
    price: '8',
    unit: 'אג׳ להודעה',
    range: 'עד 10,000 הודעות',
    desc: 'מתאים לעסקים קטנים שמתחילים',
    features: [
      'עד 10,000 הודעות',
      'Dashboard בסיסי',
      'Validator — כרטיס דיגיטלי',
      'תמיכה בעברית',
      'קרדיטים לא פגים',
    ],
    featured: false,
    cta: 'התחל עכשיו',
  },
  {
    name: 'Business',
    price: '7',
    unit: 'אג׳ להודעה',
    range: '10,001–50,000 הודעות',
    desc: 'הכי פופולרי — לעסקים צומחים',
    features: [
      '10,001–50,000 הודעות',
      'Dashboard מלא + Reports',
      'Validator + Text Lead',
      'Audiences + Segmentation',
      'תמיכה מועדפת',
      'API Access',
    ],
    featured: true,
    cta: 'התחל עכשיו — הכי פופולרי',
  },
  {
    name: 'Premium',
    price: '6',
    unit: 'אג׳ להודעה',
    range: '50,001–200,000 הודעות',
    desc: 'לעסקים עם נפח שליחה גבוה',
    features: [
      '50,001–200,000 הודעות',
      'כל תכונות Business',
      'White-label Validator',
      'Dedicated Account Manager',
      'SLA 99.9%',
    ],
    featured: false,
    cta: 'צור קשר',
  },
  {
    name: 'Enterprise',
    price: '5',
    unit: 'אג׳ להודעה',
    range: '200,001+ הודעות',
    desc: 'לרשתות וארגונים גדולים',
    features: [
      '200,001+ הודעות',
      'כל תכונות Premium',
      'Custom Integrations',
      'On-premise option',
      'Dedicated Support 24/7',
      'Custom SLA',
    ],
    featured: false,
    cta: 'צור קשר',
  },
]

const FAQ = [
  {
    q: 'האם הקרדיטים פגים?',
    a: 'לא. הקרדיטים שרכשת לא פגים לעולם. תוכל להשתמש בהם בכל עת.',
  },
  {
    q: 'האם יש עמלת הצטרפות?',
    a: 'לא. אין עמלת הצטרפות, אין דמי מנוי חודשיים, אין חוזים. תשלום רק על מה ששלחת.',
  },
  {
    q: 'מה המינימום לרכישה?',
    a: 'המינימום הוא 1,500 הודעות. אחרי זה — קנה כמה שצריך, בכל עת.',
  },
  {
    q: 'האם ניתן לשדרג תוכנית?',
    a: 'כן. ברגע שתגיע לסף הבא, המחיר יורד אוטומטית. אין צורך בשדרוג ידני.',
  },
  {
    q: 'מה כולל Validator?',
    a: 'Validator הוא כרטיס דיגיטלי ייחודי לכל לקוח — QR code, קוד קופון, כפתור מימוש. הכל נמדד ונרשם.',
  },
]

export default function Pricing() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#ffffff' }}>
      <Header />

      {/* Hero */}
      <section
        style={{
          padding: 'var(--space-16) 0 var(--space-8)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            insetInline: 0,
            height: 300,
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,195,122,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
              תמחור שקוף
            </div>
            <h1
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'var(--text-h1)',
                color: '#ffffff',
                marginBottom: 16,
                letterSpacing: '-0.02em',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              תשלום רק על מה ששלחת
            </h1>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
              קרדיטים לא פגים. אין חוזים. אין דמי מנוי. אין הפתעות.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '0 0 var(--space-12)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 16,
            }}
          >
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: plan.featured ? 'var(--v2-primary)' : 'var(--v2-dark-3)',
                  border: plan.featured ? 'none' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.featured ? 'var(--shadow-glow-green)' : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: plan.featured ? 'rgba(8,12,20,0.7)' : 'var(--v2-gray-400)',
                    marginBottom: 8,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', monospace",
                    fontWeight: 800,
                    fontSize: 56,
                    lineHeight: 1,
                    color: plan.featured ? 'var(--v2-dark)' : '#ffffff',
                    letterSpacing: '-0.03em',
                    marginBottom: 4,
                  }}
                >
                  {plan.price}
                </div>
                <div style={{ fontSize: 13, color: plan.featured ? 'rgba(8,12,20,0.65)' : 'var(--v2-gray-400)', marginBottom: 2 }}>
                  {plan.unit}
                </div>
                <div style={{ fontSize: 12, color: plan.featured ? 'rgba(8,12,20,0.5)' : 'var(--v2-gray-400)', marginBottom: 12 }}>
                  {plan.range}
                </div>
                <p style={{ fontSize: 14, color: plan.featured ? 'rgba(8,12,20,0.65)' : 'var(--v2-gray-400)', marginBottom: 20, lineHeight: 1.5 }}>
                  {plan.desc}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: plan.featured ? 'rgba(8,12,20,0.15)' : 'rgba(0,195,122,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} style={{ color: plan.featured ? 'var(--v2-dark)' : 'var(--v2-primary)' }} />
                      </div>
                      <span style={{ fontSize: 14, color: plan.featured ? 'rgba(8,12,20,0.8)' : 'var(--v2-gray-400)' }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    padding: '13px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    background: plan.featured ? 'rgba(8,12,20,0.15)' : 'var(--v2-primary)',
                    color: plan.featured ? 'var(--v2-dark)' : 'var(--v2-dark)',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13, marginTop: 20 }}>
            מינימום רכישה: 1,500 הודעות • ללא עמלת הצטרפות • תמיכה בעברית
          </p>
        </div>
      </section>

      {/* Trust row */}
      <section
        style={{
          background: 'var(--v2-dark-2)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          padding: 'var(--space-6) 0',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            {[
              { icon: Shield, text: 'ללא עמלות נסתרות' },
              { icon: Zap,    text: 'קרדיטים לא פגים' },
              { icon: Users,  text: 'תמיכה בעברית' },
              { icon: TrendingUp, text: 'ROI מדיד' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} style={{ color: 'var(--v2-primary)' }} strokeWidth={1.5} />
                <span style={{ color: 'var(--v2-gray-400)', fontSize: 15 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'var(--v2-dark)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'var(--text-h2)',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 40,
              letterSpacing: '-0.02em',
            }}
          >
            שאלות נפוצות
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{
                  background: 'var(--v2-dark-3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', marginBottom: 8 }}>{item.q}</h3>
                <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.7 }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--v2-dark-2)', borderTop: '1px solid var(--glass-border)', padding: 'var(--space-12) 0' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
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
            מוכן להתחיל?
          </h2>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, marginBottom: 32 }}>
            פתח חשבון ב-3 דקות. ללא כרטיס אשראי.
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

      <footer
        style={{
          background: 'var(--v2-dark)',
          borderTop: '1px solid var(--glass-border)',
          padding: 'var(--space-4) 0',
          textAlign: 'center',
          color: 'var(--v2-gray-400)',
          fontSize: 13,
        }}
      >
        © 2026 AXESS •{' '}
        <Link to="/terms" style={{ color: 'var(--v2-gray-400)', textDecoration: 'none' }}>תנאי שימוש</Link>
        {' '}•{' '}
        <Link to="/privacy" style={{ color: 'var(--v2-gray-400)', textDecoration: 'none' }}>פרטיות</Link>
      </footer>
    </div>
  )
}
