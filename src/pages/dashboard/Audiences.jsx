import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload, Crown, RefreshCw, Sparkles, CheckCircle, Radio, Scan, AlertTriangle, Ticket, Cake, Send, Calendar, Pencil, Workflow, Plus, Zap, Download, Save, Trash2, Filter, MessageCircle, MessageSquare, ChevronDown, Check } from 'lucide-react'
import EngagementScore from '@/components/ui/EngagementScore'
import EmptyState from '@/components/ui/EmptyState'
import ImportModal from '@/components/ui/ImportModal'
import ExportButton from '@/components/ui/ExportButton'
import { api } from '@/services/api'
import { fetchWithAuth } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRequirePermission } from '@/hooks/useRequirePermission'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'
import ContactTypesModal from '@/components/ui/ContactTypesModal'
import QuickEditDrawer from '@/components/ui/QuickEditDrawer'
import { ErrorBoundary } from 'react-error-boundary'
import RecipientsTable from '@/components/ui/RecipientsTable'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const MODAL_CLOSE_X = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--v2-gray-400)',
  padding: 4,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

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

const FILTER_LABELS = {
  gender: 'מגדר',
  age_min: 'גיל מינימום',
  age_max: 'גיל מקסימום',
  city: 'עיר',
  tags: 'תגיות',
  search: 'חיפוש',
}

