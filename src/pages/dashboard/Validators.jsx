import { useState } from 'react'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, ExternalLink, Copy, CheckCircle, X, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

const MOCK_VALIDATORS = [
  { id: 1, slug: 'rotschild-march-deal', title: '20% הנחה על ארוחת בוקר', type: 'coupon',  status: 'active',    created: '01/03/2026', expiry: '31/03/2026', total: 1240, redeemed: 89,  campaign: 'מבצע ראש חודש מרץ' },
  { id: 2, slug: 'pesach-event-2026',    title: 'כרטיס כניסה — ערב פסח',  type: 'ticket',  status: 'active',    created: '28/02/2026', expiry: '14/04/2026', total: 850,  redeemed: 342, campaign: 'הזמנה לאירוע פסח' },
  { id: 3, slug: 'birthday-benefit',     title: 'הטבת יום הולדת',          type: 'benefit', status: 'expired',   created: '25/02/2026', expiry: '28/02/2026', total: 320,  redeemed: 145, campaign: 'קמפיין יום הולדת' },
  { id: 4, slug: 'friday-special',       title: 'מבצע שישי — 15% הנחה',   type: 'coupon',  status: 'scheduled', created: '28/02/2026', expiry: '07/03/2026', total: 0,    redeemed: 0,   campaign: 'מבצע שישי' },
]

const TYPE_LABELS = {
  coupon:  { label: 'קופון',  icon: '🎫' },
  ticket:  { label: 'כרטיס', icon: '🎟️' },
  benefit: { label: 'הטבה',  icon: '🎁' },
  confirm: { label: 'אישור', icon: '✅' },
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 380 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: '#ffffff' }}>{validator.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--v2-gray-400)')}>
            <X size={20} />
          </button>
        </div>

        {/* QR placeholder */}
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 160, height: 160, background: '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <QrCode size={60} style={{ color: '#0F172A', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12, color: '#64748B' }}>QR Code</div>
            </div>
          </div>
        </div>

        {/* URL row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--v2-gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}
          </div>
          <button onClick={copy}
            style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${copied ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)'}`, background: copied ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)', color: copied ? 'var(--v2-accent)' : 'var(--v2-gray-400)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 22, color: '#ffffff' }}>{validator.total.toLocaleString('he-IL')}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>נשלחו</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 22, color: 'var(--v2-accent)' }}>{validator.redeemed.toLocaleString('he-IL')}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>מומשו</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Validators() {
  const validatorsAllowed = useRequirePermission('can_manage_events')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = MOCK_VALIDATORS.filter(v => filter === 'all' || v.status === filter)

  if (!validatorsAllowed) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>Validators</h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>כרטיסים וקופונים דיגיטליים</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { value: 'all',       label: 'הכל',      count: MOCK_VALIDATORS.length },
          { value: 'active',    label: 'פעיל',     count: MOCK_VALIDATORS.filter(v => v.status === 'active').length },
          { value: 'scheduled', label: 'מתוזמן',  count: MOCK_VALIDATORS.filter(v => v.status === 'scheduled').length },
          { value: 'expired',   label: 'פג תוקף', count: MOCK_VALIDATORS.filter(v => v.status === 'expired').length },
        ].map(tab => {
          const isActive = filter === tab.value
          return (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
                background: isActive ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)',
                color: isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                border: isActive ? 'none' : '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label}
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 9999, background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)' }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="🎫" title="אין Validators" description="צור קמפיין עם Validator כדי לראות אותם כאן" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((v, i) => {
            const typeInfo = TYPE_LABELS[v.type] || TYPE_LABELS.coupon
            const redemptionRate = v.total > 0 ? Math.round(v.redeemed / v.total * 100) : 0

            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(v)}
                style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '18px', cursor: 'pointer', transition: 'border-color 0.25s, transform 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v2-primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{typeInfo.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{v.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{v.campaign}</div>
                    </div>
                  </div>
                  <Badge variant={v.status === 'active' ? 'active' : v.status === 'expired' ? 'danger' : 'scheduled'}>
                    {v.status === 'active' ? 'פעיל' : v.status === 'expired' ? 'פג תוקף' : 'מתוזמן'}
                  </Badge>
                </div>

                {/* Slug */}
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', marginBottom: 14, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  /v/{v.slug}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: '#ffffff' }}>{v.total.toLocaleString('he-IL')}</div>
                    <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>נשלחו</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-accent)' }}>{v.redeemed.toLocaleString('he-IL')}</div>
                    <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>מומשו</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 18, color: 'var(--v2-primary)' }}>{redemptionRate}%</div>
                    <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>אחוז</div>
                  </div>
                </div>

                {/* Progress bar */}
                {v.total > 0 && (
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 9999, height: 6, marginBottom: 12 }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: 'var(--v2-accent)', width: `${redemptionRate}%`, transition: 'width 1s ease' }} />
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> עד {v.expiry}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--v2-primary)' }}>
                    <QrCode size={11} /> QR Code
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {selected && <QRModal validator={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
