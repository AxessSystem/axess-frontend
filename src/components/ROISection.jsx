import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

/* ── Animated counter ── */
function AnimatedNumber({ end, prefix = '', suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setValue(end); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [isInView, end, duration])

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString('he-IL')}{suffix}
    </span>
  )
}

const ROWS = [
  { campaign: 'החזרת נוטשים',   cost: 400,  revenue: 17900, roi: 4475 },
  { campaign: "Upsell בקבוקים", cost: 120,  revenue: 5400,  roi: 4500 },
  { campaign: 'קמפיין יומולדת', cost: 50,   revenue: 2100,  roi: 4200 },
]

const BOTTOM_STATS = [
  { label: 'ממוצע ROI',       value: 4391, suffix: '%', prefix: '' },
  { label: 'זמן עד תוצאה',    value: 48,   suffix: ' שעות', prefix: '' },
  { label: 'לקוחות חוזרים',   value: 34,   suffix: '%',  prefix: '+' },
]

export default function ROISection() {
  return (
    <section className="py-20 lg:py-28 bg-dark overflow-hidden" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-4">
            <TrendingUp size={14} />
            תוצאות אמיתיות
          </div>
          <h2
            className="text-4xl lg:text-5xl font-black text-white mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            המספרים מדברים בעד עצמם
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            כל קמפיין מוצג עם עלות, הכנסה ו-ROI בזמן אמת
          </p>
        </motion.div>

        {/* ROI Table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden border border-white/10 mb-10"
        >
          {/* Table header */}
          <div className="grid grid-cols-4 bg-white/5 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div>קמפיין</div>
            <div className="text-center">עלות</div>
            <div className="text-center">הכנסה ישירה</div>
            <div className="text-center">ROI</div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <motion.div
              key={row.campaign}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 + 0.2 }}
              className="grid grid-cols-4 px-6 py-4 items-center border-t border-white/5 hover:bg-white/3 transition-colors"
              style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              {/* Campaign name */}
              <div className="font-semibold text-white text-sm">{row.campaign}</div>

              {/* Cost */}
              <div className="text-center">
                <span className="text-gray-400 text-sm font-medium">
                  ₪<AnimatedNumber end={row.cost} />
                </span>
              </div>

              {/* Revenue */}
              <div className="text-center">
                <span className="text-accent font-bold text-sm">
                  ₪<AnimatedNumber end={row.revenue} />
                </span>
              </div>

              {/* ROI — big green */}
              <div className="text-center">
                <span
                  className="font-black text-xl"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#10B981' }}
                >
                  <AnimatedNumber end={row.roi} suffix="%" />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom stats */}
        <div className="grid grid-cols-3 gap-4">
          {BOTTOM_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.4 }}
              className="text-center rounded-2xl border border-white/10 py-6 px-4"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div
                className="text-3xl lg:text-4xl font-black mb-1"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#10B981' }}
              >
                <AnimatedNumber end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