function filterRecipientsByAudienceFilters(list, f) {
  if (!f || typeof f !== 'object' || !Object.keys(f).length) return list
  const searchQ = f.search ? String(f.search).trim() : ''
  const tag = Array.isArray(f.tags) && f.tags.length ? f.tags[0] : ''
  const gender = f.gender && f.gender !== 'all' ? String(f.gender) : ''
  const ageMinN = f.age_min != null && f.age_min !== '' ? Number(f.age_min) : null
  const ageMaxN = f.age_max != null && f.age_max !== '' ? Number(f.age_max) : null
  const city = f.city ? String(f.city).trim() : ''
  return list.filter((r) => {
    if (searchQ && !((r.name && String(r.name).includes(searchQ)) || (r.phone && String(r.phone).includes(searchQ)))) return false
    if (tag && !(Array.isArray(r.tags) && r.tags.includes(tag))) return false
    if (gender && String(r.gender || '') !== gender) return false
    if ((ageMinN != null && !Number.isNaN(ageMinN)) || (ageMaxN != null && !Number.isNaN(ageMaxN))) {
      if (!r.birth_date) return false
      const age = Math.floor((Date.now() - new Date(r.birth_date)) / 31557600000)
      if (ageMinN != null && !Number.isNaN(ageMinN) && age < ageMinN) return false
      if (ageMaxN != null && !Number.isNaN(ageMaxN) && age > ageMaxN) return false
    }
    if (city && r.city && !String(r.city).includes(city)) return false
    return true
  })
}

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
    const body = { business_id: businessId }
    if (editForm.first_name !== undefined) body.first_name = editForm.first_name
    if (editForm.last_name !== undefined) body.last_name = editForm.last_name
    if (editForm.email !== undefined) body.email = editForm.email
    if (editForm.gender !== undefined) body.gender = editForm.gender || null
    if (editForm.birth_date !== undefined) body.birth_date = editForm.birth_date || null
    if (editForm.id_number !== undefined) body.id_number = editForm.id_number
    try {
      const data = await fetchWithAuth(
        `/api/admin/recipients/${profile.id}/profile`,
        { method: 'PATCH', body: JSON.stringify(body) }
      ).catch(() => ({}))
      if (!data || data.error) throw new Error(
        data?.message || data?.error || 'שגיאה בעדכון'
      )
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
            position: 'relative',
            width: 'min(420px, 100vw)', maxWidth: '100%', background: 'var(--v2-dark-2)', borderRight: '1px solid var(--glass-border)',
            overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          }}
        >
          <button type="button" onClick={onClose} style={MODAL_CLOSE_X} aria-label="סגור">
            <X size={20} />
          </button>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: '#ffffff' }}>כרטיס לקוח</h2>
              <div style={{ display: 'flex', gap: 4 }}>
                {!isEditing && (
                  <button onClick={startEdit} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }} title="עריכה"><Pencil size={18} /></button>
                )}
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
                        <CustomSelect
                          className="form-input input"
                          value={editForm.gender}
                          onChange={(val) => setEditForm(f => ({ ...f, gender: val }))}
                          style={{ width: '100%', fontSize: 13, background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: 8 }}
                          placeholder="לא צוין"
                          options={[
                            { value: '', label: 'לא צוין' },
                            { value: 'Male', label: 'זכר' },
                            { value: 'Female', label: 'נקבה' },
                          ]}
                        />
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
  const audiencesAllowed = useRequirePermission('can_view_audiences')
  const navigate = useNavigate()
  const { session, businessId } = useAuth()
  const queryClient = useQueryClient()

  const savedAudiencesState = (() => {
    try { return JSON.parse(sessionStorage.getItem('audiences_state') || '{}') }
    catch { return {} }
  })()

  useEffect(() => {
    console.log('[Audiences] businessId:', businessId)
  }, [businessId])

  // אותו business_id ש-fetchWithAuth שולח ב-X-Business-Id (כולל impersonate)
  const apiBusinessId = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('axess_impersonate')
      if (raw) {
        const id = JSON.parse(raw)?.business?.id
        if (id) return id
      }
    } catch {}
    return businessId
  }, [businessId])

  const [activeSegment, setActiveSegment] = useState(savedAudiencesState.activeSegment || 'all')
  const [activeCategory, setActiveCategory] = useState(savedAudiencesState.activeCategory || 'all_cat')
  const [selectedSegments, setSelectedSegments] = useState([])
  const [segmentSearch, setSegmentSearch] = useState('')
  const [selectedSavedSegments, setSelectedSavedSegments] = useState([])
  const [activeSegmentName, setActiveSegmentName] = useState('')
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [recipients, setRecipients] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [segments, setSegments] = useState({ presets: PRESET_SEGMENTS, saved: [] })
  const [loading, setLoading] = useState(false)
  const [loadingRecipients, setLoadingRecipients] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [nlQuery, setNlQuery] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [lastWhereClause, setLastWhereClause] = useState('')
  const [search, setSearch] = useState(savedAudiencesState.search || '')
  const [searchResults, setSearchResults] = useState(savedAudiencesState.searchResults ?? null)
  const [searchTotalCount, setSearchTotalCount] = useState(0)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)
  const [searchScope, setSearchScope] = useState(savedAudiencesState.searchScope || {
    name: true,
    phone: true,
    tags: true,
    notes: true,
    contact_types: true,
    segments: false,
  })
  const [searchScopeOpen, setSearchScopeOpen] = useState(false)
  const [scopeSegments, setScopeSegments] = useState(savedAudiencesState.scopeSegments || [])
  const [activeTag, setActiveTag] = useState(savedAudiencesState.activeTag || 'הכל')
  const [genderFilter, setGenderFilter] = useState('all')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState(savedAudiencesState.sortBy || '')
  const [bulkCity, setBulkCity] = useState('')
  const [showContactTypeDropdown, setShowContactTypeDropdown] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)
  const [bulkTagMode, setBulkTagMode] = useState('add') // 'add' | 'remove'
  const [bulkTag, setBulkTag] = useState('')
  const [bulkTagToRemove, setBulkTagToRemove] = useState('')
  const [showSaveSegment, setShowSaveSegment] = useState(false)
  const [segmentName, setSegmentName] = useState('')

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
  const [page, setPage] = useState(savedAudiencesState.page || 1)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [showContactTypesModal, setShowContactTypesModal] = useState(false)
  const [quickEditRecipient, setQuickEditRecipient] = useState(null)
  const [contactTypes, setContactTypes] = useState([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [addForm, setAddForm] = useState({ phone: '', first_name: '', last_name: '', email: '', gender: '', city: '', contact_types: [] })
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeData, setMergeData] = useState(null)
  const [merging, setMerging] = useState(false)
  const [mergeResult, setMergeResult] = useState(null)

  const swapPrimary = (groupIndex) => {
    setMergeData((prev) => {
      if (!prev?.duplicates?.length) return prev
      const newDuplicates = [...prev.duplicates]
      const group = { ...newDuplicates[groupIndex] }
      if (!group.duplicates?.length) return prev
      const oldPrimary = group.primary
      group.primary = group.duplicates[0]
      group.duplicates = [oldPrimary, ...group.duplicates.slice(1)]
      newDuplicates[groupIndex] = group
      return { ...prev, duplicates: newDuplicates }
    })
  }

  const [contactTypeFilter, setContactTypeFilter] = useState(savedAudiencesState.contactTypeFilter || [])
  const [bulkField, setBulkField] = useState({
    newTag: '',
    removeTag: '',
    contactType: '',
    segment: '',
    eventTitle: '',
    eventDate: '',
  })
  const [showBulkEditPanel, setShowBulkEditPanel] = useState(false)
  const [applyToAll, setApplyToAll] = useState(false)
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('audiences_view')
  }
  const [viewMode, setViewMode] = useState(
    localStorage.getItem('audiences_view') === 'table' ? 'cards' :
    localStorage.getItem('audiences_view') || 'cards',
  )

  const switchView = (mode) => {
    setViewMode(mode)
    localStorage.setItem('audiences_view', mode)
    if (mode === 'table') {
      setSelectMode(true)
    } else {
      setSelectMode(false)
      setSelectedIds(new Set())
    }
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadRecipients = async () => {
    try {
      setLoading(true)
      setLoadingRecipients(true)

      const first = await fetchWithAuth('/api/admin/recipients?limit=2000')
      setRecipients(first.recipients || [])
      setSearchResults(prev => (Array.isArray(prev) && prev.length === 0) ? null : prev)
      setTotalCount(first.total || 0)
      setLoadedCount(first.loaded || 0)
      if (first.has_more !== undefined) setHasMore(first.has_more)
      setLoadError(null)
      setLoading(false)
      setLoadingRecipients(false)

      if (first.has_more) {
        const all = await fetchWithAuth(`/api/admin/recipients?limit=${first.total}`)
        if (all.recipients) {
          setRecipients(all.recipients)
          setLoadedCount(all.loaded || all.recipients.length)
          setHasMore(false)
        }
      }
    } catch (e) {
      console.error('[loadRecipients]', e.message)
      setLoadError('שגיאה בטעינת נתונים — נסה לרענן')
      setLoading(false)
      setLoadingRecipients(false)
    }
  }

  const refreshRecipients = loadRecipients

  const { data: segmentsData } = useQuery({
    queryKey: ['segments', businessId],
    queryFn: () =>
      fetchWithAuth(
        `/api/admin/segments`
      ),
    staleTime: 1000 * 60 * 5,
    enabled: !!businessId && !!session?.access_token,
  })

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', businessId],
    queryFn: () =>
      fetchWithAuth(
        `/api/admin/campaigns?limit=100&business_id=${businessId}`
      ),
    staleTime: 1000 * 60 * 3,
    enabled: !!businessId && !!session?.access_token,
  })

  const { data: eventsData } = useQuery({
    queryKey: ['events', businessId],
    queryFn: () =>
      fetchWithAuth(
        `/api/admin/recipients/events-list?business_id=${businessId}`
      ),
    staleTime: 1000 * 60 * 5,
    enabled: !!businessId && !!session?.access_token,
  })

  useEffect(() => {
    if (!businessId || !session?.access_token) {
      setLoadingRecipients(false)
      return
    }
    loadRecipients()
    fetchWithAuth(`/api/admin/contact-types?business_id=${businessId}`)
      .then(d => Array.isArray(d) && setContactTypes(d))
      .catch(() => {})
  }, [businessId, session?.access_token])

  useEffect(() => {
    try {
      const stateToSave = {
        search,
        activeTag,
        contactTypeFilter,
        activeSegment,
        activeCategory,
        page,
        searchResults: searchResults?.length > 0 ? searchResults : null,
        searchScope,
        scopeSegments,
        sortBy,
      }
      sessionStorage.setItem('audiences_state', JSON.stringify(stateToSave))
    } catch {}
  }, [search, activeTag, contactTypeFilter, activeSegment, activeCategory, page, searchResults, searchScope, scopeSegments, sortBy])

  useEffect(() => {
    const handler = () => setShowContactTypeDropdown(false)
    if (showContactTypeDropdown) document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showContactTypeDropdown])

  const handleSortChange = (val) => {
    setSortBy(val)
    try {
      const state = JSON.parse(sessionStorage.getItem('audiences_state') || '{}')
      sessionStorage.setItem('audiences_state', JSON.stringify({ ...state, sortBy: val }))
    } catch {}
  }

  useEffect(() => {
    if (segmentsData) {
      setSegments({ presets: PRESET_SEGMENTS, saved: segmentsData?.saved || [] })
    }
  }, [segmentsData])

  useEffect(() => {
    if (campaignsData) {
      setCampaigns(campaignsData?.campaigns || campaignsData || [])
    }
  }, [campaignsData])

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData?.events || eventsData || [])
    }
  }, [eventsData])

  const runPreset = async (segment) => {
    setActiveSegment(segment.id)
    if (segment.id === 'all') {
      await refreshRecipients()
      setPage(1)
      return
    }
    if (segment.id === 'by_campaign' || segment.id === 'by_event') return
    setLoading(true)
    const payload = { filter: segment.id, business_id: businessId }
    if (segment.id === 'live') payload.liveHours = liveHours
    const r = await fetchWithAuth(
      `/api/admin/segments/historical`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
    const data = r || {}
    setRecipients(data?.recipients || [])
    setPage(1)
    setLoading(false)
  }

  const runSaved = async (seg) => {
    if (!businessId || !session?.access_token) return
    setLoading(true)
    setActiveSegment(seg.id)
    try {
      const r = await fetchWithAuth(
        `/api/admin/segments/${seg.id}/run`,
        { method: 'POST' },
      )
      const data = r || {}
      setRecipients(data?.recipients || [])
      setPage(1)
    } catch (e) {
      console.error('[runSaved]', e.message)
    } finally {
      setLoading(false)
    }
  }

  const runAI = async () => {
    if (!nlQuery.trim() || !businessId || !session?.access_token) return
    setLoading(true)
    const r = await fetchWithAuth(
      `/api/admin/segments/ai`,
      {
        method: 'POST',
        body: JSON.stringify({ query: nlQuery }),
      }
    )
    const data = r || {}
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
    const results = await Promise.all(
      selectedEvents.map(ev =>
        fetchWithAuth(
          `/api/admin/segments/historical`,
          {
            method: 'POST',
            body: JSON.stringify({ filter: 'by_event', eventTitle: ev, business_id: businessId }),
          },
        ).catch(() => ({}))
      )
    )
    const byPhone = {}
    for (const d of results) {
      for (const rec of d?.recipients || []) {
        if (rec.phone && !byPhone[rec.phone]) byPhone[rec.phone] = rec
      }
    }
    setRecipients(Object.values(byPhone))
    setPage(1)
    setLoading(false)
  }

  const applySegmentFilters = (seg) => {
    const f = seg.filters && typeof seg.filters === 'object' ? seg.filters : {}
    if (f.gender) setGenderFilter(f.gender)
    else setGenderFilter('all')
    if (f.age_min != null && f.age_min !== '') setAgeMin(String(f.age_min))
    else setAgeMin('')
    if (f.age_max != null && f.age_max !== '') setAgeMax(String(f.age_max))
    else setAgeMax('')
    if (f.city) setCityFilter(String(f.city))
    else setCityFilter('')
    if (f.tags?.[0]) {
      setTagFilter(f.tags[0])
      setActiveTag(f.tags[0])
    } else {
      setTagFilter('')
      setActiveTag('הכל')
    }
    if (f.search) setSearch(String(f.search))
    else setSearch('')
    setActiveCategory('all_cat')
    setPage(1)
  }

  const deleteSegment = async (id) => {
    try {
      await fetchWithAuth(
        `/api/audiences/segments/${id}`,
        { method: 'DELETE' }
      )
      queryClient.invalidateQueries({ queryKey: ['segments', businessId] })
      const segData = await fetchWithAuth(
        `/api/admin/segments`
      ).catch(() => ({}))
      setSegments({ presets: PRESET_SEGMENTS, saved: segData?.saved || [] })
      toast.success('סגמנט נמחק')
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const sendToSegment = (seg) => {
    const phones = filterRecipientsByAudienceFilters(recipients, seg.filters || {}).map((r) => r.phone).filter(Boolean)
    if (!phones.length) {
      toast.error('אין נמענים תואמים')
      return
    }
    sessionStorage.setItem('campaign_recipients', JSON.stringify(phones))
    sessionStorage.setItem('campaign_segment_name', seg.name || '')
    navigate('/dashboard/new-campaign')
  }

  const resetToAll = () => {
    setSearchResults(null)
    setActiveSegment('all')
    setActiveCategory('all_cat')
    setGenderFilter('all')
    setActiveTag('הכל')
    setTagFilter('')
    setContactTypeFilter([])
    setAgeMin('')
    setAgeMax('')
    setCityFilter('')
    setSearch('')
    setPage(1)
    refreshRecipients()
  }

  const bulkUpdate = async (action, value) => {
    if (applyToAll) {
      const activeFilter = {
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        gender_null: genderFilter === 'unknown' ? true : undefined,
        tag: activeTag !== 'הכל' ? activeTag : undefined,
        contact_type: contactTypeFilter.length === 1 ? contactTypeFilter[0] : undefined,
        ids: searchResults ? searchResults.map(r => r.id) : undefined,
      }
      try {
        const result = await fetchWithAuth('/api/admin/recipients/bulk-update-filtered', {
          method: 'POST',
          body: JSON.stringify({ action, value, filter: activeFilter }),
        })
        console.log(`[bulk-filtered] ${action} על ${result.affected} רשומות`)
        if (action === 'set_gender') {
          queryClient.invalidateQueries({ queryKey: ['segments', businessId] })
        }
      } catch (e) {
        console.error('[bulk-filtered] שגיאה:', e.message)
      } finally {
        setSelectedIds(new Set())
        setSelectMode(false)
        setShowBulkEditPanel(false)
        setApplyToAll(false)
        resetToAll()
      }
      return
    }

    const ids = [...selectedIds]
    if (ids.length === 0) return

    try {
      const result = await fetchWithAuth('/api/admin/recipients/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ ids, action, value, business_id: businessId }),
      })
      console.log(`[bulk] ${action} על ${result.affected} רשומות`)
      if (action === 'set_gender') {
        queryClient.invalidateQueries({ queryKey: ['segments', businessId] })
      }
    } catch (e) {
      console.error('[bulk] שגיאה:', e.message)
    } finally {
      setSelectedIds(new Set())
      setSelectMode(false)
      setShowBulkEditPanel(false)
      resetToAll()
    }
  }

  const clientSearch = useMemo(() => {
    if (!search || search.length < 2) return null

    const isSimpleSearch = !searchScope.tags &&
      !searchScope.notes &&
      !searchScope.contact_types

    if (!isSimpleSearch) return null

    const q = search.toLowerCase().trim()
    return recipients.filter(r => {
      if (searchScope.name) {
        const name = (r.name || '').toLowerCase()
        if (name.includes(q)) return true
      }
      if (searchScope.phone) {
        const phone = (r.phone || '')
        if (phone.includes(q)) return true
      }
      return false
    })
  }, [search, recipients, searchScope])

  const baseList = clientSearch !== null
    ? clientSearch
    : searchResults !== null
      ? searchResults
      : recipients

  const filtered = baseList
    .filter((r) => {
      if (searchResults !== null || clientSearch !== null) return true
      if (search.trim()) {
        const s = search.toLowerCase()
        const name = (r.name || '').toLowerCase()
        const phone = (r.phone || '')
        if (!name.includes(s) && !phone.includes(s)) return false
      }
      return true
    })
    .filter((r) => {
      const effectiveTag = tagFilter || (activeTag !== 'הכל' ? activeTag : '')
      const matchTag = !effectiveTag || (Array.isArray(r.tags) && r.tags.includes(effectiveTag))
      const matchGender = !genderFilter || genderFilter === 'all' || String(r.gender || '') === genderFilter
      let matchAge = true
      const minN = ageMin !== '' && ageMin != null ? Number(ageMin) : null
      const maxN = ageMax !== '' && ageMax != null ? Number(ageMax) : null
      if ((minN != null && !Number.isNaN(minN)) || (maxN != null && !Number.isNaN(maxN))) {
        if (!r.birth_date) matchAge = false
        else {
          const age = Math.floor((Date.now() - new Date(r.birth_date)) / 31557600000)
          if (minN != null && !Number.isNaN(minN) && age < minN) matchAge = false
          if (maxN != null && !Number.isNaN(maxN) && age > maxN) matchAge = false
        }
      }
      const matchCity = !cityFilter || (r.city && String(r.city).includes(String(cityFilter).trim()))
      return matchTag && matchGender && matchAge && matchCity
    })
    .filter((r) => {
      if (contactTypeFilter.length === 0) return true
      return contactTypeFilter.every(ct => (r.contact_types || []).includes(ct))
    })
    .sort((a, b) => {
      if (!sortBy) return 0
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
      if (sortBy === 'campaigns') return (b.campaigns || 0) - (a.campaigns || 0)
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'he')
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'he')
      return 0
    })

  const filteredCount = useMemo(() => {
    if (searchResults) return searchResults.length

    const hasActiveFilter = genderFilter !== 'all' ||
      activeTag !== 'הכל' ||
      contactTypeFilter.length > 0

    if (!hasActiveFilter) return totalCount || recipients.length

    return filtered.length
  }, [searchResults, filtered, genderFilter, activeTag, contactTypeFilter, totalCount, recipients])

  const PER_PAGE = 100
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const ALL_TAGS = ['הכל', 'VIP', 'לקוח קבוע', 'חדש']

  if (!audiencesAllowed) return null

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir="rtl">

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>קהלים</h1>
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{loadingRecipients ? 'טוען...' : `${(totalCount || recipients.length).toLocaleString()} אנשי קשר`}</p>
        </div>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', paddingBottom: '4px',
        }}>
          <button
            type="button"
            onClick={() => setShowAddContact(true)}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              border: '1px solid #00C37A', background: '#00C37A20',
              color: '#00C37A', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
            }}
          >
            + איש קשר
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none',
              borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Upload size={16} /> ייבוא קהל
          </button>
          <div style={{ flexShrink: 0 }}>
            <ExportButton businessId={businessId} segment="all" label="ייצוא" />
          </div>
          <button
            type="button"
            onClick={async () => {
              const data = await fetchWithAuth('/api/admin/recipients/duplicate-phones')
              if (data?.error) {
                alert(data.error)
                return
              }
              if (!data?.duplicates?.length) {
                alert('לא נמצאו כפילויות!')
                return
              }
              setMergeData(data)
              setMergeResult(null)
              setShowMergeModal(true)
            }}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
            }}
          >
            🔀 מזג כפילויות
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '20px', borderRight: '3px solid var(--v2-primary)' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--v2-primary)' }}>קהלים</strong> — בחר סגמנט מוכן או צור פילוח חכם בשפה חופשית.
          ניתן לשלב מספר סגמנטים יחד, לשמור אותם לשימוש חוזר, ולשלוח קמפיין ישירות מכאן.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
          .saved-segments-tab {
            display: block !important;
            width: 100%;
            overflow: visible;
            visibility: visible;
          }
          .saved-segments-tab .saved-segment-card {
            display: block !important;
            visibility: visible !important;
          }
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

      {activeCategory === 'saved' && (
        <div className="saved-segments-tab">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={segmentSearch}
              onChange={e => setSegmentSearch(e.target.value)}
              placeholder="חפש סגמנט..."
              style={{
                flex: 1, background: 'var(--card)',
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: '8px 12px', color: 'var(--text)',
                fontSize: '13px', direction: 'rtl', outline: 'none'
              }}
            />
          </div>

          {selectedSavedSegments.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={async () => {
                  setLoadingSegments(true)
                  try {
                    const allResults = []
                    const segmentNames = []

                    for (const segId of selectedSavedSegments) {
                      const seg = segments.saved?.find(s => s.id === segId)
                      if (seg) segmentNames.push(seg.name)

                      try {
                        const result = await fetchWithAuth(
                          `/api/admin/segments/${segId}/run`,
                          { method: 'POST', body: JSON.stringify({ business_id: businessId }) }
                        )
                        if (result?.recipients) allResults.push(...result.recipients)
                      } catch (e) {
                        console.error('[merge segments]', e.message)
                      }
                    }

                    const unique = Array.from(
                      new Map(allResults.map(r => [r.id, r])).values()
                    )

                    setSearchResults(unique)
                    setActiveSegmentName(segmentNames.join(' + '))
                    setSelectedSavedSegments([])

                    setTimeout(() => {
                      document.getElementById('recipients-grid')?.scrollIntoView({ behavior: 'smooth' })
                    }, 300)
                  } finally {
                    setLoadingSegments(false)
                  }
                }}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: '10px',
                  background: '#00C37A', border: 'none',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                }}>
                הצג {selectedSavedSegments.length} סגמנטים
              </button>
              <button
                type="button"
                onClick={() => setSelectedSavedSegments([])}
                style={{
                  padding: '8px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '13px',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                }}>
                נקה
              </button>
            </div>
          )}

          {activeSegmentName && searchResults && (
            <div style={{
              padding: '8px 12px', marginBottom: '8px',
              background: '#00C37A15', borderRadius: '8px',
              border: '1px solid #00C37A40',
              fontSize: '13px', color: '#00C37A',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>מוצג: {activeSegmentName}</span>
              <button
                type="button"
                onClick={() => { setSearchResults(null); setActiveSegmentName('') }}
                style={{
                  background: 'none', border: 'none', color: '#00C37A',
                  cursor: 'pointer', fontSize: '12px',
                  WebkitTapHighlightColor: 'transparent'
                }}>
                ✕ נקה
              </button>
            </div>
          )}

          {loadingSegments && (
            <div style={{
              textAlign: 'center', padding: '16px',
              color: 'var(--text-secondary)', fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                border: '2px solid #00C37A', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }} />
              טוען סגמנטים...
            </div>
          )}

          {segments.saved?.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: 'var(--text-secondary)', fontSize: '14px'
            }}>
              אין סגמנטים שמורים עדיין
            </div>
          ) : (
          <div style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            {segments.saved
              ?.filter(seg =>
                !segmentSearch ||
                seg.name?.toLowerCase().includes(segmentSearch.toLowerCase())
              )
              .map(seg => {
                const isSelected = selectedSavedSegments.includes(seg.id)
                return (
                  <div key={seg.id} className="saved-segment-card" style={{
                    background: 'var(--card)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${isSelected ? '#00C37A' : 'var(--glass-border)'}`,
                    marginBottom: '12px',
                    direction: 'rtl',
                    transition: 'border-color 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div
                        onClick={() => setSelectedSavedSegments(p =>
                          isSelected ? p.filter(id => id !== seg.id) : [...p, seg.id]
                        )}
                        style={{
                          width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                          border: `2px solid ${isSelected ? '#00C37A' : '#ffffff60'}`,
                          background: isSelected ? '#00C37A' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', WebkitTapHighlightColor: 'transparent'
                        }}>
                        {isSelected && <Check size={13} color="#fff" />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {seg.is_system && (
                            <span style={{
                              fontSize: '10px', color: '#00C37A',
                              border: '1px solid #00C37A40', borderRadius: '4px',
                              padding: '1px 5px'
                            }}>מערכת</span>
                          )}
                          {seg.name}
                        </div>
                        {seg.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {seg.description}
                          </div>
                        )}
                      </div>

                      {seg.recipient_count > 0 && (
                        <div style={{ fontSize: '13px', color: '#00C37A', fontWeight: 600, flexShrink: 0 }}>
                          {seg.recipient_count.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          const hasSavedFilters = seg.type === 'saved_audience' ||
                            (seg.filters && Object.keys(seg.filters).length > 0)
                          if (hasSavedFilters) applySegmentFilters(seg)
                          else runSaved(seg)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text)', cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                        {seg.type === 'saved_audience' ||
                        (seg.filters && Object.keys(seg.filters).length > 0)
                          ? 'החל פילטרים' : 'טען רשימה'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setSearchResults(null)
                          if (seg.filters?.recipient_ids?.length > 0) {
                            const result = await fetchWithAuth(
                              `/api/admin/recipients/search?ids=${seg.filters.recipient_ids.slice(0, 500).join(',')}`
                            )
                            setSearchResults(result)
                          } else {
                            await runSaved(seg)
                          }
                          setTimeout(() => {
                            document.getElementById('recipients-grid')?.scrollIntoView({ behavior: 'smooth' })
                          }, 600)
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                          border: '1px solid #00C37A', background: '#00C37A15',
                          color: '#00C37A', cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                        הצג קהל
                      </button>

                      <button
                        type="button"
                        onClick={() => sendToSegment(seg)}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text)', cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                        שלח קמפיין
                      </button>

                      {!seg.is_system && (
                        <button
                          type="button"
                          onClick={() => deleteSegment(seg.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                            border: '1px solid #ef444440', background: 'transparent',
                            color: '#ef4444', cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent'
                          }}>
                          מחק
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
          )}
        </div>
      )}

      {activeCategory !== 'saved' && (
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
                  headers: { 'Content-Type': 'application/json', 'X-Business-Id': businessId || '', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
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
              <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(ev)}
                  onChange={e => setSelectedEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                  style={{ accentColor: '#00C37A' }}
                />
                <span style={{ flex: 1, fontSize: '13px' }}>{ev}</span>
                <button
                  type="button"
                  onClick={async e => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!window.confirm(`למחוק את האירוע "${ev}" מכל הקהל?`)) return
                    try {
                      await fetchWithAuth('/api/admin/recipients/events-list', {
                        method: 'DELETE',
                        body: JSON.stringify({ event_title: ev }),
                      })
                      queryClient.invalidateQueries({ queryKey: ['events', businessId] })
                      setSelectedEvents(prev => prev.filter(x => x !== ev))
                    } catch (err) {
                      console.error('delete event error:', err)
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ef444460', padding: '2px 4px', borderRadius: '4px',
                    fontSize: '14px', lineHeight: 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#ef444460' }}
                  title={`מחק אירוע "${ev}"`}
                >
                  🗑
                </button>
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
            <button
              className="btn-primary"
              onClick={async () => {
                await fetchWithAuth(
                  `/api/admin/segments`,
                  { method: 'POST', body: JSON.stringify({ name: saveName, whereClause: lastWhereClause, createdBy: 'ai', description: nlQuery }) },
                )
                setShowSaveModal(false)
                setSaveName('')
                const r = await fetchWithAuth(
                  `/api/admin/segments`,
                )
                const d = r || {}
                setSegments({ presets: PRESET_SEGMENTS, saved: d?.saved || [] })
              }}
            >
              שמור
            </button>
            <button className="btn-ghost" onClick={() => setShowSaveModal(false)}>דלג</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          {/* Row 1: search + הכל */}
          <div className="audience-search-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div className="audience-search-row-1" style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* שורת חיפוש חכמה */}
              <div style={{ position: 'relative', marginBottom: '12px', flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '16px' }}>🔍</span>
                    <input
                      id="audiences-search-input"
                      value={search}
                      onChange={e => {
                        const val = e.target.value
                        setSearch(val)
                        setPage(1)
                        if (searchTimeout.current) clearTimeout(searchTimeout.current)
                        if (val.trim().length < 2) {
                          setSearchResults(null)
                          return
                        }
                        const isSimpleSearch = !searchScope.tags &&
                          !searchScope.notes &&
                          !searchScope.contact_types
                        if (isSimpleSearch) {
                          setSearchResults(null)
                          return
                        }
                        searchTimeout.current = setTimeout(async () => {
                          setSearching(true)
                          try {
                            const params = new URLSearchParams({ q: val.trim() })
                            if (!searchScope.name) params.append('skip_name', '1')
                            if (!searchScope.phone) params.append('skip_phone', '1')
                            if (!searchScope.tags) params.append('skip_tags', '1')
                            if (!searchScope.notes) params.append('skip_notes', '1')
                            if (!searchScope.contact_types) params.append('skip_contact_types', '1')
                            if (scopeSegments.length > 0) params.append('segment_ids', scopeSegments.join(','))
                            const data = await fetchWithAuth(`/api/admin/recipients/search?${params}`)
                            if (data?.results) {
                              setSearchResults(data.results)
                              setSearchTotalCount(data.total_count || data.results.length)
                            } else {
                              setSearchResults(data)
                              setSearchTotalCount(data?.length || 0)
                            }
                          } catch (err) {
                            console.error('search error:', err)
                          } finally {
                            setSearching(false)
                          }
                        }, 300)
                      }}
                      placeholder="חפש..."
                      style={{
                        width: '100%', padding: '10px 40px 10px 12px',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '10px', color: 'var(--text)', fontSize: '14px',
                        direction: 'rtl',
                      }}
                    />
                    {searching && (
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        מחפש...
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchScopeOpen(p => !p)}
                    style={{
                      padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                      border: `1px solid ${searchScopeOpen ? '#00C37A' : 'var(--border)'}`,
                      background: searchScopeOpen ? '#00C37A20' : 'var(--bg)',
                      color: searchScopeOpen ? '#00C37A' : 'var(--text-secondary)',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {Object.values(searchScope).every(Boolean) ? 'בכולם ▼' : 'מסונן ▼'}
                  </button>
                </div>
                {clientSearch !== null && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 8px', textAlign: 'right' }}>
                    נמצאו {clientSearch.length.toLocaleString()} תוצאות
                  </div>
                )}
                {searchResults !== null && searchTotalCount > 0 && (
                  <div style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    textAlign: 'right', padding: '4px 8px'
                  }}>
                    נמצאו {searchTotalCount.toLocaleString()} תוצאות
                    {searchTotalCount > 500 && (
                      <span style={{ color: '#f59e0b', marginRight: '4px' }}>
                        (מוצגות 500 הראשונות)
                      </span>
                    )}
                  </div>
                )}
                {searchScopeOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '12px', zIndex: 100,
                    marginTop: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  }}
                  >
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 600 }}>חפש ב:</p>
                    {[
                      { key: 'name', label: '👤 שם ופרטים' },
                      { key: 'phone', label: '📱 טלפון' },
                      { key: 'tags', label: '🏷️ תגיות' },
                      { key: 'notes', label: '📝 הערות פנימיות' },
                      { key: 'contact_types', label: '🎯 סוגי קשר' },
                      { key: 'segments', label: '📁 סגמנטים שמורים' },
                    ].map(item => (
                      <div key={item.key}>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '6px 4px', cursor: 'pointer', fontSize: '13px',
                          color: 'var(--text)',
                        }}
                        >
                          <input
                            type="checkbox"
                            checked={searchScope[item.key]}
                            onChange={e => setSearchScope(p => ({ ...p, [item.key]: e.target.checked }))}
                            style={{ accentColor: '#00C37A', width: '16px', height: '16px' }}
                          />
                          {item.label}
                        </label>
                        {item.key === 'segments' && searchScope.segments && (
                          <div style={{ marginRight: '24px', marginBottom: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontSize: '12px', color: '#00C37A' }}>
                              <input
                                type="checkbox"
                                checked={scopeSegments.length === (segments?.saved?.length || 0) && (segments?.saved?.length || 0) > 0}
                                onChange={e => setScopeSegments(
                                  e.target.checked
                                    ? (segments?.saved || []).map(s => s.id)
                                    : []
                                )}
                                style={{ accentColor: '#00C37A', width: '14px', height: '14px' }}
                              />
                              בחר הכל
                            </label>
                            {(segments?.saved || []).map(s => (
                              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)' }}>
                                <input
                                  type="checkbox"
                                  checked={scopeSegments.includes(s.id)}
                                  onChange={e => setScopeSegments(prev =>
                                    e.target.checked
                                      ? [...prev, s.id]
                                      : prev.filter(id => id !== s.id)
                                  )}
                                  style={{ accentColor: '#00C37A', width: '14px', height: '14px' }}
                                />
                                {s.name}
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                  ({s.count || '?'})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchScope({ name: true, phone: true, tags: true, notes: true, contact_types: true, segments: false })
                        setScopeSegments([])
                      }}
                      style={{ marginTop: '8px', width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      איפוס לברירת מחדל
                    </button>
                  </div>
                )}
              </div>
              <button className={activeTag === 'הכל' ? 'btn-primary' : 'btn-ghost'} onClick={() => { setActiveTag('הכל'); setTagFilter(''); setPage(1) }}>הכל</button>
            </div>
          </div>
          {/* Row 2: segment buttons + sort — aligned left */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'flex-start', marginTop: 10 }}>
            <div className="audience-search-row-2-tags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ALL_TAGS.filter(t => t !== 'הכל').map(tag => (
                <button key={tag} onClick={() => { setActiveTag(tag); setTagFilter(''); setPage(1) }} style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, background: activeTag === tag ? 'var(--v2-primary)' : 'rgba(255,255,255,0.04)', color: activeTag === tag ? 'var(--v2-dark)' : 'var(--v2-gray-400)', border: 'none', cursor: 'pointer' }}>{tag}</button>
              ))}
            </div>
            <CustomSelect
              className="input audience-search-row-3-sort"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={handleSortChange}
              options={[
                { value: '', label: 'ללא מיון' },
                { value: 'name_asc', label: 'א→ת' },
                { value: 'name_desc', label: 'ת→א' },
                { value: 'score', label: 'לפי ציון' },
                { value: 'campaigns', label: 'לפי קמפיינים' },
              ]}
            />
          </div>
          {/* Two-line gap */}
          <div style={{ marginTop: 24 }} />
          {/* Row 3: מציג X אנשי קשר + שמור כסגמנט + רענן */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>מציג</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--v2-primary)' }}>{loadingRecipients || loading ? 'טוען...' : filteredCount.toLocaleString()}</span>
                <span style={{ fontSize: 14, color: '#fff' }}>אנשי קשר</span>
                {hasMore && !searchResults && genderFilter === 'all' && activeTag === 'הכל' && contactTypeFilter.length === 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginRight: '4px' }}>
                    (מוצגים {loadedCount.toLocaleString()})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSaveSegment(true)}
                disabled={recipients.length === 0}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: recipients.length > 0 ? '#00C37A' : 'var(--glass-bg)',
                  color: recipients.length > 0 ? '#000' : 'var(--v2-gray-400)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: recipients.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Save size={14} /> שמור כסגמנט ({filteredCount.toLocaleString()})
              </button>
            </div>
            <button
              type="button"
              onClick={() => refreshRecipients()}
              disabled={loadingRecipients}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--v2-gray-300)', cursor: loadingRecipients ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              title="רענן"
            >
              <RefreshCw size={14} /> רענן
            </button>
          </div>
          {/* Row 4: action buttons — container + buttons match Settings tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => {
                const phones = recipients.map(r => r.phone).filter(Boolean)
                sessionStorage.setItem('campaign_recipients', JSON.stringify(phones))
                sessionStorage.setItem('campaign_segment_name', activeSegment)
                navigate('/dashboard/new-campaign')
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: 'var(--v2-gray-400)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--v2-gray-400)'}
            >
              <Send size={14} /> צור קמפיין
            </button>
            <button
              type="button"
              onClick={() => {
                const phones = recipients.map(r => r.phone).filter(Boolean)
                const existing = JSON.parse(sessionStorage.getItem('campaign_recipients') || '[]')
                sessionStorage.setItem('campaign_recipients', JSON.stringify([...new Set([...existing, ...phones])]))
                toast.success('נוסף לקמפיין')
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: 'var(--v2-gray-400)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--v2-gray-400)'}
            >
              <Plus size={14} /> הוסף לקמפיין קיים
            </button>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={async () => { setShowFlowDropdown(!showFlowDropdown); if (!showFlowDropdown && session?.access_token && businessId) { const d = await fetchWithAuth(`/api/whatsapp/flows`).catch(() => ({})); setFlowsList((d.flows || []).filter(x => x.meta_status === 'PUBLISHED')); } }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: 'var(--v2-gray-400)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--v2-gray-400)'}
              >
                <Zap size={14} /> שלח Flow
              </button>
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
                          const data = await fetchWithAuth(
                            `/api/whatsapp/flows/${flow.id}/send`,
                            { method: 'POST', body: JSON.stringify({ recipient_phones: phones }) }
                          )
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
            <div style={{ flexShrink: 0 }}>
              <ExportButton businessId={businessId} segment={activeSegment} label="ייצוא CSV" />
            </div>
            <button
              type="button"
              onClick={() => { setShowBulkTagModal(true); setBulkTagMode('add'); setBulkTag(''); setBulkTagToRemove(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent', color: 'var(--v2-gray-400)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--v2-gray-400)'}
            >
              <Tag size={14} /> תגיות לסגמנט
            </button>
          </div>
          {loadError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 'var(--radius-md)', color: '#F59E0B', fontSize: 14 }}>
              {loadError}
            </div>
          )}
        </div>

        {loadingRecipients ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 16px' }}>
            <RefreshCw size={28} style={{ color: 'var(--v2-primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="לא נמצאו אנשי קשר" description="נסה לשנות את מונחי החיפוש או הסנן" />
        ) : (
          <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px 12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => switchView('cards')}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: viewMode === 'cards' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--text)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px',
                  boxShadow: viewMode === 'cards' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                ⊞ כרטיסיות
              </button>
              <button
                type="button"
                onClick={() => switchView('table')}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: viewMode === 'table' ? 'var(--card)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px',
                  boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                ≡ טבלה
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setSelectMode(p => !p); setSelectedIds(new Set()) }}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                border: `1px solid ${selectMode ? '#00C37A' : 'var(--border)'}`,
                background: selectMode ? '#00C37A20' : 'transparent',
                color: selectMode ? '#00C37A' : 'var(--text-secondary)',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {selectMode ? `✓ נבחרו ${selectedIds.size}` : 'בחר'}
            </button>
            {(selectMode || viewMode === 'table') && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set(filtered.map(r => r.id)))}
                  style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  בחר הכל ({filtered.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  בטל הכל
                </button>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBulkEditPanel(true)}
                    style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: 'none', background: '#00C37A', color: '#fff' }}
                  >
                    ערוך {selectedIds.size} נבחרים
                  </button>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginRight: 'auto' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowContactTypeDropdown(p => !p) }}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '13px',
                    border: `1px solid ${contactTypeFilter.length ? '#00C37A' : 'var(--border)'}`,
                    background: contactTypeFilter.length ? '#00C37A20' : 'transparent',
                    color: contactTypeFilter.length ? '#00C37A' : 'var(--text-secondary)',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {contactTypeFilter.length ? `סוגי קשר (${contactTypeFilter.length})` : 'סוגי קשר ▼'}
                </button>

                {showContactTypeDropdown && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute', top: '100%', right: 0, zIndex: 100,
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '8px', minWidth: '180px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', marginTop: '4px',
                    }}
                  >
                    {contactTypes.map(ct => {
                      const selected = contactTypeFilter.includes(ct.value)
                      return (
                        <label key={ct.value} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                          background: selected ? '#00C37A15' : 'transparent',
                        }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setContactTypeFilter(p =>
                              selected ? p.filter(v => v !== ct.value) : [...p, ct.value]
                            )}
                            style={{ accentColor: '#00C37A' }}
                          />
                          <span style={{ fontSize: '13px' }}>{ct.emoji} {ct.label}</span>
                        </label>
                      )
                    })}

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowContactTypeDropdown(false)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px',
                          border: 'none', background: '#00C37A', color: '#fff', cursor: 'pointer',
                        }}
                      >
                        חפש
                      </button>
                      {contactTypeFilter.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setContactTypeFilter([])}
                          style={{
                            padding: '8px 10px', borderRadius: '8px', fontSize: '13px',
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                          }}
                        >
                          נקה
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowContactTypesModal(true)}
                style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
              >
                ⚙️ ערוך סוגים
              </button>
            </div>
          </div>
          {(activeSegment !== 'all' || searchResults !== null) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', marginBottom: '10px',
              background: '#00C37A15', border: '1px solid #00C37A40',
              borderRadius: '10px', direction: 'rtl',
            }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                {searchResults !== null
                  ? `מציג סגמנט מסונן — ${filtered.length} אנשי קשר`
                  : `מציג קהל מסונן — ${filtered.length} אנשי קשר`}
              </span>
              <button
                type="button"
                onClick={resetToAll}
                style={{
                  padding: '5px 12px', borderRadius: '8px', fontSize: '13px',
                  border: '1px solid #00C37A', background: 'transparent',
                  color: '#00C37A', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ← כל הקהל
              </button>
            </div>
          )}
          {viewMode === 'cards' ? (
          <div id="recipients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: '16px' }}>
            {paginated.map((r, i) => (
              <motion.div key={r.id || r.phone || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="recipient-card"
                style={{ position: 'relative', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '18px', cursor: 'pointer' }}
                onClick={() => {
                  if (selectMode) {
                    setSelectedIds(prev => {
                      const next = new Set(prev)
                      next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                      return next
                    })
                    return
                  }
                  navigate(`/dashboard/contacts/${r.id}`, {
                    state: { ids: filtered.map(x => x.id), current: r.id },
                  })
                }}
              >
                {selectMode && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    width: '20px', height: '20px', borderRadius: '4px',
                    border: `2px solid ${selectedIds.has(r.id) ? '#00C37A' : 'var(--border)'}`,
                    background: selectedIds.has(r.id) ? '#00C37A' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {selectedIds.has(r.id) && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,195,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-primary)' }}>{(r.name || '—').charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || '—'}</div>
                        {!selectMode && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={e => { e.stopPropagation(); setQuickEditRecipient(r) }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setQuickEditRecipient(r) } }}
                            style={{
                              fontSize: '11px',
                              color: '#00C37A',
                              cursor: 'pointer',
                              display: 'block',
                              marginTop: '2px',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            עריכה מהירה
                          </span>
                        )}
                      </div>
                      <EngagementScore score={r.axess_data?.engagement_score ?? r.score} size={40} />
                    </div>
                    {r.phone && (
                      <div style={{
                        fontSize: '13px', color: 'var(--text-secondary)',
                        textAlign: 'right', marginBottom: '6px',
                        direction: 'ltr', textAlign: 'right'
                      }}>
                        {r.phone}
                      </div>
                    )}
                    {r.phone && (
                      <div style={{
                        display: 'flex', gap: '8px',
                        justifyContent: 'flex-end', marginBottom: '8px'
                      }}>
                        {[
                          {
                            href: `https://wa.me/${r.phone.replace(/^0/, '972')}`,
                            icon: <MessageCircle size={16} />,
                            color: '#25D366', bg: '#25D36620', border: '#25D36640',
                            external: true
                          },
                          {
                            href: `tel:${r.phone}`,
                            icon: <Phone size={16} />,
                            color: '#00C37A', bg: '#00C37A20', border: '#00C37A40',
                            external: false
                          },
                          {
                            href: `sms:${r.phone}`,
                            icon: <MessageSquare size={16} />,
                            color: 'var(--text-secondary)', bg: 'var(--bg)', border: 'var(--border)',
                            external: false
                          },
                          {
                            href: `https://me.app/search?q=${r.phone.replace(/^0/, '972')}`,
                            icon: <Search size={16} />,
                            color: 'var(--text-secondary)', bg: 'var(--bg)', border: 'var(--border)',
                            external: true
                          },
                        ].map((btn, i) => (
                          <a
                            key={i}
                            href={btn.href}
                            target={btn.external ? '_blank' : undefined}
                            rel={btn.external ? 'noopener noreferrer' : undefined}
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: btn.bg, color: btn.color,
                              border: `1.5px solid ${btn.border}`,
                              textDecoration: 'none', flexShrink: 0,
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            {btn.icon}
                          </a>
                        ))}
                      </div>
                    )}
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
          ) : null}

          {viewMode === 'table' && (
            <ErrorBoundary
              fallback={(
                <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>
                  שגיאה בטעינת הטבלה — עובר לתצוגת כרטיסיות
                </div>
              )}
              onError={() => {
                setTimeout(() => switchView('cards'), 1000)
              }}
            >
              <div id="recipients-grid">
                <RecipientsTable
                  recipients={filtered}
                  contactTypes={contactTypes || []}
                  selectedIds={selectedIds}
                  onSelectionChange={newSelectedIds => setSelectedIds(newSelectedIds)}
                  onQuickEdit={r => setQuickEditRecipient(r)}
                  onDelete={r => setQuickEditRecipient(r)}
                  onNavigate={id => navigate(`/dashboard/contacts/${id}`, {
                    state: { ids: filtered.map(x => x.id), current: id },
                  })}
                />
              </div>
            </ErrorBoundary>
          )}

          {viewMode === 'cards' && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: page === 1 ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>הקודם</button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: page === totalPages ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>הבא</button>
            </div>
          )}
          {hasMore && (
            <div style={{
              fontSize: '11px', color: 'var(--text-secondary)',
              textAlign: 'center', padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                border: '2px solid #00C37A', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }} />
              טוען נתונים...
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
              מציג {recipients.length} תוצאות
            </span>
            <button
              type="button"
              onClick={() => setShowSaveSegment(true)}
              disabled={recipients.length === 0}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: recipients.length > 0 ? '#00C37A' : 'var(--glass-bg)',
                color: recipients.length > 0 ? '#000' : 'var(--v2-gray-400)',
                fontWeight: 600,
                fontSize: 13,
                cursor: recipients.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Save size={14} /> שמור כסגמנט ({filteredCount.toLocaleString()})
            </button>
          </div>
          </>
        )}
      </div>

      {showSaveSegment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSaveSegment(false)}>
          <div style={{ background: 'var(--card, #1a1d2e)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', position: 'relative', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowSaveSegment(false)} style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }} aria-label="סגור">
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>שמור סגמנט</h3>
            <input
              value={segmentName}
              onChange={e => setSegmentName(e.target.value)}
              placeholder="שם הסגמנט (למשל: לקוחות VIP)"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text)',
                padding: '0 12px',
                fontSize: 14,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', margin: '0 0 16px' }}>
              {recipients.length} אנשים יישמרו בסגמנט זה
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!segmentName.trim()) return
                const activeFilters = {
                  ...(genderFilter && genderFilter !== 'all' ? { gender: genderFilter } : {}),
                  ...(ageMin ? { age_min: ageMin } : {}),
                  ...(ageMax ? { age_max: ageMax } : {}),
                  ...(cityFilter ? { city: cityFilter } : {}),
                  ...(tagFilter ? { tags: [tagFilter] } : (activeTag !== 'הכל' ? { tags: [activeTag] } : {})),
                  ...(search ? { search: search } : {}),
                }
                const segmentPayload = {
                  name: segmentName.trim(),
                  filters: {
                    ...activeFilters,
                    recipient_ids: filtered.map(r => r.id),
                  },
                  count: filtered.length,
                  type: 'saved_audience',
                }
                try {
                  const r = await fetchWithAuth(
                    `/api/audiences/segments`,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        name: segmentPayload.name,
                        filters: segmentPayload.filters,
                        recipient_count: segmentPayload.count,
                        business_id: businessId,
                      }),
                    },
                  )
                  const data = r || {}
                  setShowSaveSegment(false)
                  setSegmentName('')
                  toast.success('סגמנט נשמר!')
                  queryClient.invalidateQueries({ queryKey: ['segments', businessId] })
                  const segData = await fetchWithAuth(`/api/admin/segments`).catch(() => ({}))
                  setSegments({ presets: PRESET_SEGMENTS, saved: segData?.saved || [] })
                } catch (e) {
                  toast.error(e.message || 'שגיאה בשמירה')
                }
              }}
              style={{
                height: 44,
                width: '100%',
                borderRadius: 8,
                border: 'none',
                background: '#00C37A',
                color: '#000',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              שמור סגמנט
            </button>
          </div>
        </div>
      )}

      {showBulkTagModal && (() => {
        const segmentTags = [...new Set(recipients.flatMap(r => r.tags || []))].filter(Boolean).sort()
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowBulkTagModal(false)}>
          <div className="glass-card" style={{ position: 'relative', padding: 20, width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowBulkTagModal(false)} style={MODAL_CLOSE_X} aria-label="סגור">
              <X size={20} />
            </button>
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
                <CustomSelect
                  className="form-input input"
                  value={bulkTagToRemove}
                  onChange={(val) => setBulkTagToRemove(val)}
                  style={{ width: '100%', padding: '10px 14px' }}
                  placeholder="— בחר תגית —"
                  options={[
                    { value: '', label: '— בחר תגית —' },
                    ...segmentTags.map(t => ({ value: t, label: t })),
                  ]}
                />
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
                  const r = await fetchWithAuth(
                    `${endpoint}`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({ tag: tagVal, recipient_ids: ids, business_id: businessId }),
                    },
                  )
                  const data = r || {}
                  setShowBulkTagModal(false)
                  setBulkTag('')
                  setBulkTagToRemove('')
                  toast.success(bulkTagMode === 'add' ? `התגית נוספה ל-${recipients.length} לקוחות` : `התגית הוסרה מ-${recipients.length} לקוחות`)
                  queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })
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

      {selectedIds.size > 0 && (showBulkEditPanel || viewMode === 'table') && (
        <div style={{
          position: 'fixed', bottom: 0, right: 0, left: 0,
          background: 'var(--card)', borderTop: '2px solid #00C37A',
          padding: '16px 20px', zIndex: 800,
          direction: 'rtl', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div style={{
              padding: '8px 12px', background: '#00C37A15',
              border: '1px solid #00C37A40', borderRadius: '8px',
              fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%',
            }}>
              <span>{selectedIds.size} נבחרו</span>
              <button
                type="button"
                onClick={() => setApplyToAll(p => !p)}
                style={{
                  background: applyToAll ? '#00C37A' : 'none',
                  border: '1px solid #00C37A',
                  borderRadius: '6px', color: applyToAll ? '#fff' : '#00C37A',
                  cursor: 'pointer', fontSize: '12px', padding: '3px 10px'
                }}>
                {applyToAll ? '✓ על כל הפילטר' : 'החל על כל הפילטר'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                placeholder="הוסף תגית..."
                value={bulkField.newTag || ''}
                onChange={e => setBulkField(p => ({ ...p, newTag: e.target.value }))}
                onKeyDown={async e => {
                  if (e.key !== 'Enter' || !bulkField.newTag?.trim()) return
                  await bulkUpdate('add_tag', bulkField.newTag.trim())
                  setBulkField(p => ({ ...p, newTag: '' }))
                }}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', direction: 'rtl', width: '140px',
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!bulkField.newTag?.trim()) return
                  await bulkUpdate('add_tag', bulkField.newTag.trim())
                  setBulkField(p => ({ ...p, newTag: '' }))
                }}
                style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#00C37A', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
              >
                + תגית
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                placeholder="הסר תגית..."
                value={bulkField.removeTag || ''}
                onChange={e => setBulkField(p => ({ ...p, removeTag: e.target.value }))}
                onKeyDown={async e => {
                  if (e.key !== 'Enter' || !bulkField.removeTag?.trim()) return
                  await bulkUpdate('remove_tag', bulkField.removeTag.trim())
                  setBulkField(p => ({ ...p, removeTag: '' }))
                }}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', direction: 'rtl', width: '140px',
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!bulkField.removeTag?.trim()) return
                  await bulkUpdate('remove_tag', bulkField.removeTag.trim())
                  setBulkField(p => ({ ...p, removeTag: '' }))
                }}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
              >
                - תגית
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={bulkField.contactType || ''}
                onChange={e => setBulkField(p => ({ ...p, contactType: e.target.value }))}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                <option value="">+ סוג קשר</option>
                {contactTypes.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.emoji} {ct.label}</option>
                ))}
              </select>
              {bulkField.contactType && (
                <button
                  type="button"
                  onClick={async () => {
                    await bulkUpdate('add_contact_type', bulkField.contactType)
                    setBulkField(p => ({ ...p, contactType: '' }))
                  }}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#00C37A', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                >
                  החל
                </button>
              )}
            </div>

            {/* מין */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>מין:</span>
              {[
                { value: 'Male', label: '👨 זכר' },
                { value: 'Female', label: '👩 נקבה' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => bulkUpdate('set_gender', opt.value)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text)', cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* עיר */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                placeholder="עיר..."
                value={bulkCity || ''}
                onChange={e => setBulkCity(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: '8px', fontSize: '13px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', direction: 'rtl', width: '120px',
                }}
              />
              <button
                type="button"
                onClick={() => bulkCity && bulkUpdate('set_city', bulkCity)}
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                  border: 'none', background: '#00C37A', color: '#fff',
                  cursor: 'pointer',
                }}
              >
                החל עיר
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={bulkField.segment || ''}
                onChange={e => setBulkField(p => ({ ...p, segment: e.target.value }))}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                <option value="">שנה סגמנט</option>
                <option value="general">general</option>
                <option value="vip">VIP</option>
                <option value="loyal">לקוח קבוע</option>
                <option value="new">חדש</option>
                <option value="review">לבדיקה</option>
              </select>
              {bulkField.segment && (
                <button
                  type="button"
                  onClick={async () => {
                    await bulkUpdate('set_segment', bulkField.segment)
                    setBulkField(p => ({ ...p, segment: '' }))
                  }}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#00C37A', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                >
                  החל
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={bulkField.eventTitle}
                onChange={e => setBulkField(p => ({ ...p, eventTitle: e.target.value }))}
                placeholder="שם אירוע לשיוך..."
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', direction: 'rtl', width: '160px',
                }}
              />
              <input
                type="date"
                value={bulkField.eventDate}
                onChange={e => setBulkField(p => ({ ...p, eventDate: e.target.value }))}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: '13px', width: '140px',
                }}
              />
              {bulkField.eventTitle && (
                <button
                  type="button"
                  onClick={async () => {
                    await bulkUpdate('add_event', {
                      event_title: bulkField.eventTitle,
                      event_date: bulkField.eventDate || null,
                      source: 'manual',
                    })
                    setBulkField(p => ({ ...p, eventTitle: '', eventDate: '' }))
                  }}
                  style={{
                    padding: '7px 12px', borderRadius: '8px',
                    border: 'none', background: '#00C37A',
                    color: '#fff', cursor: 'pointer', fontSize: '13px',
                  }}
                >
                  שייך לאירוע
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`למחוק ${selectedIds.size} אנשי קשר?`)) return
                await bulkUpdate('delete', null)
              }}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                border: '1px solid #ef4444', background: 'transparent',
                color: '#ef4444', cursor: 'pointer', fontSize: '13px',
              }}
            >
              🗑 מחק נבחרים
            </button>

            <button
              type="button"
              onClick={() => {
                setShowBulkEditPanel(false)
                setSelectedIds(new Set())
                setSelectMode(false)
              }}
              style={{
                marginRight: 'auto', padding: '7px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {showContactTypesModal && apiBusinessId && (
        <ContactTypesModal
          businessId={apiBusinessId}
          fetchWithAuth={fetchWithAuth}
          onClose={() => {
            setShowContactTypesModal(false)
            fetchWithAuth(`/api/admin/contact-types?business_id=${apiBusinessId}`)
              .then(d => Array.isArray(d) && setContactTypes(d))
              .catch(() => {})
          }}
        />
      )}

      {quickEditRecipient && (
        <QuickEditDrawer
          recipient={quickEditRecipient}
          businessId={businessId}
          fetchWithAuth={fetchWithAuth}
          contactTypes={contactTypes}
          currentIndex={recipients.findIndex(r => r.id === quickEditRecipient?.id)}
          total={recipients.length}
          hasPrev={recipients.findIndex(r => r.id === quickEditRecipient?.id) > 0}
          hasNext={recipients.findIndex(r => r.id === quickEditRecipient?.id) < recipients.length - 1}
          onNavigate={(dir) => {
            const idx = recipients.findIndex(r => r.id === quickEditRecipient?.id)
            if (dir === 'next' && idx < recipients.length - 1) {
              setQuickEditRecipient(recipients[idx + 1])
            } else if (dir === 'prev' && idx > 0) {
              setQuickEditRecipient(recipients[idx - 1])
            }
          }}
          onClose={() => setQuickEditRecipient(null)}
          onSaved={(updated) => {
            const updatedWithName = {
              ...updated,
              name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim(),
            }
            setRecipients(prev => prev.map(r =>
              r.id === updatedWithName.id ? { ...r, ...updatedWithName } : r
            ))
            if (searchResults !== null) {
              setSearchResults(prev => prev.map(r =>
                r.id === updatedWithName.id ? { ...r, ...updatedWithName } : r
              ))
            }
            setQuickEditRecipient(updatedWithName)
            queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })
          }}
          onDeleted={(deletedId) => {
            setRecipients(prev => prev.filter(r => r.id !== deletedId))
            setQuickEditRecipient(null)
            queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })
          }}
        />
      )}

      <CustomerProfileDrawer open={!!selectedCustomerId} onClose={() => setSelectedCustomerId(null)} masterRecipientId={selectedCustomerId} businessId={businessId} onTagUpdate={() => queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })} />
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        businessId={businessId}
        contactTypes={contactTypes}
        onImportDone={() => { queryClient.invalidateQueries({ queryKey: ['recipients', businessId] }) }}
      />

      {showMergeModal && mergeData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '560px', direction: 'rtl',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => { setShowMergeModal(false); setMergeData(null); setMergeResult(null) }}
              style={{
                position: 'absolute', top: '16px', left: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '20px',
                lineHeight: 1, padding: '4px',
              }}
            >
              ✕
            </button>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>
                מיזוג כפילויות טלפון
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                נמצאו {mergeData.total_groups} זוגות כפילויות
                {mergeData.duplicates?.filter(d => {
                  const pName = (d.primary?.first_name || '').trim().toLowerCase()
                  const dupName = (d.duplicates?.[0]?.first_name || '').trim().toLowerCase()
                  return pName && dupName && pName !== dupName
                }).length > 0 && (
                  <span style={{ color: '#f59e0b', marginRight: '8px' }}>
                    ⚠️ {mergeData.duplicates.filter(d => {
                      const pName = (d.primary?.first_name || '').trim().toLowerCase()
                      const dupName = (d.duplicates?.[0]?.first_name || '').trim().toLowerCase()
                      return pName && dupName && pName !== dupName
                    }).length} עם שמות שונים
                  </span>
                )}
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '16px' }}>
              {mergeData.duplicates?.map((group, i) => {
                const pName = (group.primary?.first_name || '').trim().toLowerCase()
                const dupName = (group.duplicates?.[0]?.first_name || '').trim().toLowerCase()
                const nameConflict = pName && dupName && pName !== dupName

                return (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
                    border: `1px solid ${nameConflict ? '#f59e0b40' : 'var(--border)'}`,
                    background: nameConflict ? '#f59e0b08' : 'var(--bg)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          {group.normalized_phone}
                        </span>
                        {nameConflict && (
                          <span style={{ fontSize: '11px', color: '#f59e0b', marginRight: '8px' }}>
                            ⚠️ שמות שונים
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {group.count} רשומות
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', alignItems: 'center' }}>
                      <div style={{ flex: 1, fontSize: '12px' }}>
                        <div style={{ color: '#00C37A', fontWeight: 600, marginBottom: '2px' }}>✓ ישמר</div>
                        <div>{group.primary?.first_name} {group.primary?.last_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{group.primary?.phone}</div>
                      </div>

                      {group.duplicates?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => swapPrimary(i)}
                          title="החלף בין ישמר לימזג"
                          style={{
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: '6px', padding: '4px 8px',
                            cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)',
                            flexShrink: 0,
                          }}
                        >
                          ⇄
                        </button>
                      )}

                      {group.duplicates?.map((dup, j) => (
                        <div key={j} style={{ flex: 1, fontSize: '12px' }}>
                          <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '2px' }}>→ יימזג</div>
                          <div>{dup.first_name} {dup.last_name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{dup.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {mergeResult && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
                background: mergeResult.errors?.length > 0 ? '#f59e0b15' : '#00C37A15',
                border: `1px solid ${mergeResult.errors?.length > 0 ? '#f59e0b40' : '#00C37A40'}`,
              }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                  {mergeResult.errors?.length > 0
                    ? `⚠️ מוזגו ${mergeResult.merged} מתוך ${mergeData.total_groups} — ${mergeResult.errors.length} שגיאות`
                    : `✅ מוזגו ${mergeResult.merged} כפילויות בהצלחה`}
                </p>
                {mergeResult.errors?.map((e, i) => (
                  <p key={i} style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>
                    {e.phone || e.id}: {e.error}
                  </p>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {!mergeResult && (
                <button
                  type="button"
                  onClick={async () => {
                    setMerging(true)
                    try {
                      const result = await fetchWithAuth('/api/admin/recipients/merge-duplicates', {
                        method: 'POST',
                        body: JSON.stringify({
                          dry_run: false,
                          custom_order: mergeData.duplicates.map((g) => ({
                            primary_id: g.primary.id,
                            duplicate_ids: g.duplicates.map((d) => d.id),
                          })),
                        }),
                      })
                      if (result?.error) {
                        setMergeResult({ merged: 0, errors: [{ phone: '', error: result.error }] })
                        return
                      }
                      setMergeResult(result)
                      if (result.merged > 0) {
                        queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })
                      }
                    } catch (e) {
                      setMergeResult({ merged: 0, errors: [{ phone: '', error: e.message }] })
                    } finally {
                      setMerging(false)
                    }
                  }}
                  disabled={merging}
                  style={{
                    flex: 1, background: '#00C37A', border: 'none',
                    borderRadius: '10px', padding: '12px',
                    color: '#fff', fontSize: '14px', fontWeight: 600,
                    cursor: merging ? 'not-allowed' : 'pointer',
                    opacity: merging ? 0.7 : 1,
                  }}
                >
                  {merging ? 'ממזג...' : `מזג ${mergeData.total_groups} כפילויות`}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowMergeModal(false); setMergeData(null); setMergeResult(null) }}
                style={{
                  flex: mergeResult ? 1 : 0, padding: '12px 20px',
                  borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '14px',
                }}
              >
                {mergeResult ? 'סגור' : 'ביטול'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowAddContact(false)}>
          <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', direction: 'rtl' }}
            onClick={e => e.stopPropagation()}>

            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>הוסף איש קשר</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                טלפון <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={addForm.phone}
                onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="05X-XXXXXXX"
                type="tel" dir="ltr"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['first_name', 'last_name'].map(field => (
                <div key={field} style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {field === 'first_name' ? 'שם פרטי' : 'שם משפחה'}
                  </label>
                  <input
                    value={addForm[field]}
                    onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', direction: 'rtl' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>אימייל</label>
              <input
                value={addForm.email}
                onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                type="email" dir="ltr"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>מין</label>
                <CustomSelect
                  value={addForm.gender}
                  onChange={v => setAddForm(p => ({ ...p, gender: v }))}
                  options={[
                    { value: '', label: 'לא צוין' },
                    { value: 'Male', label: '👨 זכר' },
                    { value: 'Female', label: '👩 נקבה' },
                  ]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>עיר</label>
                <input
                  value={addForm.city}
                  onChange={e => setAddForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="תל אביב"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', direction: 'rtl' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>סוגי קשר</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {contactTypes.map(ct => {
                  const selected = addForm.contact_types.includes(ct.value)
                  return (
                    <button key={ct.value} type="button"
                      onClick={() => setAddForm(p => ({
                        ...p,
                        contact_types: selected
                          ? p.contact_types.filter(v => v !== ct.value)
                          : [...p.contact_types, ct.value],
                      }))}
                      style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                        border: `1px solid ${selected ? '#00C37A' : 'var(--border)'}`,
                        background: selected ? '#00C37A20' : 'transparent',
                        color: selected ? '#00C37A' : 'var(--text-secondary)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {ct.emoji} {ct.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {addError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>{addError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={async () => {
                  if (!addForm.phone.trim()) { setAddError('טלפון חובה'); return }
                  setAddSaving(true)
                  setAddError('')
                  try {
                    const result = await fetchWithAuth('/api/admin/recipients', {
                      method: 'POST',
                      body: JSON.stringify({ ...addForm, business_id: businessId }),
                    })
                    if (result?.error) { setAddError(result.error); return }
                    setShowAddContact(false)
                    setAddForm({ phone: '', first_name: '', last_name: '', email: '', gender: '', city: '', contact_types: [] })
                    queryClient.invalidateQueries({ queryKey: ['recipients', businessId] })
                  } catch (e) {
                    setAddError(e.message || 'שגיאה בשמירה')
                  } finally {
                    setAddSaving(false)
                  }
                }}
                disabled={addSaving || !addForm.phone.trim()}
                style={{ flex: 1, background: '#00C37A', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', opacity: addSaving || !addForm.phone.trim() ? 0.6 : 1 }}
              >
                {addSaving ? 'שומר...' : 'הוסף איש קשר'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
