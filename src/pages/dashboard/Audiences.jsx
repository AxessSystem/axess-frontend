import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload, Crown, RefreshCw, Sparkles, CheckCircle, Radio, Scan, AlertTriangle, Ticket, Cake, Send, Calendar } from 'lucide-react'
import EngagementScore from '@/components/ui/EngagementScore'
import EmptyState from '@/components/ui/EmptyState'
import ImportModal from '@/components/ui/ImportModal'
import ExportButton from '@/components/ui/ExportButton'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const SEGMENT_ICONS = {
  all: Users,
  vip: Crown,
  loyal: RefreshCw,
  new: Sparkles,
  checkin: CheckCircle,
  live: Radio,
  scanned: Scan,
  at_risk: AlertTriangle,
  validator: Ticket,
  birthday: Cake,
  by_campaign: Send,
  by_event: Calendar,
}

const PRESET_SEGMENTS = [
  { id: 'all', name: 'הכל', description: 'כל הלקוחות הפעילים במערכת' },
  { id: 'vip', name: 'VIP', description: 'לקוחות עם engagement מעל 75 שהוציאו מעל ₪500' },
  { id: 'loyal', name: 'חוזרים', description: 'לקוחות שביקרו 2+ פעמים ופעילים ב-60 יום האחרונים' },
  { id: 'new', name: 'חדשים', description: 'הצטרפו ב-30 יום האחרונים' },
  { id: 'checkin', name: "ביצעו צ'ק-אין", description: "לקוחות שביצעו צ'ק-אין — מהחדש לישן" },
  { id: 'live', name: 'לקוחות לייב', description: "ביצעו צ'ק-אין בטווח שעות מוגדר (ברירת מחדל: 3 שעות)" },
  { id: 'scanned', name: 'נסרקו', description: 'לקוחות שנסרקו דרך Scan Station' },
  { id: 'at_risk', name: 'בסיכון נטישה', description: 'לא פעילים 90+ יום אך היו פעילים בעבר' },
  { id: 'validator', name: 'Validator (מימושים/קופונים)', description: 'לקוחות שמימשו לפחות ולידטור אחד' },
  { id: 'birthday', name: 'ימי הולדת החודש', description: 'לקוחות עם יומולדת ב-30 הימים הקרובים' },
  { id: 'by_campaign', name: 'לפי קמפיין', description: 'סינון לקוחות לפי קמפיין ספציפי' },
  { id: 'by_event', name: 'לפי אירוע', description: 'סינון לקוחות לפי אירוע ספציפי שהשתתפו בו' },
]

