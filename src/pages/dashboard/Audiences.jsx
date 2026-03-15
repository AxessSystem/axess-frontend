import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload, Crown, RefreshCw, Sparkles, CheckCircle, Radio, Scan, AlertTriangle, Ticket, Cake, Send, Calendar, Pencil, Workflow } from 'lucide-react'
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

const CATEGORIES = [
  { id: 'all_cat', label: 'הכל' },
  { id: 'engagement', label: 'מעורבות' },
  { id: 'value', label: 'ערך' },
  { id: 'data', label: 'דאטה שלי' },
  { id: 'saved', label: 'שמורים' },
]

const PRESET_SEGMENTS = [
  { id: 'all', name: 'הכל', description: 'כל הלקוחות הפעילים במערכת', dataSource: 'both', category: 'all_cat' },
  { id: 'vip', name: 'VIP', description: 'לקוחות עם engagement מעל 75 שהוציאו מעל ₪500', dataSource: 'historical', category: 'value' },
  { id: 'loyal', name: 'חוזרים', description: 'לקוחות שביקרו 2+ פעמים ופעילים ב-60 יום האחרונים', dataSource: 'historical', category: 'value' },
  { id: 'new', name: 'חדשים', description: 'הצטרפו ב-30 יום האחרונים', dataSource: 'both', category: 'value' },
  { id: 'checkin', name: "ביצעו צ'ק-אין", description: "לקוחות שביצעו צ'ק-אין — מהחדש לישן", dataSource: 'native', category: 'engagement' },
  { id: 'live', name: 'לקוחות לייב', description: "ביצעו צ'ק-אין בטווח שעות מוגדר (ברירת מחדל: 3 שעות)", dataSource: 'native', category: 'engagement' },
  { id: 'scanned', name: 'נסרקו', description: 'לקוחות שנסרקו דרך Scan Station', dataSource: 'historical', category: 'data' },
  { id: 'at_risk', name: 'בסיכון נטישה', description: 'לא פעילים 90+ יום אך היו פעילים בעבר', dataSource: 'historical', category: 'value' },
  { id: 'validator', name: 'Validator (מימושים/קופונים)', description: 'לקוחות שמימשו לפחות ולידטור אחד', dataSource: 'native', category: 'engagement' },
  { id: 'birthday', name: 'ימי הולדת החודש', description: 'לקוחות עם יומולדת ב-30 הימים הקרובים', dataSource: 'both', category: 'data' },
  { id: 'by_campaign', name: 'לפי קמפיין', description: 'סינון לקוחות לפי קמפיין ספציפי', dataSource: 'native', category: 'engagement' },
  { id: 'by_event', name: 'לפי אירוע', description: 'סינון לקוחות לפי אירוע ספציפי שהשתתפו בו', dataSource: 'historical', category: 'data' },
]

