import { motion } from 'framer-motion'
import Header from '@/components/Header'
import { Link } from 'react-router-dom'
import {
  MessageCircle, BarChart3, QrCode, Users, Zap, Shield,
  Clock, TrendingUp, Upload, Bell, Phone, Globe
} from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const FEATURE_GROUPS = [
  {
    category: 'שליחה וקמפיינים',
    color: 'var(--v2-primary)',
    features: [
      {
        icon: MessageCircle,
        title: 'SMS חכם — 201 תווים',
        desc: '201 תווים במחיר הודעה אחת. שלח יותר תוכן, שלם פחות.',
      },
      {
        icon: Upload,
        title: 'העלאת קהל מהירה',
        desc: 'CSV, Excel, או הדבקה ישירה. המערכת מנרמלת מספרים אוטומטית.',
      },
      {
        icon: Clock,
        title: 'תזמון חכם',
        desc: 'שלח מיד, תזמן לשעה מסוימת, או הגדר קמפיין חוזר.',
      },
      {
        icon: Zap,
        title: '3 דקות מקמפיין לשליחה',
        desc: 'ממשק WhatsApp מוכר. ללא הדרכות. ללא עקומת למידה.',
      },
    ],
  },
  {
    category: 'Validator — הכרטיס הדיגיטלי',
    color: 'var(--v2-accent)',
    features: [
      {
        icon: QrCode,
        title: 'QR Code ייחודי לכל לקוח',
        desc: 'כל לקוח מקבל כרטיס דיגיטלי אישי עם QR ייחודי שלא ניתן לזיוף.',
      },
      {
        icon: Shield,
        title: 'מימוש מאובטח',
        desc: 'לחיצה → אימות → מימוש → נרשם. כל המידע מגיע לדאטהבייס שלך.',
      },
      {
        icon: TrendingUp,
        title: 'מדידה מדויקת',
        desc: 'ראה בדיוק כמה לקוחות מימשו, מתי, ואיפה. ROI לכל קמפיין.',
      },
      {
        icon: Globe,
        title: 'White-label מלא',
        desc: 'הלוגו שלך, הצבעים שלך, הדומיין שלך. הלקוח רואה רק אותך.',
      },
    ],
  },
  {
    category: 'ניהול קהל',
    color: '#F59E0B',
    features: [
      {
        icon: Users,
        title: 'Audiences — ניהול רשימות',
        desc: 'ארגן לקוחות לפי תגיות, קבוצות, היסטוריית רכישות.',
      },
      {
        icon: TrendingUp,
        title: 'סגמנטציה חכמה',
        desc: 'שלח לנכונים בלבד. לא לכולם — לאלה שהכי רלוונטיים.',
      },
      {
        icon: Bell,
        title: 'Text Lead',
        desc: 'אפשר לקהל להשיב להודעה. תשובות מגיעות ישירות ל-WhatsApp שלך.',
      },
      {
        icon: Upload,
        title: 'ייצוא CSV',
        desc: 'ייצא כל רשימה, כל סגמנט, לכל מערכת חיצונית.',
      },
    ],
  },
  {
    category: 'Analytics ודוחות',
    color: '#8B5CF6',
    features: [
      {
        icon: BarChart3,
        title: 'Dashboard חי',
        desc: 'KPIs, גרפים, טבלאות — הכל מתעדכן בזמן אמת.',
      },
      {
        icon: TrendingUp,
        title: 'ROI לכל קמפיין',
        desc: 'עלות vs הכנסה. ראה בדיוק כמה כסף הכניס כל SMS.',
      },
      {
        icon: BarChart3,
        title: 'Delivery Reports',
        desc: 'נשלח / נמסר / נפתח / הוקלק / מומש — לכל הודעה.',
      },
      {
        icon: Clock,
        title: 'היסטוריה מלאה',
        desc: 'כל קמפיין, כל שליחה, כל תוצאה — שמורים לנצח.',
      },
    ],
  },
]

export default function Features() {
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
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
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
              <span style={{ color: 'var(--v2-accent)' }}>✦</span>
              כל התכונות
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
              כלים שעובדים.
              <br />
              <span className="text-gradient-v2">תוצאות שניתן למדוד.</span>
            </h1>
            <p style={{ color: 'var(--v2-gray-400)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
              מ-SMS חכם ועד Validator ייחודי — הכל במקום אחד.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Groups */}
      {FEATURE_GROUPS.map((group, gi) => (
        <section
          key={gi}
          style={{
            background: gi % 2 === 0 ? 'var(--v2-dark)' : 'var(--v2-dark-2)',
            borderTop: '1px solid var(--glass-border)',
            padding: 'var(--space-12) 0',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ marginBottom: 40 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: `${group.color}15`,
                  border: `1px solid ${group.color}30`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: group.color,
                  marginBottom: 12,
                }}
              >
                {group.category}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {group.features.map((feat, fi) => {
                const Icon = feat.icon
                return (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: fi * 0.08 }}
                    style={{
                      background: gi % 2 === 0 ? 'var(--v2-dark-3)' : 'var(--v2-dark)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      transition: 'border-color 0.25s ease',
                    }}
                    whileHover={{ borderColor: group.color }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${group.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={22} style={{ color: group.color }} strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 17, color: '#ffffff', marginBottom: 8 }}>
                      {feat.title}
                    </h3>
                    <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, lineHeight: 1.7 }}>
                      {feat.desc}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background: 'var(--v2-dark-3)', borderTop: '1px solid var(--glass-border)', padding: 'var(--space-12) 0' }}>
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
            מוכן לנסות?
          </h2>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 18, marginBottom: 32 }}>
            כל התכונות זמינות מהיום הראשון. ללא הגבלות.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-v2-primary"
              style={{ fontSize: 16, padding: '14px 32px' }}
            >
              <MessageCircle size={18} />
              התחל בחינם
            </a>
            <Link
              to="/pricing"
              className="btn-v2-ghost"
              style={{ fontSize: 16, padding: '14px 32px' }}
            >
              ראה תמחור
            </Link>
          </div>
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
