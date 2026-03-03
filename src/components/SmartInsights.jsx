import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'

const INSIGHTS = [
  {
    id: 1,
    icon: '🧠',
    tag: 'זיהוי חכם',
    tagColor: '#6366F1',
    title: 'זיהינו 250 נוטשים מהשעתיים האחרונות',
    body: 'האם לשלוח קמפיין SMS עם קופון ₪20 ל-15 דקות?',
    actions: [
      { label: 'אשר ✓', primary: true, color: '#10B981' },
      { label: 'בטל ✗', primary: false },
    ],
  },
  {
    id: 2,
    icon: '📍',
    tag: 'תובנת מיקום',
    tagColor: '#2563EB',
    title: '40% מהקהל שלך מגיע מחיפה אחרי חצות',
    body: 'המלצה: קמפיין הסעות מחיפה ב-23:00 — פוטנציאל +₪8,000',
    actions: [
      { label: 'צור קמפיין →', primary: true, color: '#2563EB' },
    ],
  },
  {
    id: 3,
    icon: '🎂',
    tag: 'אוטומציה',
    tagColor: '#F59E0B',
    title: 'מחר יום הולדת ל-12 לקוחות',
    body: 'שלח הודעת מזל טוב אוטומטית עם הטבה אישית?',
    actions: [
      { label: 'הפעל אוטומציה →', primary: true, color: '#F59E0B' },
    ],
  },
  {
    id: 4,
    icon: '👤',
    tag: 'פרופיל לקוח',
    tagColor: '#10B981',
    title: 'לקוח קנה כרטיס לאירוע לפני 3 חודשים',
    body: 'המלצה: שלח לו הזמנה לאירוע הבא שלך',
    actions: [
      { label: 'צור קמפיין ממוקד →', primary: true, color: '#10B981' },
    ],
  },
]

/* ── Single insight card ── */
function InsightCard({ insight, index }) {
  const [dismissed, setDismissed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Tag */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${insight.tagColor}15`, color: insight.tagColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: insight.tagColor }} />
          {insight.tag}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-300 hover:text-gray-500 text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>

      {/* Icon + content */}
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${insight.tagColor}10` }}
        >
          {insight.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-dark mb-1 leading-snug">{insight.title}</div>
          <div className="text-xs text-gray-500 leading-relaxed mb-3">{insight.body}</div>

          {/* Action buttons */}
          {confirmed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs text-accent font-semibold"
            >
              <span>✓</span> בוצע!
            </motion.div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {insight.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => action.primary ? setConfirmed(true) : setDismissed(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                  style={
                    action.primary
                      ? { background: action.color, color: '#ffffff' }
                      : { background: '#F1F5F9', color: '#64748B' }
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function SmartInsights() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50 overflow-hidden" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Zap size={14} />
            AI-Powered
          </div>
          <h2
            className="text-4xl lg:text-5xl font-black text-dark mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            המערכת חושבת בשבילך
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            תובנות חכמות שמגיעות אליך — לא ההפך
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {INSIGHTS.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>

        {/* Bottom line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-500 text-base font-medium">
            כל זה — בלחיצה אחת. ללא אנליסטים. ללא אקסלים.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
