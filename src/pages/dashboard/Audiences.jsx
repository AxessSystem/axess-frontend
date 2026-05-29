import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Phone, Tag, X, ShoppingBag, Activity, Clock, Upload, Crown, RefreshCw, Sparkles, CheckCircle, Radio, Scan, AlertTriangle, Ticket, Cake, Send, Calendar, Pencil, Workflow, Plus, Zap, Download, Save, Trash2, Filter } from 'lucide-react'
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
  const [recipients, setRecipients] = useState([])
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
  const [sortBy, setSortBy] = useState('score')
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

  const {
    data: recipientsData,
    error: recipientsError,
    isLoading: recipientsLoading,
    refetch: refreshRecipients,
  } = useQuery({
    queryKey: ['recipients', businessId],
    queryFn: () =>
      fetchWithAuth(
        `/api/admin/recipients`
      ),
    staleTime: 1000 * 60 * 3,
    enabled: !!businessId && !!session?.access_token,
  })

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
    // סנכרון מצב טעינה עם React Query
    if (!businessId || !session?.access_token) {
      setLoadingRecipients(false)
      return
    }
    setLoadingRecipients(recipientsLoading)
    fetchWithAuth(`/api/admin/contact-types?business_id=${businessId}`)
      .then(d => Array.isArray(d) && setContactTypes(d))
      .catch(() => {})
  }, [businessId, session?.access_token, recipientsLoading])

  useEffect(() => {
    if (!recipientsData) return
    if (activeSegment === 'all' || !activeSegment) {
      console.log('[Audiences] recipients loaded:', recipientsData?.recipients?.length ?? 0)
      setRecipients(recipientsData?.recipients || recipientsData || [])
      setLoadError(null)
    }
  }, [recipientsData, activeSegment])

  useEffect(() => {
    try {
      sessionStorage.setItem('audiences_state', JSON.stringify({
        search,
        activeTag,
        contactTypeFilter,
        activeSegment,
        activeCategory,
        page,
        searchResults,
        searchScope,
        scopeSegments,
      }))
    } catch {}
  }, [search, activeTag, contactTypeFilter, activeSegment, activeCategory, page, searchResults, searchScope, scopeSegments])

  useEffect(() => {
    if (recipientsError) {
      setLoadError('שגיאה בטעינת נתונים — נסה לרענן')
    }
  }, [recipientsError])

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
    const ids = [...selectedIds]
    if (ids.length === 0) return

    try {
      const result = await fetchWithAuth('/api/admin/recipients/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ ids, action, value, business_id: businessId }),
      })
      console.log(`[bulk] ${action} על ${result.affected} רשומות`)
    } catch (e) {
      console.error('[bulk] שגיאה:', e.message)
    } finally {
      setSelectedIds(new Set())
      setSelectMode(false)
      setShowBulkEditPanel(false)
      resetToAll()
    }
  }

  const baseList = searchResults !== null ? searchResults : recipients

  const filtered = baseList
    .filter((r) => {
      if (searchResults !== null) return true
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
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
      if (sortBy === 'campaigns') return (b.campaigns || 0) - (a.campaigns || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'he')
      return 0
    })

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
          <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{loadingRecipients ? 'טוען...' : `${recipients.length} אנשי קשר`}</p>
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
            {segments.saved.map((seg) => (
              <div
                key={seg.id}
                style={{
                  background: 'var(--card)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid var(--glass-border)',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    {seg.is_default && '⭐ '}{seg.name}
                  </h4>
                  {!seg.is_default && (
                    <button
                      type="button"
                      onClick={() => deleteSegment(seg.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                      aria-label="מחק סגמנט"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {seg.filters && Object.keys(seg.filters).length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {Object.entries(seg.filters)
                      .filter(([key]) => key !== 'recipient_ids')
                      .map(([key, val]) => (
                      <span
                        key={key}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          background: 'rgba(0,195,122,0.1)',
                          color: '#00C37A',
                          border: '1px solid rgba(0,195,122,0.3)',
                        }}
                      >
                        {FILTER_LABELS[key] || key}: {Array.isArray(val) ? val.join(', ') : val}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                  {seg.count || seg.recipient_count || 0} אנשי קשר
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const hasSavedFilters =
                        seg.type === 'saved_audience' ||
                        (seg.filters && typeof seg.filters === 'object' && Object.keys(seg.filters).length > 0)
                      if (hasSavedFilters) applySegmentFilters(seg)
                      else runSaved(seg)
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text)',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Filter size={12} />{' '}
                    {seg.type === 'saved_audience' ||
                    (seg.filters && typeof seg.filters === 'object' && Object.keys(seg.filters).length > 0)
                      ? 'החל פילטרים'
                      : 'טען רשימה'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSearchResults(null)
                      setGenderFilter('all')
                      setActiveTag('הכל')
                      setTagFilter('')
                      setContactTypeFilter([])
                      setAgeMin('')
                      setAgeMax('')
                      setCityFilter('')
                      setSearch('')

                      const filters = seg.filters || {}

                      if (filters.recipient_ids && filters.recipient_ids.length > 0) {
                        const segmentRecipients = recipients.filter(r =>
                          filters.recipient_ids.includes(r.id)
                        )
                        if (segmentRecipients.length > 0) {
                          setSearchResults(segmentRecipients)
                        } else {
                          setLoading(true)
                          try {
                            const result = await fetchWithAuth(
                              `/api/admin/recipients/search?ids=${filters.recipient_ids.slice(0, 500).join(',')}`
                            )
                            if (Array.isArray(result)) setSearchResults(result)
                          } catch (e) {
                            console.error('[הצג קהל] שגיאה בטעינת IDs:', e.message)
                            if (filters.gender || filters.age_min || filters.city || filters.tags) {
                              applySegmentFilters(seg)
                            }
                          } finally {
                            setLoading(false)
                          }
                        }
                        setActiveSegment(seg.id)
                      } else if (filters.gender || filters.age_min || filters.age_max || filters.city || filters.tags || filters.search) {
                        applySegmentFilters(seg)
                        setActiveSegment(seg.id)
                      } else {
                        await runSaved(seg)
                      }

                      setTimeout(() => {
                        document.getElementById('recipients-grid')?.scrollIntoView({ behavior: 'smooth' })
                      }, 600)
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      border: '1px solid #00C37A',
                      background: '#00C37A20',
                      color: '#00C37A',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    הצג קהל
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToSegment(seg)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#00C37A',
                      color: '#000',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Send size={12} /> שלח קמפיין
                  </button>
                </div>
              </div>
            ))}
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
                            const results = await fetchWithAuth(`/api/admin/recipients/search?${params}`)
                            if (Array.isArray(results)) setSearchResults(results)
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
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'score', label: 'מיין: ציון' },
                { value: 'campaigns', label: 'מיין: קמפיינים' },
                { value: 'name', label: 'מיין: שם' },
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
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--v2-primary)' }}>{loadingRecipients || loading ? 'טוען...' : filtered.length}</span>
                <span style={{ fontSize: 14, color: '#fff' }}>אנשי קשר</span>
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
                <Save size={14} /> שמור כסגמנט ({recipients.length})
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
              {contactTypes.slice(0, 6).map(ct => {
                const active = contactTypeFilter.includes(ct.value)
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setContactTypeFilter(p =>
                      active ? p.filter(v => v !== ct.value) : [...p, ct.value]
                    )}
                    style={{
                      padding: '5px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: `1px solid ${active ? '#00C37A' : 'var(--border)'}`,
                      background: active ? '#00C37A20' : 'transparent',
                      color: active ? '#00C37A' : 'var(--text-secondary)',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {ct.emoji} {ct.label}
                  </button>
                )
              })}
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
              <Save size={14} /> שמור כסגמנט ({recipients.length})
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

            <span style={{ fontSize: '14px', fontWeight: 600, color: '#00C37A' }}>
              {selectedIds.size} נבחרו
            </span>

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
            setQuickEditRecipient(null)
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
    </div>
  )
}
