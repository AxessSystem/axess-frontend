import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload } from 'lucide-react'
import EngagementScore from '@/components/ui/EngagementScore'
import EmptyState from '@/components/ui/EmptyState'
import ImportModal from '@/components/ui/ImportModal'
import ExportButton from '@/components/ui/ExportButton'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const PRESET_SEGMENTS = [
  { id: 'all', name: 'הכל', icon: '👥', description: 'כל הלקוחות הפעילים במערכת' },
  { id: 'vip', name: 'VIP', icon: '👑', description: 'לקוחות עם engagement מעל 75 שהוציאו מעל ₪500' },
  { id: 'loyal', name: 'חוזרים', icon: '🔄', description: 'לקוחות שביקרו 2+ פעמים ופעילים ב-60 יום האחרונים' },
  { id: 'new', name: 'חדשים', icon: '✨', description: 'הצטרפו ב-30 יום האחרונים' },
  { id: 'checkin', name: "ביצעו צ'ק-אין", icon: '✅', description: "לקוחות שביצעו צ'ק-אין — מהחדש לישן" },
  { id: 'live', name: 'לקוחות לייב', icon: '🟢', description: "ביצעו צ'ק-אין בטווח שעות מוגדר (ברירת מחדל: 3 שעות)" },
  { id: 'scanned', name: 'נסרקו', icon: '📲', description: 'לקוחות שנסרקו דרך Scan Station' },
  { id: 'at_risk', name: 'בסיכון נטישה', icon: '⚠️', description: 'לא פעילים 90+ יום אך היו פעילים בעבר' },
  { id: 'validator', name: 'Validator (מימושים/קופונים)', icon: '🎟️', description: 'לקוחות שמימשו לפחות ולידטור אחד' },
  { id: 'birthday', name: 'ימי הולדת החודש', icon: '🎂', description: 'לקוחות עם יומולדת ב-30 הימים הקרובים' },
  { id: 'by_campaign', name: 'לפי קמפיין', icon: '📱', description: 'סינון לקוחות לפי קמפיין ספציפי' },
  { id: 'by_event', name: 'לפי אירוע', icon: '🎪', description: 'סינון לקוחות לפי אירוע ספציפי שהשתתפו בו' },
]

