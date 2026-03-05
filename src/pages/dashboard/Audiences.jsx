import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload } from 'lucide-react'
import EngagementScore from '@/components/ui/EngagementScore'
import EmptyState from '@/components/ui/EmptyState'
import ImportModal from '@/components/ui/ImportModal'
import ExportButton from '@/components/ui/ExportButton'
import { api } from '@/services/api'

const MOCK_RECIPIENTS = [
  { id: 1,  name: 'דני כהן',      phone: '050-1234567', tags: ['לקוח קבוע', 'VIP'], score: 85, campaigns: 12, lastSeen: '28/02/2026' },
  { id: 2,  name: 'מיכל לוי',     phone: '052-9876543', tags: ['חדש'],               score: 42, campaigns: 2,  lastSeen: '15/02/2026' },
  { id: 3,  name: 'יוסי ברק',     phone: '054-5555555', tags: ['VIP'],               score: 96, campaigns: 28, lastSeen: '01/03/2026' },
  { id: 4,  name: 'שרה גולן',     phone: '058-1111222', tags: ['לקוח קבוע'],        score: 71, campaigns: 8,  lastSeen: '25/02/2026' },
  { id: 5,  name: 'אבי שמיר',     phone: '050-7777888', tags: ['חדש'],               score: 28, campaigns: 1,  lastSeen: '10/02/2026' },
  { id: 6,  name: 'רחל אברהם',    phone: '052-3334455', tags: ['VIP', 'לקוח קבוע'], score: 91, campaigns: 19, lastSeen: '27/02/2026' },
  { id: 7,  name: 'משה כץ',       phone: '054-2223344', tags: ['לקוח קבוע'],        score: 63, campaigns: 6,  lastSeen: '20/02/2026' },
  { id: 8,  name: 'לאה פרידמן',   phone: '058-9998877', tags: ['חדש'],               score: 55, campaigns: 3,  lastSeen: '18/02/2026' },
  { id: 9,  name: 'ניר שפירא',    phone: '050-4445566', tags: ['VIP'],               score: 88, campaigns: 15, lastSeen: '28/02/2026' },
  { id: 10, name: 'תמר הרוש',     phone: '052-7776655', tags: ['לקוח קבוע'],        score: 74, campaigns: 9,  lastSeen: '22/02/2026' },
]

const ALL_TAGS = ['הכל', 'VIP', 'לקוח קבוע', 'חדש']

const businessId = null // TODO: from AuthContext when available

