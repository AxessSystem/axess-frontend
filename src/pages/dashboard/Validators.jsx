import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, ExternalLink, Copy, CheckCircle, X, TrendingUp, Clock, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

const MOCK_VALIDATORS = [
  {
    id: 1,
    slug: 'rotschild-march-deal',
    title: '20% הנחה על ארוחת בוקר',
    type: 'coupon',
    status: 'active',
    created: '01/03/2026',
    expiry: '31/03/2026',
    total: 1240,
    redeemed: 89,
    campaign: 'מבצע ראש חודש מרץ',
  },
  {
    id: 2,
    slug: 'pesach-event-2026',
    title: 'כרטיס כניסה — ערב פסח',
    type: 'ticket',
    status: 'active',
    created: '28/02/2026',
    expiry: '14/04/2026',
    total: 850,
    redeemed: 342,
    campaign: 'הזמנה לאירוע פסח',
  },
  {
    id: 3,
    slug: 'birthday-benefit',
    title: 'הטבת יום הולדת',
    type: 'benefit',
    status: 'expired',
    created: '25/02/2026',
    expiry: '28/02/2026',
    total: 320,
    redeemed: 145,
    campaign: 'קמפיין יום הולדת',
  },
  {
    id: 4,
    slug: 'friday-special',
    title: 'מבצע שישי — 15% הנחה',
    type: 'coupon',
    status: 'scheduled',
    created: '28/02/2026',
    expiry: '07/03/2026',
    total: 0,
    redeemed: 0,
    campaign: 'מבצע שישי',
  },
]

const TYPE_LABELS = {
  coupon:  { label: 'קופון',     icon: '🎫', color: 'primary' },
  ticket:  { label: 'כרטיס',    icon: '🎟️', color: 'warning' },
  benefit: { label: 'הטבה',     icon: '🎁', color: 'success' },
  confirm: { label: 'אישור',    icon: '✅', color: 'success' },
}

/* ── QR Modal ── */
function QRModal({ validator, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = `https://axess.co.il/v/${validator.slug}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-surface-100 border border-border rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">{validator.title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* QR Code placeholder */}
        <div className="bg-white rounded-xl p-6 flex items-center justify-center mb-4">
          <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode size={60} className="text-dark mx-auto mb-2" />
              <div className="text-xs text-gray-500">QR Code</div>
            </div>
          </div>
        </div>

        {/* URL */}
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-50 border border-border rounded-xl px-3 py-2.5 text-xs text-subtle truncate">
            {url}
          </div>
          <button
            onClick={copy}
            className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              copied
                ? 'bg-accent/10 border-accent/20 text-accent'
                : 'bg-surface-50 border-border text-subtle hover:text-white'
            }`}
          >
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl bg-primary text-white border border-primary/20 text-xs hover:bg-primary-dark transition-all"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-surface-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-white">{validator.total.toLocaleString('he-IL')}</div>
            <div className="text-xs text-muted">נשלחו</div>
          </div>
          <div className="bg-surface-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-accent">{validator.redeemed.toLocaleString('he-IL')}</div>
            <div className="text-xs text-muted">מומשו</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Validators() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = MOCK_VALIDATORS.filter(v =>
    filter === 'all' || v.status === filter
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Validators
          </h1>
          <p className="text-muted text-sm mt-0.5">כרטיסים וקופונים דיגיטליים</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all',       label: 'הכל',      count: MOCK_VALIDATORS.length },
          { value: 'active',    label: 'פעיל',     count: MOCK_VALIDATORS.filter(v => v.status === 'active').length },
          { value: 'scheduled', label: 'מתוזמן',  count: MOCK_VALIDATORS.filter(v => v.status === 'scheduled').length },
          { value: 'expired',   label: 'פג תוקף', count: MOCK_VALIDATORS.filter(v => v.status === 'expired').length },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-surface-50 text-subtle border border-border hover:border-border-light'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.value ? 'bg-white/20' : 'bg-surface-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="🎫" title="אין Validators" description="צור קמפיין עם Validator כדי לראות אותם כאן" />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v, i) => {
            const typeInfo = TYPE_LABELS[v.type] || TYPE_LABELS.coupon
            const redemptionRate = v.total > 0 ? Math.round(v.redeemed / v.total * 100) : 0

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card hover:border-border-light transition-all cursor-pointer"
                onClick={() => setSelected(v)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{v.title}</div>
                      <div className="text-xs text-muted mt-0.5">{v.campaign}</div>
                    </div>
                  </div>
                  <Badge variant={v.status === 'active' ? 'active' : v.status === 'expired' ? 'danger' : 'scheduled'}>
                    {v.status === 'active' ? 'פעיל' : v.status === 'expired' ? 'פג תוקף' : 'מתוזמן'}
                  </Badge>
                </div>

                {/* Slug */}
                <div className="text-xs text-muted bg-surface-50 rounded-lg px-3 py-2 mb-4 font-mono truncate">
                  /v/{v.slug}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-black text-white">{v.total.toLocaleString('he-IL')}</div>
                    <div className="text-[11px] text-muted">נשלחו</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-accent">{v.redeemed.toLocaleString('he-IL')}</div>
                    <div className="text-[11px] text-muted">מומשו</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-primary">{redemptionRate}%</div>
                    <div className="text-[11px] text-muted">אחוז</div>
                  </div>
                </div>

                {/* Progress bar */}
                {v.total > 0 && (
                  <div className="w-full bg-surface-50 rounded-full h-1.5 mb-3">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all duration-1000"
                      style={{ width: `${redemptionRate}%` }}
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    עד {v.expiry}
                  </div>
                  <div className="flex items-center gap-1 text-primary hover:underline">
                    <QrCode size={11} />
                    QR Code
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {selected && (
          <QRModal validator={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