function CustomerProfileDrawer({ open, onClose, masterRecipientId, businessId, onTagUpdate }) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', gender: '', birth_date: '', id_number: '' })

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
    setIsEditing(false)
    api.getCustomerProfile(masterRecipientId, businessId || undefined)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [open, masterRecipientId, businessId])

  const startEdit = () => {
    if (!profile) return
    setEditForm({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      gender: profile.gender || '',
      birth_date: profile.birth_date ? String(profile.birth_date).slice(0, 10) : '',
      id_number: profile.id_number || '',
    })
    setIsEditing(true)
  }
  const cancelEdit = () => setIsEditing(false)
  const saveProfile = async () => {
    if (!profile?.id || !businessId || !session?.access_token) return
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }
    const body = { business_id: businessId }
    if (editForm.first_name !== undefined) body.first_name = editForm.first_name
    if (editForm.last_name !== undefined) body.last_name = editForm.last_name
    if (editForm.email !== undefined) body.email = editForm.email
    if (editForm.gender !== undefined) body.gender = editForm.gender || null
    if (editForm.birth_date !== undefined) body.birth_date = editForm.birth_date || null
    if (editForm.id_number !== undefined) body.id_number = editForm.id_number
    try {
      const r = await fetch(`${API_BASE}/api/admin/recipients/${profile.id}/profile`, { method: 'PATCH', headers, body: JSON.stringify(body) })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.message || data.error || `HTTP ${r.status}`)
      setIsEditing(false)
      refetch()
      onTagUpdate?.()
      toast.success('הפרופיל עודכן')
    } catch (e) {
      toast.error(e.message || 'שגיאה בעדכון')
    }
  }

  const addTag = async () => {
    if (!newTag.trim() || !profile?.id || !businessId) return
    const tags = [...(profile.tags || []), newTag.trim()]
    try {
      await api.patchRecipientTags(profile.id, { tags, business_id: businessId })
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
    const tags = (profile.tags || []).filter(t => t !== tag)
    try {
      await api.patchRecipientTags(profile.id, { tags, business_id: businessId })
      refetch()
      onTagUpdate?.()
      toast.success('התגית הוסרה')
    } catch (e) {
      toast.error(e.message || 'שגיאה בהסרת תגית')
    }
  }

  if (!open) return null

  const fullName = profile?.first_name || profile?.last_name ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'לא צוין'
  const initials = fullName !== 'לא צוין' ? fullName.split(/\s+/).map(n => n[0]).join('').slice(0, 2) : (profile?.phone?.[0] || '?')
  const age = profile?.birth_date ? Math.floor((Date.now() - new Date(profile.birth_date)) / 31557600000) : null

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
              <div style={{ display: 'flex', gap: 4 }}>
                {!isEditing && (
                  <button onClick={startEdit} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }} title="עריכה"><Pencil size={18} /></button>
                )}
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
              </div>
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
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input className="form-input input" placeholder="שם פרטי" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} style={{ fontSize: 14, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }} />
                        <input className="form-input input" placeholder="שם משפחה" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} style={{ fontSize: 14, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }} />
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{fullName}</div>
                        <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={14} /> <span dir="ltr">{profile.phone || '—'}</span></div>
                      </>
                    )}
                  </div>
                </div>

                {/* שכבה 1 — פרטים בסיסיים */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>פרטים אישיים</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>מגדר</div>
                      {isEditing ? (
                        <select className="form-input input" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} style={{ width: '100%', fontSize: 13, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>
                          <option value="">לא צוין</option>
                          <option value="Male">זכר</option>
                          <option value="Female">נקבה</option>
                        </select>
                      ) : (
                        <div style={{ color: '#fff' }}>{profile.gender === 'Female' ? 'נקבה' : profile.gender === 'Male' ? 'זכר' : 'לא צוין'}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>גיל</div>
                      <div style={{ color: '#fff' }}>{age != null ? age : 'לא צוין'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>אימייל</div>
                      {isEditing ? (
                        <input type="email" className="form-input input" placeholder="אימייל" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', fontSize: 12, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }} />
                      ) : (
                        <div style={{ color: '#fff', fontSize: 12, wordBreak: 'break-all' }}>{profile.email || 'לא צוין'}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>תאריך לידה</div>
                      {isEditing ? (
                        <input type="date" className="form-input input" value={editForm.birth_date} onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))} style={{ width: '100%', fontSize: 13, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }} />
                      ) : (
                        <div style={{ color: '#fff' }}>{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('he-IL') : 'לא צוין'}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>ת.ז</div>
                      {isEditing ? (
                        <input className="form-input input" placeholder="תעודת זהות" value={editForm.id_number} onChange={e => setEditForm(f => ({ ...f, id_number: e.target.value }))} style={{ width: '100%', fontSize: 13, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }} />
                      ) : (
                        <div style={{ color: '#fff' }}>{profile.id_number || 'לא צוין'}</div>
                      )}
                    </div>
                    {profile.custom_data?.subscribed && (
                      <div>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>מנוי לדיוור</div>
                        <div style={{ color: '#fff' }}>{profile.custom_data.subscribed}</div>
                      </div>
                    )}
                    {profile.custom_data?.instagram_url && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: 'var(--v2-gray-500)', fontSize: 11, marginBottom: 2 }}>אינסטגרם</div>
                        <a href={profile.custom_data.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--v2-primary)', fontSize: 12, wordBreak: 'break-all' }}>{profile.custom_data.instagram_url}</a>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                      <button onClick={saveProfile} style={{ flex: 1, padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>שמור</button>
                      <button onClick={cancelEdit} style={{ padding: '10px 16px', background: 'transparent', color: 'var(--v2-gray-400)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer' }}>ביטול</button>
                    </div>
                  )}
                </div>

                {/* שכבה 2 — מונים Customer 360 */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>סיכום פעילות</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 13 }}>
                    {[
                      { label: 'קמפיינים שקיבל', value: profile.axess_data?.campaigns_received ?? profile.counters?.campaigns_received ?? 0 },
                      { label: 'פתח / לחץ', value: profile.axess_data?.campaigns_opened ?? profile.counters?.link_clicks ?? 0 },
                      { label: 'מימושי ולידטור', value: profile.axess_data?.redemptions ?? profile.counters?.redemptions ?? 0 },
                      { label: 'אירועים', value: profile.business_data?.total_events ?? profile.counters?.total_events ?? 0 },
                      { label: "סה״כ הוצאה", value: profile.business_data?.total_spent ?? profile.counters?.total_spent ?? 0, suffix: '₪', color: 'var(--v2-primary)' },
                      { label: 'Engagement', value: profile.axess_data?.engagement_score ?? profile.counters?.engagement_score ?? 0, color: 'var(--v2-primary)' },
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
                {(profile.activity_log ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-gray-400)', marginBottom: 10 }}>היסטוריית פעילות</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {(profile.activity_log || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                            background: item.activity_type === 'validator_redeemed' ? 'var(--v2-primary)' : item.activity_type === 'link_clicked' ? '#3b82f6' : item.activity_type === 'checkin' ? '#10b981' : '#94a3b8',
                          }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                              {eventLabels[item.activity_type] || item.activity_type}
                            </div>
                            {item.note && <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{item.note}</div>}
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-500)' }}>
                              {new Date(item.created_at).toLocaleDateString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}
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
                    onClick={() => {
                      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || '—'
                      navigate('/dashboard/new-campaign', { state: { preselectedRecipient: { phone: profile.phone, name } } })
                    }}>
                    📱 שלח SMS
                  </button>
                  <button style={{ padding: '12px 16px', background: 'transparent', color: 'var(--v2-gray-400)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => navigate('/dashboard/inbox', { state: { openConversation: profile.phone, openConversationName: fullName } })}>
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
  const [activeCategory, setActiveCategory] = useState('all_cat')
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
  const [bulkTagMode, setBulkTagMode] = useState('add') // 'add' | 'remove'
  const [bulkTag, setBulkTag] = useState('')
  const [bulkTagToRemove, setBulkTagToRemove] = useState('')
  const [showSaveSegmentModal, setShowSaveSegmentModal] = useState(false)
  const [saveSegmentName, setSaveSegmentName] = useState('')

  const [showFlowDropdown, setShowFlowDropdown] = useState(false)
  const [flowsList, setFlowsList] = useState([])
  const [selectedFlowForSend, setSelectedFlowForSend] = useState(null)
  const [flowSendBusy, setFlowSendBusy] = useState(false)

  const [liveHours, setLiveHours] = useState(3)
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [selectedEvents, setSelectedEvents] = useState([])
  const [eventSearch, setEventSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
    if (businessId) fetch(`${API_BASE}/api/admin/recipients/events-list?business_id=${businessId}`, { headers }).then(r => r.ok ? r.json() : {}).then(d => setEvents(d?.events || []))
  }, [session?.access_token, businessId])

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
    const payload = { filter: segment.id, business_id: businessId }
    if (segment.id === 'live') payload.liveHours = liveHours
    const r = await fetch(`${API_BASE}/api/admin/segments/historical`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify(payload),
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

  const runEventSegment = async () => {
    if (!selectedEvents?.length || !businessId || !session?.access_token) return
    setLoading(true)
    const headers = h()
    const byPhone = {}
    for (const ev of selectedEvents) {
      const r = await fetch(`${API_BASE}/api/admin/segments/historical`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: 'by_event', eventTitle: ev, business_id: businessId }),
      })
      const d = r.ok ? await r.json() : {}
      for (const rec of d?.recipients || []) {
        if (rec.phone && !byPhone[rec.phone]) byPhone[rec.phone] = rec
      }
    }
    setRecipients(Object.values(byPhone))
    setPage(1)
    setLoading(false)
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

  const canSaveAsSegment = recipients.length > 0 && (
    activeSegment === 'by_event' ||
    activeSegment === 'by_campaign' ||
    !!lastWhereClause
  )
  const defaultSaveSegmentName = activeSegment === 'by_event'
    ? (selectedEvents?.length ? selectedEvents.join(', ') : 'אירוע')
    : activeSegment === 'by_campaign'
      ? (campaigns.find(c => c.id === selectedCampaign)?.name || (campaigns.find(c => c.id === selectedCampaign)?.message || '').substring(0, 40) || 'קמפיין')
      : lastWhereClause
        ? (nlQuery?.substring(0, 40) || 'סגמנט AI')
        : ''

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
        .audience-search-row-spacer { display: none; }
        .segment-chip .segment-chip-tooltip {
          position: absolute;
          top: 6px;
          left: 6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--v2-gray-400);
          font-size: 11px;
          cursor: help;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        @media (max-width: 768px) {
          .audience-segment-chips {
            display: grid !important;
            grid-template-columns: repeat(3, 117px) !important;
            gap: 6px !important;
            padding: 8px !important;
            overflow-x: unset !important;
            flex-wrap: unset !important;
            margin: 0 auto !important;
            align-self: center !important;
          }
          .segment-chip {
            width: 117px !important;
            height: 117px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 14px 9px !important;
            text-align: center !important;
            position: relative !important;
            overflow: hidden !important;
            white-space: normal !important;
            justify-self: center !important;
            font-size: 14px !important;
          }
          .segment-chip svg { width: 24px !important; height: 24px !important; flex-shrink: 0 !important; }
          .audience-search-row {
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto auto auto !important;
            gap: 10px 12px !important;
            padding: 0 12px !important;
          }
          .audience-search-row-1 {
            grid-row: 1;
            grid-column: 1 / -1;
            display: flex !important;
            gap: 8px !important;
            align-items: stretch !important;
          }
          .audience-search-row-1 .btn-primary,
          .audience-search-row-1 .btn-ghost {
            min-width: 64px !important;
            flex-shrink: 0 !important;
            font-size: 14px !important;
          }
          .audience-search-row-1 .form-input {
            flex: 1 !important;
            font-size: 14px !important;
          }
          .audience-search-row-2-tags {
            grid-row: 2;
            grid-column: 1 / -1;
            justify-self: end;
            display: flex !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
          }
          .audience-search-row-spacer {
            display: block !important;
            grid-row: 3;
            grid-column: 1 / -1;
            min-height: 40px;
          }
          .audience-search-row-3 {
            grid-row: 4;
            grid-column: 1 / -1;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
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
          .segment-categories {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
        .segment-categories {
          display: flex;
          gap: 8px;
          padding-bottom: 12px;
          margin-bottom: 8px;
        }
        .category-btn {
          flex-shrink: 0;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
          background: var(--v2-dark-3);
          color: var(--v2-gray-400);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .category-btn:hover {
          border-color: var(--v2-primary);
          color: var(--v2-primary);
        }
        .category-btn.active {
          border-color: var(--v2-primary);
          background: rgba(0,195,122,0.12);
          color: var(--v2-primary);
        }
        @media (min-width: 769px) {
          .audience-event-select {
            background: var(--card2, var(--card)) !important;
            color: var(--text) !important;
            border: 1px solid var(--border) !important;
            border-radius: var(--radius-md);
          }
          .audience-event-select option {
            background: var(--card2, var(--card));
            color: var(--text);
          }
          .audience-event-select option:hover,
          .audience-event-select option:focus {
            background: var(--primary-dim, rgba(0,195,122,0.12)) !important;
            color: var(--v2-primary) !important;
          }
          .audience-search-row-3-count { display: none; }
          .audience-search-count-row { display: block; margin-top: 8px; }
        }
        @media (max-width: 768px) {
          .audience-search-count-row { display: none; }
        }
      `}</style>

      <div className="segment-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory === 'saved' ? (
        segments.saved?.length > 0 ? (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {segments.saved.map(seg => (
                <button key={seg.id} className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => runSaved(seg)}>
                  {seg.name} ({seg.use_count || 0})
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--v2-gray-500)', marginBottom: '16px' }}>אין סגמנטים שמורים</div>
        )
      ) : (
      <div className="audience-segment-chips" style={isMobile ? { gap: '8px', paddingBottom: '8px', marginBottom: '16px' } : { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', whiteSpace: 'nowrap' }}>
        {(activeCategory === 'all_cat' ? PRESET_SEGMENTS : PRESET_SEGMENTS.filter(s => s.category === activeCategory)).map(seg => {
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
              <div className="segment-chip-tooltip" title={seg.description}>?</div>
              <IconComp size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{seg.name}</span>
              {activeSegment === seg.id && (
                <button onClick={e => { e.stopPropagation(); addSegmentToSelection(seg.name); }} style={{ fontSize: '10px', marginRight: '4px', padding: '2px 6px', background: 'var(--v2-primary)', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}>+ הוסף</button>
              )}
            </div>
          )
        })}
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
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {!selectedCampaign ? 'בחר קמפיין' : (campaigns.find(c => c.id === selectedCampaign)?.name || (campaigns.find(c => c.id === selectedCampaign)?.message || '').substring(0, 40) || 'קמפיין נבחר')}
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--card)', padding: '4px 0' }}>
            {Array.isArray(campaigns)
              ? campaigns.filter(c => !campaignSearch || (c.name && c.name.includes(campaignSearch)) || (c.message && c.message.includes(campaignSearch))).map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--text)' }}>
                  <input type="radio" name="campaignSelect" checked={selectedCampaign === c.id} onChange={() => setSelectedCampaign(selectedCampaign === c.id ? '' : c.id)} />
                  <span>{c.name || (c.message || '').substring(0, 40)} — {new Date(c.sent_at || c.created_at).toLocaleDateString('he-IL')}</span>
                </label>
              ))
              : null}
          </div>
          {selectedCampaign && (
            <>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', marginBottom: '6px' }}>סינון:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  { val: 'all', label: 'הכל' },
                  { val: 'received', label: 'קיבלו' },
                  { val: 'clicked', label: 'לחצו' },
                  { val: 'redeemed', label: 'מימשו' },
                  { val: 'not_received', label: 'לא קיבלו' },
                ].map(f => (
                  <button
                    key={f.val}
                    type="button"
                    style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: campaignFilter === f.val ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: campaignFilter === f.val ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer' }}
                    onClick={() => setCampaignFilter(f.val)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => setSelectedCampaign('')}>נקה הכל</button>
            <button className="btn-primary" onClick={async () => {
              if (!selectedCampaign) return
              setLoading(true)
              const r = await fetch(`${API_BASE}/api/admin/segments/historical`, {
                method: 'POST',
                headers: h(),
                body: JSON.stringify({ filter: 'by_campaign', campaignId: selectedCampaign, campaignFilter, business_id: businessId }),
              })
              const d = r.ok ? await r.json() : {}
              setRecipients(d?.recipients || [])
              setPage(1)
              setLoading(false)
            }} disabled={loading || !selectedCampaign}>{loading ? '...' : 'הצג לקוחות'}</button>
          </div>
        </div>
      )}

      {activeSegment === 'by_event' && (
        <div className="glass-card" style={{ padding: '12px', marginBottom: '12px' }}>
          <input placeholder="🔍 חפש אירוע..." className="form-input input" style={{ marginBottom: '8px' }} value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {selectedEvents.length === 0 ? 'בחר אירועים' : selectedEvents.length === 1 ? selectedEvents[0] : `${selectedEvents.length} אירועים נבחרו`}
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--card)', padding: '4px 0' }}>
            {Array.isArray(events) ? events.filter(ev => !eventSearch || ev.toLowerCase().includes(eventSearch.toLowerCase())).map(ev => (
              <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--text)' }}>
                <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={e => setSelectedEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))} />
                <span>{ev}</span>
              </label>
            )) : null}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => setSelectedEvents([])}>נקה הכל</button>
            <button className="btn-primary" onClick={runEventSegment} disabled={loading || !selectedEvents.length}>{loading ? '...' : 'הצג לקוחות'}</button>
          </div>
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
            <div className="audience-search-row-1" style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input placeholder="🔍 חפש לפי שם או טלפון..." className="form-input input" style={{ flex: 1, minWidth: 180, fontSize: '13px' }} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              <button className={activeTag === 'הכל' ? 'btn-primary' : 'btn-ghost'} onClick={() => setActiveTag('הכל')}>הכל</button>
            </div>
            <div className="audience-search-row-2-tags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_TAGS.filter(t => t !== 'הכל').map(tag => (
                <button key={tag} onClick={() => { setActiveTag(tag); setPage(1) }} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: activeTag === tag ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: activeTag === tag ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer' }}>{tag}</button>
              ))}
            </div>
            <div className="audience-search-row-spacer" />
            <div className="audience-search-row-3">
              <div className="audience-search-row-3-count" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{loading ? 'טוען...' : <><strong style={{ color: 'var(--v2-primary)' }}>{filtered.length}</strong> לקוחות</>}</div>
              <select className="input audience-search-row-3-sort" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="score">מיין: ציון</option>
              <option value="campaigns">מיין: קמפיינים</option>
              <option value="name">מיין: שם</option>
            </select>
            </div>
          </div>
          <div className="audience-search-count-row" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{loading ? 'טוען...' : <><strong style={{ color: 'var(--v2-primary)' }}>{filtered.length}</strong> לקוחות</>}</div>
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
                      <EngagementScore score={r.axess_data?.engagement_score ?? r.score} size={40} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}><Phone size={11} /> {r.phone}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      {r.gender && (
                        <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
                          {r.gender === 'Female' ? '👩 נקבה' : r.gender === 'Male' ? '👨 זכר' : r.gender}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
                        {r.birth_date ? `${Math.floor((Date.now() - new Date(r.birth_date)) / 31557600000)} שנים` : 'גיל לא צוין'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {((r.tags ?? []).slice(0, 3)).map(tag => (
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
          <div style={{ position: 'relative' }}>
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={async () => { setShowFlowDropdown(!showFlowDropdown); if (!showFlowDropdown && session?.access_token && businessId) { const r = await fetch(`${API_BASE}/api/whatsapp/flows`, { headers: { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId } }); const d = r.ok ? await r.json() : {}; setFlowsList((d.flows || []).filter(x => x.meta_status === 'PUBLISHED')); } }}><Workflow size={16} /> שלח Flow</button>
            {showFlowDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowFlowDropdown(false)} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 220, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 151, padding: 6 }}>
                  {flowsList.length === 0 ? <div style={{ padding: 12, fontSize: 13, color: 'var(--v2-gray-400)' }}>אין Flows מפורסמים. צור בהגדרות → WhatsApp → Flows</div> : flowsList.map(flow => (
                    <button key={flow.id} type="button" disabled={flowSendBusy} style={{ display: 'block', width: '100%', padding: '10px 12px', textAlign: 'right', borderRadius: 6, border: 'none', background: 'transparent', color: '#fff', cursor: flowSendBusy ? 'not-allowed' : 'pointer', fontSize: 13 }} onClick={async () => {
                      setShowFlowDropdown(false)
                      const phones = recipients.map(r => r.phone).filter(Boolean)
                      if (!phones.length) { toast.error('אין נמענים בסגמנט'); return }
                      setFlowSendBusy(true)
                      try {
                        const r = await fetch(`${API_BASE}/api/whatsapp/flows/${flow.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }, body: JSON.stringify({ recipient_phones: phones }) })
                        const data = await r.json().catch(() => ({}))
                        if (!r.ok) throw new Error(data.error || 'שגיאה')
                        const ok = (data.results || []).filter(x => x.success).length
                        toast.success(`Flow נשלח ל-${ok}/${phones.length} נמענים`)
                      } catch (e) { toast.error(e.message || 'שגיאה בשליחה') }
                      setFlowSendBusy(false)
                    }}>
                      {flow.display_name || flow.flow_name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <ExportButton businessId={businessId} segment={activeSegment} label="📥 ייצוא CSV" />
          <button className="btn-ghost" onClick={() => { setShowBulkTagModal(true); setBulkTagMode('add'); setBulkTag(''); setBulkTagToRemove(''); }}>🏷️ תגיות לסגמנט</button>
          {canSaveAsSegment && (
            <button className="btn-ghost" onClick={() => { setSaveSegmentName(defaultSaveSegmentName); setShowSaveSegmentModal(true); }}>💾 שמור כסגמנט</button>
          )}
        </div>
      </div>

      {showSaveSegmentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowSaveSegmentModal(false)}>
          <div className="glass-card" style={{ padding: 20, width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>💾 שמור כסגמנט</div>
            <input
              className="form-input input"
              placeholder="שם הסגמנט"
              value={saveSegmentName}
              onChange={e => setSaveSegmentName(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: '10px 14px' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!saveSegmentName.trim()} onClick={async () => {
                try {
                  let body
                  if (activeSegment === 'by_event') {
                    body = { name: saveSegmentName.trim(), filter_type: 'by_event', filter_params: { eventTitles: selectedEvents }, recipient_count: recipients.length }
                  } else if (activeSegment === 'by_campaign') {
                    body = { name: saveSegmentName.trim(), filter_type: 'by_campaign', filter_params: { campaignId: selectedCampaign, campaignFilter }, recipient_count: recipients.length }
                  } else {
                    body = { name: saveSegmentName.trim(), whereClause: lastWhereClause, description: nlQuery, createdBy: 'ai', recipient_count: recipients.length }
                  }
                  const r = await fetch(`${API_BASE}/api/admin/segments`, { method: 'POST', headers: h(), body: JSON.stringify(body) })
                  const data = await r.json().catch(() => ({}))
                  if (!r.ok) throw new Error(data.message || data.error || `HTTP ${r.status}`)
                  setShowSaveSegmentModal(false)
                  setSaveSegmentName('')
                  toast.success('הסגמנט נשמר')
                  const segRes = await fetch(`${API_BASE}/api/admin/segments`, { headers: h() })
                  const segData = segRes.ok ? await segRes.json() : {}
                  setSegments(prev => ({ presets: PRESET_SEGMENTS, saved: segData?.saved || [] }))
                } catch (e) {
                  toast.error(e.message || 'שגיאה בשמירה')
                }
              }}>שמור</button>
              <button className="btn-ghost" onClick={() => { setShowSaveSegmentModal(false); setSaveSegmentName(''); }}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {showBulkTagModal && (() => {
        const segmentTags = [...new Set(recipients.flatMap(r => r.tags || []))].filter(Boolean).sort()
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowBulkTagModal(false)}>
          <div className="glass-card" style={{ padding: 20, width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>🏷️ תגיות ל-{recipients.length} לקוחות</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button type="button" onClick={() => setBulkTagMode('add')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: bulkTagMode === 'add' ? '2px solid var(--v2-primary)' : '1px solid var(--glass-border)', background: bulkTagMode === 'add' ? 'rgba(0,195,122,0.12)' : 'transparent', color: bulkTagMode === 'add' ? 'var(--v2-primary)' : 'var(--v2-gray-400)', fontWeight: 600, cursor: 'pointer' }}>הוסף תגית</button>
              <button type="button" onClick={() => setBulkTagMode('remove')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: bulkTagMode === 'remove' ? '2px solid var(--v2-primary)' : '1px solid var(--glass-border)', background: bulkTagMode === 'remove' ? 'rgba(0,195,122,0.12)' : 'transparent', color: bulkTagMode === 'remove' ? 'var(--v2-primary)' : 'var(--v2-gray-400)', fontWeight: 600, cursor: 'pointer' }}>הסר תגית</button>
            </div>
            {bulkTagMode === 'add' ? (
              <input
                className="form-input input"
                placeholder="שם התגית..."
                value={bulkTag}
                onChange={e => setBulkTag(e.target.value)}
                style={{ width: '100%', marginBottom: 12, padding: '10px 14px' }}
              />
            ) : (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-500)', marginBottom: 6, display: 'block' }}>בחר תגית להסרה</label>
                <select className="form-input input" value={bulkTagToRemove} onChange={e => setBulkTagToRemove(e.target.value)} style={{ width: '100%', padding: '10px 14px' }}>
                  <option value="">— בחר תגית —</option>
                  {segmentTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {segmentTags.length === 0 && <div style={{ fontSize: 12, color: 'var(--v2-gray-500)', marginTop: 6 }}>אין תגיות בסגמנט</div>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={bulkTagMode === 'add' ? !bulkTag.trim() : !bulkTagToRemove} onClick={async () => {
                const ids = recipients.map(r => r.master_recipient_id || r.id).filter(Boolean)
                const tagVal = bulkTagMode === 'add' ? bulkTag.trim() : bulkTagToRemove
                if (!tagVal || ids.length === 0) return
                try {
                  const endpoint = bulkTagMode === 'add' ? '/api/admin/recipients/bulk-tags' : '/api/admin/recipients/bulk-tags-remove'
                  const r = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'PATCH',
                    headers: h(),
                    body: JSON.stringify({ tag: tagVal, recipient_ids: ids, business_id: businessId }),
                  })
                  const data = await r.json().catch(() => ({}))
                  if (!r.ok) throw new Error(data.message || data.error || `HTTP ${r.status}`)
                  setShowBulkTagModal(false)
                  setBulkTag('')
                  setBulkTagToRemove('')
                  toast.success(bulkTagMode === 'add' ? `התגית נוספה ל-${recipients.length} לקוחות` : `התגית הוסרה מ-${recipients.length} לקוחות`)
                  fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(res => res.ok ? res.json() : {}).then(d => setRecipients(d?.recipients || []))
                } catch (e) {
                  toast.error(e.message || 'שגיאה')
                }
              }}>{bulkTagMode === 'add' ? 'הוסף' : 'הסר'}</button>
              <button className="btn-ghost" onClick={() => { setShowBulkTagModal(false); setBulkTag(''); setBulkTagToRemove(''); }}>ביטול</button>
            </div>
          </div>
        </div>
        )
      })()}

      <CustomerProfileDrawer open={!!selectedCustomerId} onClose={() => setSelectedCustomerId(null)} masterRecipientId={selectedCustomerId} businessId={businessId} onTagUpdate={() => fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || []))} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} businessId={businessId} onImportDone={() => { fetch(`${API_BASE}/api/admin/recipients`, { headers: h() }).then(r => r.ok ? r.json() : {}).then(d => setRecipients(d?.recipients || [])) }} />
    </div>
  )
}