function CustomerProfileDrawer({ open, onClose, masterRecipientId }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !masterRecipientId) return
    setLoading(true)
    setError(null)
    api.getCustomerProfile(masterRecipientId, businessId || undefined)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, masterRecipientId])

  if (!open) return null
  const fullName = profile?.first_name || profile?.last_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : 'ללא שם'
  const initials = fullName ? fullName.split(/\s+/).map(n => n[0]).join('').slice(0, 2) : (profile?.phone?.[0] || '?')
  const totalSpent = Number(profile?.total_spent) || 0
  const totalPurchases = parseInt(profile?.total_purchases || 0, 10)
  const lastActive = profile?.last_active ? new Date(profile.last_active) : null
  const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive) / 86400000) : null
  const engagementScore = profile?.engagement_score ?? (profile?.axess_data?.engagement_score ?? 0)
  const completeness = parseInt(profile?.profile_completeness || 0, 10)
  const tags = profile?.tags || []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end', alignItems: 'stretch',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(420px, 100vw)', maxWidth: '100%', background: 'var(--v2-dark-2)', borderRight: '1px solid var(--glass-border)',
            overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: '#ffffff' }}>כרטיס לקוח</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>
            {loading && <div style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 40 }}>טוען...</div>}
            {error && <div style={{ textAlign: 'center', color: '#EF4444', padding: 40 }}>{error}</div>}
            {profile && !loading && (
              <>
                {/* Avatar + Name + Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'rgba(0,195,122,0.15)', border: '1px solid rgba(0,195,122,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--v2-primary)', flexShrink: 0,
                  }}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{fullName}</div>
                    <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={14} /> {profile.phone || '—'}</div>
                  </div>
                </div>
                {/* Profile completeness bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>שלמות פרופיל <span>{completeness}%</span></div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${completeness}%`, background: 'var(--v2-primary)', borderRadius: 9999, transition: 'width 0.3s' }} />
                  </div>
                </div>
                {/* 4 KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'סה"כ רכישות', value: totalPurchases, icon: ShoppingBag },
                    { label: 'סה"כ הוצאה', value: `₪${totalSpent.toLocaleString('he-IL')}`, icon: Activity },
                    { label: 'Engagement', value: engagementScore, icon: Activity },
                    { label: 'פעיל לאחרונה', value: daysSinceActive !== null ? (daysSinceActive < 1 ? 'היום' : `לפני ${daysSinceActive} ימים`) : '—', icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                      <Icon size={16} style={{ color: 'var(--v2-primary)', marginBottom: 6 }} />
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 9999, fontWeight: 500,
                        background: tag === 'VIP' ? 'rgba(245,158,11,0.15)' : tag === 'פעיל' ? 'rgba(0,195,122,0.15)' : tag === 'נוטש' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                        color: tag === 'VIP' ? '#F59E0B' : tag === 'פעיל' ? 'var(--v2-primary)' : tag === 'נוטש' ? '#EF4444' : 'var(--v2-gray-400)',
                        border: `1px solid ${tag === 'VIP' ? 'rgba(245,158,11,0.3)' : tag === 'פעיל' ? 'rgba(0,195,122,0.3)' : tag === 'נוטש' ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'}`,
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
                {/* Timeline */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>ציר זמן פעילות</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {(profile.timeline || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--v2-dark-3)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#ffffff' }}>{item.label}</div>
                          {item.amount != null && <div style={{ color: 'var(--v2-gray-400)', fontSize: 11 }}>₪{Number(item.amount).toLocaleString('he-IL')}</div>}
                        </div>
                        <div style={{ color: 'var(--v2-gray-400)', fontSize: 11 }}>{item.date ? new Date(item.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Audiences() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('הכל')
  const [sortBy, setSortBy] = useState('score')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const filtered = MOCK_RECIPIENTS
    .filter(r => {
      const matchSearch = r.name.includes(search) || r.phone.includes(search)
      const matchTag = activeTag === 'הכל' || r.tags.includes(activeTag)
      return matchSearch && matchTag
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'campaigns') return b.campaigns - a.campaigns
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'he')
      return 0
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>
            קהלים
          </h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{MOCK_RECIPIENTS.length} אנשי קשר</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setImportOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer' }}
          >
            <Upload size={16} /> ייבוא קהל
          </button>
          <ExportButton businessId={businessId} segment="all" label="ייצוא" />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'סה"כ אנשי קשר', value: MOCK_RECIPIENTS.length, icon: Users, color: 'var(--v2-primary)' },
          { label: 'VIP', value: MOCK_RECIPIENTS.filter(r => r.tags.includes('VIP')).length, icon: Tag, color: '#F59E0B' },
          { label: 'ממוצע ציון', value: Math.round(MOCK_RECIPIENTS.reduce((s, r) => s + r.score, 0) / MOCK_RECIPIENTS.length), icon: Phone, color: 'var(--v2-accent)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'center', transition: 'border-color 0.3s, box-shadow 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v2-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Icon size={20} style={{ color, margin: '0 auto 8px' }} />
            <div style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 28, color: '#ffffff', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 12, color: 'var(--v2-gray-400)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingRight: 36 }} placeholder="חפש לפי שם או טלפון..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {ALL_TAGS.map(tag => {
            const isActive = activeTag === tag
            return (
              <button key={tag} onClick={() => setActiveTag(tag)}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
                  background: isActive ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                  border: isActive ? 'none' : '1px solid var(--glass-border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{tag}</button>
            )
          })}
        </div>

        <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="score">מיין: ציון</option>
          <option value="campaigns">מיין: קמפיינים</option>
          <option value="name">מיין: שם</option>
        </select>
      </div>

      {/* Recipients grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="לא נמצאו אנשי קשר" description="נסה לשנות את מונחי החיפוש או הסנן" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '18px', cursor: 'pointer', transition: 'border-color 0.25s, transform 0.25s' }}
              onClick={() => setSelectedCustomerId(String(r.master_recipient_id || r.id))}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v2-primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,195,122,0.12)', border: '1px solid rgba(0,195,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-primary)' }}>{r.name.charAt(0)}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <EngagementScore score={r.score} size={40} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={11} /> {r.phone}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {r.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 9999, fontWeight: 500,
                        background: tag === 'VIP' ? 'rgba(245,158,11,0.12)' : tag === 'לקוח קבוע' ? 'rgba(0,195,122,0.1)' : 'rgba(255,255,255,0.06)',
                        color: tag === 'VIP' ? '#F59E0B' : tag === 'לקוח קבוע' ? 'var(--v2-primary)' : 'var(--v2-gray-400)',
                        border: `1px solid ${tag === 'VIP' ? 'rgba(245,158,11,0.25)' : tag === 'לקוח קבוע' ? 'rgba(0,195,122,0.25)' : 'var(--glass-border)'}`,
                      }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{r.campaigns} קמפיינים</div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{r.lastSeen}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CustomerProfileDrawer
        open={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        masterRecipientId={selectedCustomerId}
      />

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        businessId={businessId}
        onImportDone={() => setImportOpen(false)}
      />
    </div>
  )
}