function CustomerProfileDrawer({ open, onClose, masterRecipientId, businessId, onTagUpdate }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  const refetch = () => {
    if (masterRecipientId && businessId) {
      api.getCustomerProfile(masterRecipientId, businessId)
        .then(setProfile)
        .catch((err) => setError(err.message))
    }
  }

  useEffect(() => {
    if (!open || !masterRecipientId) return
    setLoading(true)
    setError(null)
    api.getCustomerProfile(masterRecipientId, businessId || undefined)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, masterRecipientId, businessId])

  const addTag = async () => {
    if (!newTag.trim() || !profile?.id || !businessId) return
    try {
      await api.patchRecipientTags(profile.id, 'add', newTag.trim())
      refetch()
      onTagUpdate?.()
      setNewTag('')
      setShowTagInput(false)
      toast.success('התגית נוספה')
    } catch (e) {
      toast.error(e.message || 'שגיאה בהוספת תגית')
    }
  }

  const removeTag = async (tag) => {
    if (!profile?.id || !businessId) return
    try {
      await api.patchRecipientTags(profile.id, 'remove', tag)
      refetch()
      onTagUpdate?.()
      toast.success('התגית הוסרה')
    } catch (e) {
      toast.error(e.message || 'שגיאה בהסרת תגית')
    }
  }

  if (!open) return null

  const fullName = profile?.first_name || profile?.last_name ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'ללא שם'
  const initials = fullName ? fullName.split(/\s+/).map(n => n[0]).join('').slice(0, 2) : (profile?.phone?.[0] || '?')
  const age = profile?.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : null

  const eventLabels = {
    sms_sent: '📱 קיבל SMS',
    sms_delivered: '✅ SMS נמסר',
    link_clicked: '🔗 לחץ על לינק',
    validator_redeemed: '🎟️ מימש ולידטור',
    sms_replied: '💬 הגיב ל-SMS',
    checkin: "📍 צ'ק-אין",
  }

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
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: '#ffffff' }}>כרטיס לקוח</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>
            {loading && <div style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 40 }}>טוען...</div>}
            {error && <div style={{ textAlign: 'center', color: '#EF4444', padding: 40 }}>{error}</div>}
            {profile && !loading && (
              <>
                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'rgba(0,195,122,0.15)', border: '1px solid rgba(0,195,122,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--v2-primary)', flexShrink: 0,
                  }}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{fullName}</div>
                    <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={14} /> <span dir="ltr">{profile.phone || '—'}</span></div>
                  </div>
                </div>

                {/* שכבה 1 — פרטים בסיסיים */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>פרטים אישיים</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>מגדר</div>
                      <div style={{ color: '#fff' }}>{profile.gender === 'Female' ? 'נקבה' : profile.gender === 'Male' ? 'זכר' : 'לא צוין'}</div>
                    </div>
                    {age != null && (
                      <div>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>גיל</div>
                        <div style={{ color: '#fff' }}>{age}</div>
                      </div>
                    )}
                    {profile.email && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>אימייל</div>
                        <div style={{ color: '#fff', fontSize: 12, wordBreak: 'break-all' }}>{profile.email}</div>
                      </div>
                    )}
                    {profile.id_number && (
                      <div>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>ת.ז</div>
                        <div style={{ color: '#fff' }}>{profile.id_number}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* שכבה 2 — מונים Customer 360 */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>סיכום פעילות</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 13 }}>
                    {[
                      { label: 'Engagement', value: profile.counters?.engagement_score ?? 0, color: 'var(--v2-primary)' },
                      { label: 'אירועים', value: profile.counters?.total_events ?? 0 },
                      { label: "צ'ק-אינים", value: profile.counters?.checkins ?? 0 },
                      { label: 'קמפיינים', value: profile.counters?.campaigns_received ?? 0 },
                      { label: 'לינקים', value: profile.counters?.link_clicks ?? 0 },
                      { label: 'מימושים', value: profile.counters?.redemptions ?? 0 },
                      { label: 'הוצאה', value: profile.counters?.total_spent ?? 0, suffix: '₪', color: 'var(--v2-primary)' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ color: item.color || '#fff', fontWeight: 600 }}>{item.suffix || ''}{Number(item.value || 0).toLocaleString('he-IL')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* שכבה 3 — תגיות */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)' }}>תגיות</span>
                    <button onClick={() => setShowTagInput(!showTagInput)} style={{ fontSize: 12, padding: '2px 8px', background: 'transparent', border: '1px solid var(--v2-primary)', color: 'var(--v2-primary)', borderRadius: 6, cursor: 'pointer' }}>+ הוסף</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showTagInput ? 8 : 0 }}>
                    {(profile.tags || []).map((tag, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, padding: '3px 10px', borderRadius: 9999,
                        background: 'rgba(0,195,122,0.15)', color: 'var(--v2-primary)', border: '1px solid rgba(0,195,122,0.3)',
                      }}>
                        {tag}
                        <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--v2-primary)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                    {(!profile.tags || profile.tags.length === 0) && !showTagInput && (
                      <span style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>אין תגיות</span>
                    )}
                  </div>
                  {showTagInput && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="form-input input"
                        style={{ flex: 1, fontSize: 13, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }}
                        placeholder="למשל: קהל טכנו, חובב ספא..."
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag()}
                      />
                      <button onClick={addTag} style={{ padding: '8px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>הוסף</button>
                    </div>
                  )}
                </div>

                {/* שכבה 4 — היסטוריית אירועים */}
                {profile.business_data?.events?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>היסטוריית אירועים</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                      {(profile.business_data.events || []).map((ev, i) => (
                        <div key={i} style={{
                          padding: '10px 14px', borderRadius: 8, background: 'var(--v2-dark-3)',
                          border: '1px solid var(--glass-border)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#fff' }}>{ev.event_title || 'אירוע'}</div>
                          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {ev.purchase_date && <span>📅 {(ev.purchase_date + '').substring(0, 10)}</span>}
                            {ev.ticket_price && ev.ticket_price !== '0' && <span>💰 ₪{ev.ticket_price}</span>}
                            {ev.payment_method && <span>💳 {ev.payment_method}</span>}
                            <span style={{ color: ev.scan_status === 'Scanned' ? 'var(--v2-primary)' : '#94a3b8' }}>
                              {ev.scan_status === 'Scanned' ? '✅ נסרק' : '⭕ לא נסרק'}
                            </span>
                          </div>
                          {ev.salesperson && ev.salesperson !== 'null' && (
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-500)', marginTop: 3 }}>נמכר ע"י: {ev.salesperson}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* שכבה 5 — היסטוריית פעילות */}
                {profile.timeline?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>היסטוריית פעילות</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {profile.timeline.slice(0, 10).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                            background: (item.event_type || item.type) === 'validator_redeemed' ? 'var(--v2-primary)' : (item.event_type || item.type) === 'link_clicked' ? '#3b82f6' : (item.event_type || item.type) === 'sms_sent' || (item.event_type || item.type) === 'sms_delivered' ? '#94a3b8' : '#f59e0b',
                          }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                              {eventLabels[(item.event_type || item.type)] || (item.event_type || item.type)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-500)' }}>
                              {new Date(item.created_at || item.date).toLocaleDateString('he-IL')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* כפתורי פעולה */}
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '12px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { sessionStorage.setItem('campaign_recipients', JSON.stringify([profile.phone])); navigate('/dashboard/new-campaign'); }}>
                    📱 שלח SMS
                  </button>
                  <button style={{ padding: '12px 16px', background: 'transparent', color: 'var(--v2-gray-400)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => navigate('/dashboard/inbox')}>
                    💬 אינבוקס
                  </button>
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
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)
  const [bulkTag, setBulkTag] = useState('')

  const [liveHours, setLiveHours] = useState(3)
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  const [page, setPage] = useState(1)

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
      setPage(1)
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
    setPage(1)
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
    setPage(1)
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
    setPage(1)
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

  const PER_PAGE = 100
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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

      <style>{`
        @media (max-width: 768px) {
          .audience-search-row { flex-direction: column; align-items: stretch; }
          .audience-search-row > div:first-child { flex-direction: row !important; }
          .audience-segment-chips {
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
          }
          .audience-segment-chips .segment-chip {
            min-width: auto;
            padding: 6px 10px;
            height: 36px;
            background: transparent !important;
            border: 1px solid var(--border);
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }
          .audience-segment-chips .segment-chip.active {
            border-color: var(--v2-primary);
          }
          .audience-actions {
            position: fixed;
            bottom: 60px;
            right: 0;
            left: 0;
            background: var(--v2-dark-2, var(--card));
            border-top: 1px solid var(--border, var(--glass-border));
            padding: 12px 16px;
            z-index: 50;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="audience-segment-chips" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', whiteSpace: 'nowrap' }}>
        {PRESET_SEGMENTS.map(seg => {
          const IconComp = SEGMENT_ICONS[seg.id] || Users
          return (
            <div
              key={seg.id}
              onClick={() => runPreset(seg)}
              className={`segment-chip ${activeSegment === seg.id ? 'active' : ''}`}
              style={{
                minWidth: '120px', padding: '12px', cursor: 'pointer', flexShrink: 0,
                border: activeSegment === seg.id ? '2px solid var(--v2-primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--v2-dark-3)', position: 'relative',
              }}
            >
              <div title={seg.description} style={{ position: 'absolute', top: '6px', left: '6px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--border)', color: 'var(--text-secondary)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>?</div>
              <IconComp size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{seg.name}</span>
              {activeSegment === seg.id && (
                <button onClick={e => { e.stopPropagation(); addSegmentToSelection(seg.name); }} style={{ fontSize: '10px', marginRight: '4px', padding: '2px 6px', background: 'var(--v2-primary)', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}>+ הוסף</button>
              )}
            </div>
          )
        })}
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
              setPage(1)
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
            setPage(1)
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
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="audience-search-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input placeholder="🔍 חפש לפי שם או טלפון..." className="form-input input" style={{ flex: 1, minWidth: 180, fontSize: '13px' }} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              <button onClick={() => setActiveTag('הכל')} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: activeTag === 'הכל' ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: activeTag === 'הכל' ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>הכל</button>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{loading ? 'טוען...' : <><strong style={{ color: 'var(--v2-primary)' }}>{filtered.length}</strong> לקוחות</>}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_TAGS.filter(t => t !== 'הכל').map(tag => (
                <button key={tag} onClick={() => { setActiveTag(tag); setPage(1) }} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: activeTag === tag ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: activeTag === tag ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer' }}>{tag}</button>
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
          <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: '16px' }}>
            {paginated.map((r, i) => (
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
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
                        {r.gender === 'Female' ? '👩 נקבה' : r.gender === 'Male' ? '👨 זכר' : '👤'}
                      </span>
                      {r.birth_date && (
                        <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
                          {new Date().getFullYear() - new Date(r.birth_date).getFullYear()} שנים
                        </span>
                      )}
                    </div>
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: page === 1 ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>הקודם</button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: page === totalPages ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>הבא</button>
            </div>
          )}
          </>
        )}

        <div className="audience-actions" style={{ display: 'flex', gap: '8px', padding: '14px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
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
          <button className="btn-ghost" onClick={() => setShowBulkTagModal(true)}>🏷️ תגית לסגמנט</button>
        </div>
      </div>

      {showBulkTagModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowBulkTagModal(false)}>
          <div className="glass-card" style={{ padding: 20, width: '100%', maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>🏷️ הוסף תגית ל-{recipients.length} לקוחות</div>
            <input
              className="form-input input"
              placeholder="שם התגית..."
              value={bulkTag}
              onChange={e => setBulkTag(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: '10px 14px' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
                const ids = recipients.map(r => r.master_recipient_id || r.id).filter(Boolean)
                try {
                  await api.patchBulkTags(bulkTag, ids)
                  setShowBulkTagModal(false)
                  setBulkTag('')
                  toast.success(`התגית נוספה ל-${recipients.length} לקוחות`)
                  fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || []))
                } catch (e) {
                  toast.error(e.message || 'שגיאה')
                }
              }}>החל</button>
              <button className="btn-ghost" onClick={() => { setShowBulkTagModal(false); setBulkTag('') }}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      <CustomerProfileDrawer open={!!selectedCustomerId} onClose={() => setSelectedCustomerId(null)} masterRecipientId={selectedCustomerId} businessId={businessId} onTagUpdate={() => fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || []))} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} businessId={businessId} onImportDone={() => { setImportOpen(false); fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || [])) }} />
    </div>
  )
}