function CustomerProfileDrawer({ open, onClose, masterRecipientId, businessId }) {
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>שלמות פרופיל <span>{completeness}%</span></div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${completeness}%`, background: 'var(--v2-primary)', borderRadius: 9999 }} />
                  </div>
                </div>
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
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>ציר זמן פעילות</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {(profile.timeline || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--v2-dark-3)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
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
  const navigate = useNavigate()
  const { session, businessId } = useAuth()

  const [activeSegment, setActiveSegment] = useState('all')
  const [selectedSegments, setSelectedSegments] = useState([])
  const [recipients, setRecipients] = useState([])
  const [segments, setSegments] = useState({ presets: PRESET_SEGMENTS, saved: [] })
  const [loading, setLoading] = useState(false)
  const [nlQuery, setNlQuery] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [lastWhereClause, setLastWhereClause] = useState('')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('הכל')
  const [sortBy, setSortBy] = useState('score')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const [liveHours, setLiveHours] = useState(3)
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [eventSearch, setEventSearch] = useState('')

  const h = () => {
    const headers = { 'Content-Type': 'application/json', 'X-Business-Id': businessId || '' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    return headers
  }

  useEffect(() => {
    if (!session?.access_token || !businessId) return
    const headers = { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }
    fetch(`${API_BASE}/api/admin/segments`, { headers }).then(r => r.ok ? r.json() : {}).then(d => setSegments({ presets: PRESET_SEGMENTS, saved: d?.saved || [] }))
    fetch(`${API_BASE}/api/admin/recipients`, { headers }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || []))
    fetch(`${API_BASE}/api/admin/campaigns?limit=100&business_id=${businessId}`, { headers }).then(r => r.ok ? r.json() : {}).then(d => setCampaigns(d?.campaigns || d || []))
    fetch(`${API_BASE}/api/admin/events?limit=100&business_id=${businessId}`, { headers }).then(r => r.ok ? r.json() : {}).then(d => setEvents(d?.events || d || []))
  }, [session?.access_token, businessId])

  const getWhereClause = (segmentId) => {
    switch (segmentId) {
      case 'vip': return `engagement_score > 75 AND (axess_data->>'total_spent')::numeric > 500`
      case 'loyal': return `last_active <= 60 AND campaigns_received >= 2`
      case 'new': return `created_at >= NOW() - INTERVAL '30 days'`
      case 'checkin': return `last_checkin_at IS NOT NULL`
      case 'live': return `last_checkin_at >= NOW() - INTERVAL '${liveHours} hours'`
      case 'scanned': return `(axess_data->>'scan_count')::int > 0`
      case 'at_risk': return `last_active > 90 AND campaigns_received >= 2`
      case 'validator': return `redemptions > 0`
      case 'birthday': return `EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM NOW())`
      default: return null
    }
  }

  const runPreset = async (segment) => {
    setActiveSegment(segment.id)
    if (segment.id === 'all') {
      const headers = { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }
      const r = await fetch(`${API_BASE}/api/admin/recipients`, { headers })
      const d = r.ok ? await r.json() : {}
      setRecipients(d?.recipients || [])
      return
    }
    if (segment.id === 'by_campaign' || segment.id === 'by_event') return
    setLoading(true)
    const wc = getWhereClause(segment.id)
    const r = await fetch(`${API_BASE}/api/admin/segments/ai`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ query: segment.name, whereClause: wc }),
    })
    const data = r.ok ? await r.json() : {}
    setRecipients(data?.recipients || [])
    setLoading(false)
  }

  const runSaved = async (seg) => {
    if (!businessId || !session?.access_token) return
    setLoading(true)
    setActiveSegment(seg.id)
    const headers = { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }
    const r = await fetch(`${API_BASE}/api/admin/segments/${seg.id}/run`, { method: 'POST', headers })
    const data = r.ok ? await r.json() : {}
    setRecipients(data?.recipients || [])
    setLoading(false)
  }

  const runAI = async () => {
    if (!nlQuery.trim() || !businessId || !session?.access_token) return
    setLoading(true)
    const r = await fetch(`${API_BASE}/api/admin/segments/ai`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ query: nlQuery }),
    })
    const data = r.ok ? await r.json() : {}
    setRecipients(data?.recipients || [])
    setLastWhereClause(data?.whereClause || '')
    setLoading(false)
    setShowSaveModal(true)
  }

  const addSegmentToSelection = (segmentName) => {
    if (!selectedSegments.includes(segmentName)) setSelectedSegments(prev => [...prev, segmentName])
  }

  const filtered = recipients
    .filter(r => {
      const matchSearch = !search || (r.name && String(r.name).includes(search)) || (r.phone && String(r.phone).includes(search))
      const matchTag = activeTag === 'הכל' || (Array.isArray(r.tags) && r.tags.includes(activeTag))
      return matchSearch && matchTag
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
      if (sortBy === 'campaigns') return (b.campaigns || 0) - (a.campaigns || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'he')
      return 0
    })

  const ALL_TAGS = ['הכל', 'VIP', 'לקוח קבוע', 'חדש']

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>קהלים</h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{recipients.length} אנשי קשר</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setImportOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer' }}>
            <Upload size={16} /> ייבוא קהל
          </button>
          <ExportButton businessId={businessId} segment="all" label="ייצוא" />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '20px', borderRight: '3px solid var(--v2-primary)' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--v2-primary)' }}>קהלים</strong> — בחר סגמנט מוכן או צור פילוח חכם בשפה חופשית.
          ניתן לשלב מספר סגמנטים יחד, לשמור אותם לשימוש חוזר, ולשלוח קמפיין ישירות מכאן.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {PRESET_SEGMENTS.map(seg => (
          <div
            key={seg.id}
            onClick={() => runPreset(seg)}
            className="glass-card"
            style={{
              minWidth: '120px', padding: '12px', cursor: 'pointer', flexShrink: 0,
              border: activeSegment === seg.id ? '2px solid var(--v2-primary)' : '1px solid var(--border)',
              position: 'relative',
            }}
          >
            <div title={seg.description} style={{ position: 'absolute', top: '6px', left: '6px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--border)', color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>?</div>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{seg.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{seg.name}</div>
            {activeSegment === seg.id && (
              <button onClick={e => { e.stopPropagation(); addSegmentToSelection(seg.name); }} style={{ fontSize: '10px', marginTop: '4px', padding: '2px 6px', background: 'var(--v2-primary)', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}>+ הוסף</button>
            )}
          </div>
        ))}
      </div>

      {segments.saved?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>💾 סגמנטים שמורים</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {segments.saved.map(seg => (
              <button key={seg.id} className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => runSaved(seg)}>
                {seg.name} ({seg.use_count || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSegments.length > 0 && (
        <div className="glass-card" style={{ padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>סגמנטים: {selectedSegments.join(' + ')}</span>
          <button className="btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => setSelectedSegments([])}>נקה</button>
        </div>
      )}

      {activeSegment === 'live' && (
        <div className="glass-card" style={{ padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px' }}>🟢 הצג לקוחות שביצעו צ'ק-אין ב</span>
          <input type="number" min={1} max={24} value={liveHours} onChange={e => setLiveHours(Number(e.target.value))} style={{ width: '60px', padding: '4px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', textAlign: 'center' }} />
          <span style={{ fontSize: '13px' }}>שעות האחרונות</span>
          <button className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => runPreset({ id: 'live', name: 'לקוחות לייב' })}>עדכן</button>
        </div>
      )}

      {activeSegment === 'by_campaign' && (
        <div className="glass-card" style={{ padding: '12px', marginBottom: '12px' }}>
          <input placeholder="🔍 חפש קמפיין..." className="form-input input" style={{ marginBottom: '8px' }} value={campaignSearch} onChange={e => setCampaignSearch(e.target.value)} />
          <select className="form-input input" style={{ marginBottom: '10px' }} value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}>
            <option value="">בחר קמפיין...</option>
            {Array.isArray(campaigns)
              ? campaigns.filter(c => !campaignSearch || (c.name && c.name.includes(campaignSearch)) || (c.message && c.message.includes(campaignSearch))).map(c => (
                <option key={c.id} value={c.id}>{c.name || (c.message || '').substring(0, 40)} — {new Date(c.sent_at || c.created_at).toLocaleDateString('he-IL')}</option>
              ))
              : null}
          </select>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { val: 'all', label: 'הכל' },
              { val: 'received', label: 'קיבלו' },
              { val: 'clicked', label: 'לחצו' },
              { val: 'redeemed', label: 'מימשו' },
              { val: 'not_received', label: 'לא קיבלו' },
            ].map(f => (
              <label key={f.val} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="campaignFilter" value={f.val} checked={campaignFilter === f.val} onChange={() => setCampaignFilter(f.val)} />
                {f.label}
              </label>
            ))}
          </div>
          {selectedCampaign && (
            <button className="btn-primary" style={{ marginTop: '10px', fontSize: '13px' }} onClick={async () => {
              setLoading(true)
              const r = await fetch(`${API_BASE}/api/admin/segments/ai`, { method: 'POST', headers: h(), body: JSON.stringify({ query: `קמפיין ${selectedCampaign} סינון ${campaignFilter}`, campaignId: selectedCampaign, campaignFilter }) })
              const d = r.ok ? await r.json() : {}
              setRecipients(d?.recipients || [])
              setLoading(false)
            }}>הצג לקוחות</button>
          )}
        </div>
      )}

      {activeSegment === 'by_event' && (
        <div className="glass-card" style={{ padding: '12px', marginBottom: '12px' }}>
          <input placeholder="🔍 חפש אירוע..." className="form-input input" style={{ marginBottom: '8px' }} value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
          <select className="form-input input" value={selectedEvent} onChange={async e => {
            const val = e.target.value
            setSelectedEvent(val)
            if (!val) return
            setLoading(true)
            const r = await fetch(`${API_BASE}/api/admin/segments/ai`, { method: 'POST', headers: h(), body: JSON.stringify({ query: `אירוע ${val}`, eventId: val }) })
            const d = r.ok ? await r.json() : {}
            setRecipients(d?.recipients || [])
            setLoading(false)
          }}>
            <option value="">בחר אירוע...</option>
            {Array.isArray(events)
              ? events.filter(ev => !eventSearch || (ev.title && ev.title.includes(eventSearch)) || (ev.name && ev.name.includes(eventSearch))).map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title || ev.name} — {new Date(ev.event_date || ev.created_at).toLocaleDateString('he-IL')}</option>
              ))
              : null}
          </select>
        </div>
      )}

      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>🤖 סגמנטציה AI — תאר את הקהל בשפה חופשית</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="form-input input" style={{ flex: 1 }} placeholder='למשל: "נשים מתל אביב שהגיעו ל-SAGA ולא קיבלו קמפיין ב-30 יום"' value={nlQuery} onChange={e => setNlQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAI()} />
          <button className="btn-primary" onClick={runAI} disabled={loading}>{loading ? '...' : 'חפש'}</button>
        </div>
      </div>

      {showSaveModal && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', borderRight: '3px solid var(--v2-primary)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>💾 לשמור סגמנט זה לשימוש חוזר?</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="form-input input" style={{ flex: 1 }} placeholder="שם הסגמנט..." value={saveName} onChange={e => setSaveName(e.target.value)} />
            <button className="btn-primary" onClick={async () => {
              await fetch(`${API_BASE}/api/admin/segments`, { method: 'POST', headers: h(), body: JSON.stringify({ name: saveName, whereClause: lastWhereClause, createdBy: 'ai', description: nlQuery }) })
              setShowSaveModal(false)
              setSaveName('')
              const r = await fetch(`${API_BASE}/api/admin/segments`, { headers: h() })
              const d = r.ok ? await r.json() : {}
              setSegments({ presets: PRESET_SEGMENTS, saved: d?.saved || [] })
            }}>שמור</button>
            <button className="btn-ghost" onClick={() => setShowSaveModal(false)}>דלג</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{loading ? 'טוען...' : <><strong style={{ color: 'var(--v2-primary)' }}>{recipients.length}</strong> לקוחות</>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="🔍 חפש לפי שם או טלפון..." className="form-input input" style={{ width: '250px', fontSize: '13px' }} value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 6 }}>
              {ALL_TAGS.map(tag => (
                <button key={tag} onClick={() => setActiveTag(tag)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: activeTag === tag ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: activeTag === tag ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer' }}>{tag}</button>
              ))}
            </div>
            <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="score">מיין: ציון</option>
              <option value="campaigns">מיין: קמפיינים</option>
              <option value="name">מיין: שם</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🔍" title="לא נמצאו אנשי קשר" description="נסה לשנות את מונחי החיפוש או הסנן" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: '16px' }}>
            {filtered.map((r, i) => (
              <motion.div key={r.id || r.phone || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '18px', cursor: 'pointer' }}
                onClick={() => setSelectedCustomerId(String(r.master_recipient_id || r.id))}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,195,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-primary)' }}>{(r.name || '—').charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || '—'}</div>
                      <EngagementScore score={r.score} size={40} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}><Phone size={11} /> {r.phone}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {(Array.isArray(r.tags) ? r.tags : []).map(tag => (
                        <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: tag === 'VIP' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)', color: tag === 'VIP' ? '#F59E0B' : 'var(--v2-gray-400)' }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                      <span>{r.campaigns || 0} קמפיינים</span>
                      <span>{r.lastSeen || '—'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', padding: '14px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => {
            const phones = recipients.map(r => r.phone).filter(Boolean)
            sessionStorage.setItem('campaign_recipients', JSON.stringify(phones))
            sessionStorage.setItem('campaign_segment_name', activeSegment)
            navigate('/dashboard/new-campaign')
          }}>📤 צור קמפיין לסגמנט ({recipients.length})</button>
          <button className="btn-ghost" onClick={() => {
            const phones = recipients.map(r => r.phone).filter(Boolean)
            const existing = JSON.parse(sessionStorage.getItem('campaign_recipients') || '[]')
            sessionStorage.setItem('campaign_recipients', JSON.stringify([...new Set([...existing, ...phones])]))
            toast.success('נוסף לקמפיין')
          }}>➕ הוסף לקמפיין קיים</button>
          <ExportButton businessId={businessId} segment={activeSegment} label="📥 ייצוא CSV" />
        </div>
      </div>

      <CustomerProfileDrawer open={!!selectedCustomerId} onClose={() => setSelectedCustomerId(null)} masterRecipientId={selectedCustomerId} businessId={businessId} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} businessId={businessId} onImportDone={() => { setImportOpen(false); fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || [])) }} />
    </div>
  )
}
