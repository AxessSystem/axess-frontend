import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Phone, Loader2, Plus, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { fetchWithAuth } from '@/lib/supabase'
import CustomSelect from '@/components/ui/CustomSelect'
import EngagementScore from '@/components/ui/EngagementScore'
import toast from 'react-hot-toast'

const ACCENT = '#00C37A'
const TABS = [
  { id: 'overview', label: 'סקירה' },
  { id: 'events', label: 'אירועים ורכישות' },
  { id: 'campaigns', label: 'קמפיינים' },
  { id: 'activity', label: 'פעילות' },
  { id: 'social', label: 'פרופיל חברתי' },
]

const TIMELINE_LABELS = {
  sms_sent: 'SMS נשלח',
  sms_delivered: 'SMS נמסר',
  link_clicked: 'לחיצה על לינק',
  validator_redeemed: 'מימוש ולידטור',
  validator_opened: 'פתיחת ולידטור',
  sms_replied: 'תגובה ל-SMS',
  checkin: "צ'ק-אין",
}

const TIMELINE_COLORS = {
  sms_sent: '#94a3b8',
  sms_delivered: '#94a3b8',
  link_clicked: '#3b82f6',
  validator_redeemed: ACCENT,
  validator_opened: ACCENT,
  sms_replied: '#0ea5e9',
  checkin: '#10b981',
}

const ACTIVITY_ICONS = {
  sms_reply: '💬',
  sms_reply_sent: '💬',
  checkin: '✅',
  intent_signal: '⭐',
}

const btnBase = {
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  padding: '10px 16px',
}

function calcAge(birthDate) {
  if (!birthDate) return null
  return Math.floor((Date.now() - new Date(birthDate)) / 31557600000)
}

function fullNameFrom(profile) {
  if (!profile) return 'לא צוין'
  const n = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  return n || 'לא צוין'
}

function initialsFrom(profile) {
  const name = fullNameFrom(profile)
  if (name === 'לא צוין') return profile?.phone?.[0] || '?'
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2)
}

export default function ContactPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { businessId, session } = useAuth()

  const ids = location.state?.ids || []
  const currentIndex = ids.indexOf(id)
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null
  const nextId = currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [saving, setSaving] = useState(false)

  const [overviewForm, setOverviewForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    birth_date: '',
    city: '',
    id_number: '',
    instagram_url: '',
    subscribed: '',
    contact_types: [],
    internal_notes: '',
    vendor_type: '',
    organizer_type: '',
  })

  const [socialForm, setSocialForm] = useState({
    avatar_url: '',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    linkedin_url: '',
  })

  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [contactTypes, setContactTypes] = useState([])

  useEffect(() => {
    if (!businessId || !session?.access_token) return
    fetchWithAuth(`/api/admin/contact-types?business_id=${businessId}`)
      .then((data) => Array.isArray(data) && setContactTypes(data))
      .catch(() => {})
  }, [businessId, session?.access_token])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const loadProfile = useCallback(() => {
    if (!id || !businessId) return Promise.resolve()
    setLoading(true)
    setError(null)
    return api
      .getCustomerProfile(id, businessId)
      .then((data) => {
        setProfile(data)
        const cd = data?.custom_data && typeof data.custom_data === 'object' ? data.custom_data : {}
        setOverviewForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          gender: data.gender || '',
          birth_date: data.birth_date ? String(data.birth_date).slice(0, 10) : '',
          city: data.city || '',
          id_number: data.id_number || '',
          instagram_url: cd.instagram_url || '',
          subscribed: cd.subscribed != null ? String(cd.subscribed) : '',
          contact_types: Array.isArray(data.contact_types) ? data.contact_types : [],
          internal_notes: data.internal_notes || '',
          vendor_type: data.vendor_type || '',
          organizer_type: data.organizer_type || '',
        })
        setSocialForm({
          avatar_url: data.avatar_url || '',
          instagram_url: cd.instagram_url || '',
          tiktok_url: cd.tiktok_url || '',
          facebook_url: cd.facebook_url || '',
          linkedin_url: cd.linkedin_url || '',
        })
      })
      .catch((err) => setError(err.message || 'שגיאה בטעינה'))
      .finally(() => setLoading(false))
  }, [id, businessId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const engagementScore =
    profile?.axess_data?.engagement_score ?? profile?.counters?.engagement_score ?? 0

  const totalSpent = profile?.business_data?.total_spent ?? profile?.counters?.total_spent ?? 0
  const totalEvents = profile?.business_data?.total_events ?? profile?.counters?.total_events ?? 0
  const campaignsReceived =
    profile?.axess_data?.campaigns_received ?? profile?.counters?.campaigns_received ?? 0
  const lastActive = profile?.last_active
    ? new Date(profile.last_active).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  const patchProfile = async (body) => {
    if (!profile?.id || !businessId || !session?.access_token) {
      toast.error('חסרים פרטי זיהוי')
      return
    }
    setSaving(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const data = await fetchWithAuth(`/api/admin/recipients/${profile.id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ business_id: businessId, ...body }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (data?.id || data?.success || data?.phone) {
        setProfile((prev) => (prev ? { ...prev, ...body } : prev))
        toast.success('נשמר בהצלחה')
      } else {
        toast.error(data?.error || 'שגיאה בעדכון')
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        toast.error('הבקשה נכשלה — timeout')
      } else {
        toast.error(e.message || 'שגיאה בעדכון')
      }
    } finally {
      setSaving(false)
    }
  }

  const saveOverview = () => {
    const custom_data = {
      ...(profile?.custom_data && typeof profile.custom_data === 'object' ? profile.custom_data : {}),
      instagram_url: overviewForm.instagram_url || undefined,
      subscribed: overviewForm.subscribed || undefined,
    }
    patchProfile({
      first_name: overviewForm.first_name,
      last_name: overviewForm.last_name,
      email: overviewForm.email,
      gender: overviewForm.gender || null,
      birth_date: overviewForm.birth_date || null,
      city: overviewForm.city,
      id_number: overviewForm.id_number,
      custom_data,
      contact_types: overviewForm.contact_types || [],
      internal_notes: overviewForm.internal_notes || null,
      vendor_type: overviewForm.vendor_type || null,
      organizer_type: overviewForm.organizer_type || null,
    })
  }

  const saveSocial = () => {
    const custom_data = {
      ...(profile?.custom_data && typeof profile.custom_data === 'object' ? profile.custom_data : {}),
      instagram_url: socialForm.instagram_url || undefined,
      tiktok_url: socialForm.tiktok_url || undefined,
      facebook_url: socialForm.facebook_url || undefined,
      linkedin_url: socialForm.linkedin_url || undefined,
    }
    patchProfile({
      avatar_url: socialForm.avatar_url || null,
      custom_data,
    })
  }

  const addTag = async () => {
    if (!newTag.trim() || !profile?.id || !businessId) return
    const tags = [...(profile.tags || []), newTag.trim()]
    try {
      await api.patchRecipientTags(profile.id, { tags, business_id: businessId })
      setNewTag('')
      setShowTagInput(false)
      toast.success('התגית נוספה')
      loadProfile()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const removeTag = async (tag) => {
    if (!profile?.id || !businessId) return
    const tags = (profile.tags || []).filter((t) => t !== tag)
    try {
      await api.patchRecipientTags(profile.id, { tags, business_id: businessId })
      toast.success('התגית הוסרה')
      loadProfile()
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const events = profile?.business_data?.events || []
  const eventsTotal = events.reduce((sum, ev) => {
    const p = parseFloat(ev.ticket_price)
    return sum + (Number.isNaN(p) ? 0 : p)
  }, 0)

  const timeline = [...(profile?.timeline || [])].sort(
    (a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0)
  )

  const activityLog = [...(profile?.activity_log || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )

  const inputStyle = {
    width: '100%',
    fontSize: 14,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '10px 12px',
    borderRadius: 8,
    boxSizing: 'border-box',
  }

  const labelStyle = { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }

  const kpiCards = (
    <div className="contact-kpis" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: 'סה״כ הוצאה', value: `₪${Number(totalSpent).toLocaleString('he-IL')}`, accent: true },
        { label: 'מספר אירועים', value: totalEvents },
        { label: 'קמפיינים שקיבל', value: campaignsReceived },
        { label: 'אחרון פעיל', value: lastActive },
      ].map((kpi) => (
        <div
          key={kpi.label}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{kpi.label}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: kpi.accent ? ACCENT : 'var(--text)' }}>{kpi.value}</div>
        </div>
      ))}

      {profile?.segment && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>סגמנט</div>
          <span
            style={{
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(0,195,122,0.12)',
              color: ACCENT,
              border: `1px solid ${ACCENT}`,
            }}
          >
            {profile.segment}
          </span>
        </div>
      )}

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>תגיות</span>
          <button
            type="button"
            onClick={() => setShowTagInput(!showTagInput)}
            style={{ ...btnBase, padding: '4px 10px', background: 'transparent', border: `1px solid ${ACCENT}`, color: ACCENT, fontSize: 11 }}
          >
            + הוסף
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showTagInput ? 8 : 0 }}>
          {(profile?.tags || []).map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 9999,
                background: 'rgba(0,195,122,0.12)',
                color: ACCENT,
                border: `1px solid rgba(0,195,122,0.35)`,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', padding: 0, WebkitTapHighlightColor: 'transparent' }}
                aria-label="הסר תגית"
              >
                ×
              </button>
            </span>
          ))}
          {(!profile?.tags || profile.tags.length === 0) && !showTagInput && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>אין תגיות</span>
          )}
        </div>
        {showTagInput && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input input"
              style={inputStyle}
              placeholder="שם תגית..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <button type="button" onClick={addTag} style={{ ...btnBase, background: ACCENT, color: '#000' }}>
              הוסף
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const tabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>שם פרטי</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.first_name} onChange={(e) => setOverviewForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>שם משפחה</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.last_name} onChange={(e) => setOverviewForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>טלפון</label>
              <input className="form-input input" style={{ ...inputStyle, opacity: 0.7 }} value={profile?.phone || ''} readOnly dir="ltr" />
            </div>
            <div>
              <label style={labelStyle}>אימייל</label>
              <input type="email" className="form-input input" style={inputStyle} value={overviewForm.email} onChange={(e) => setOverviewForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>מגדר</label>
              <CustomSelect
                className="form-input input"
                value={overviewForm.gender}
                onChange={(val) => setOverviewForm((f) => ({ ...f, gender: val }))}
                style={inputStyle}
                placeholder="לא צוין"
                options={[
                  { value: '', label: 'לא צוין' },
                  { value: 'Male', label: 'זכר' },
                  { value: 'Female', label: 'נקבה' },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>תאריך לידה</label>
              <input type="date" className="form-input input" style={inputStyle} value={overviewForm.birth_date} onChange={(e) => setOverviewForm((f) => ({ ...f, birth_date: e.target.value }))} />
              {overviewForm.birth_date && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  גיל: {calcAge(overviewForm.birth_date) ?? '—'}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>עיר</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.city} onChange={(e) => setOverviewForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                סוגי קשר
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {contactTypes.map((type) => {
                  const selected = (overviewForm.contact_types || []).includes(type.value)
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        const current = overviewForm.contact_types || []
                        setOverviewForm((prev) => ({
                          ...prev,
                          contact_types: selected
                            ? current.filter((t) => t !== type.value)
                            : [...current, type.value],
                        }))
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${selected ? '#00C37A' : 'var(--border)'}`,
                        background: selected ? '#00C37A20' : 'transparent',
                        color: selected ? '#00C37A' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {type.emoji} {type.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {(overviewForm.contact_types || []).includes('vendor') && (
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  סוג ספק
                </label>
                <input
                  value={overviewForm.vendor_type || ''}
                  onChange={(e) => setOverviewForm((prev) => ({ ...prev, vendor_type: e.target.value }))}
                  placeholder="אטרקציות / קייטרינג / צילום..."
                  className="form-input input"
                  style={{ ...inputStyle, direction: 'rtl' }}
                />
              </div>
            )}
            {(overviewForm.contact_types || []).includes('organizer') && (
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  סוג אירועים
                </label>
                <input
                  value={overviewForm.organizer_type || ''}
                  onChange={(e) => setOverviewForm((prev) => ({ ...prev, organizer_type: e.target.value }))}
                  placeholder="חתונות / בר מצוות / מסיבות..."
                  className="form-input input"
                  style={{ ...inputStyle, direction: 'rtl' }}
                />
              </div>
            )}
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                הערות פנימיות
              </label>
              <textarea
                value={overviewForm.internal_notes || ''}
                onChange={(e) => setOverviewForm((prev) => ({ ...prev, internal_notes: e.target.value }))}
                placeholder="הערות שרק אתה רואה..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  direction: 'rtl',
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>ת.ז.</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.id_number} onChange={(e) => setOverviewForm((f) => ({ ...f, id_number: e.target.value }))} />
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <label style={labelStyle}>אינסטגרם (URL)</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.instagram_url} onChange={(e) => setOverviewForm((f) => ({ ...f, instagram_url: e.target.value }))} dir="ltr" />
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <label style={labelStyle}>מנוי לדיוור</label>
              <input className="form-input input" style={inputStyle} value={overviewForm.subscribed} onChange={(e) => setOverviewForm((f) => ({ ...f, subscribed: e.target.value }))} placeholder="כן / לא / פעיל..." />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={saveOverview}
            style={{ ...btnBase, background: ACCENT, color: '#000', alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      )
    }

    if (activeTab === 'events') {
      return (
        <div>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>אין אירועים רשומים</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{ev.event_title || 'אירוע'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {ev.purchase_date && <span>📅 {(String(ev.purchase_date)).substring(0, 10)}</span>}
                    {ev.ticket_price && ev.ticket_price !== '0' && <span>💰 ₪{ev.ticket_price}</span>}
                    {ev.payment_method && <span>💳 {ev.payment_method}</span>}
                    <span style={{ color: ev.scan_status === 'Scanned' ? ACCENT : 'var(--text-secondary)' }}>
                      {ev.scan_status === 'Scanned' ? '✅ נסרק' : '⭕ לא נסרק'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
            }}
          >
            <span>סה״כ רכישות באירועים</span>
            <span style={{ color: ACCENT }}>₪{eventsTotal.toLocaleString('he-IL')}</span>
          </div>
        </div>
      )
    }

    if (activeTab === 'campaigns') {
      return timeline.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>אין פעילות קמפיינים</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {timeline.map((item, i) => {
            const type = item.event_type || item.type || ''
            const color = TIMELINE_COLORS[type] || '#94a3b8'
            return (
              <div
                key={`${type}-${item.created_at || i}`}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < timeline.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {TIMELINE_LABELS[type] || type || 'אירוע'}
                  </div>
                  {item.campaign_name && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.campaign_name}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {item.created_at || item.date
                      ? new Date(item.created_at || item.date).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (activeTab === 'activity') {
      return activityLog.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>אין רשומות פעילות</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activityLog.map((item, i) => (
            <div
              key={`${item.activity_type}-${item.created_at}-${i}`}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 0',
                borderBottom: i < activityLog.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{ACTIVITY_ICONS[item.activity_type] || '•'}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{item.activity_type || 'פעילות'}</div>
                {item.note && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.note}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'social') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: 'rgba(0,195,122,0.12)',
                border: `1px solid ${ACCENT}`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 800,
                color: ACCENT,
              }}
            >
              {socialForm.avatar_url ? (
                <img src={socialForm.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initialsFrom(profile)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>קישור לתמונת פרופיל (URL)</label>
              <input
                className="form-input input"
                style={inputStyle}
                value={socialForm.avatar_url}
                onChange={(e) => setSocialForm((f) => ({ ...f, avatar_url: e.target.value }))}
                placeholder="https://..."
                dir="ltr"
              />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>העלאת קובץ — בקרוב (כרגע URL בלבד)</div>
            </div>
          </div>
          {[
            { key: 'instagram_url', label: 'אינסטגרם' },
            { key: 'tiktok_url', label: 'טיקטוק' },
            { key: 'facebook_url', label: 'פייסבוק' },
            { key: 'linkedin_url', label: 'לינקדאין' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                className="form-input input"
                style={inputStyle}
                value={socialForm[key]}
                onChange={(e) => setSocialForm((f) => ({ ...f, [key]: e.target.value }))}
                dir="ltr"
                placeholder="https://"
              />
            </div>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={saveSocial}
            style={{ ...btnBase, background: ACCENT, color: '#000', alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'שומר...' : 'שמור פרופיל חברתי'}
          </button>
        </div>
      )
    }

    return null
  }

  if (!businessId) {
    return (
      <div dir="rtl" style={{ direction: 'rtl', background: 'var(--bg)', minHeight: '100vh', padding: 24, color: 'var(--text)' }}>
        <p>יש לבחור עסק כדי לצפות בפרופיל לקוח</p>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="contact-page"
      style={{
        direction: 'rtl',
        background: 'var(--bg)',
        minHeight: '100vh',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .contact-page button { WebkitTapHighlightColor: transparent; }
        @media (max-width: 767px) {
          .contact-layout { flex-direction: column !important; }
          .contact-sidebar { width: 100% !important; position: static !important; }
          .contact-kpis { flex-direction: row !important; flex-wrap: wrap !important; }
          .contact-kpis > * { flex: 1 1 140px; min-width: 140px; }
          .contact-header-inner { flex-wrap: wrap !important; }
        }
        @media (min-width: 768px) {
          .contact-layout { flex-direction: row !important; }
          .contact-sidebar { width: 280px !important; flex-shrink: 0 !important; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '14px 24px',
        }}
      >
        <div className="contact-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard/audiences')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, WebkitTapHighlightColor: 'transparent' }}
            >
              ← קהלים
            </button>

            {ids.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => prevId && navigate(`/dashboard/contacts/${prevId}`, { state: location.state })}
                    disabled={!prevId}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: prevId ? 'pointer' : 'not-allowed',
                      opacity: prevId ? 1 : 0.3,
                      fontSize: 16,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => nextId && navigate(`/dashboard/contacts/${nextId}`, { state: location.state })}
                    disabled={!nextId}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: nextId ? 'pointer' : 'not-allowed',
                      opacity: nextId ? 1 : 0.3,
                      fontSize: 16,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    ‹
                  </button>
                </div>

                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {currentIndex >= 0 ? currentIndex + 1 : '—'} / {ids.length}
                </span>
              </>
            )}
          </div>

          {profile && !loading && (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(0,195,122,0.12)',
                  border: `1px solid ${ACCENT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: ACCENT,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initialsFrom(profile)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{fullNameFrom(profile)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} />
                  <span dir="ltr">{profile.phone || '—'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    background: 'rgba(0,195,122,0.15)',
                    color: ACCENT,
                    border: `1px solid ${ACCENT}`,
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  Engagement {Number(engagementScore).toLocaleString('he-IL')}
                </span>
                <EngagementScore score={engagementScore} size={40} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ ...btnBase, background: ACCENT, color: '#000' }}
                  onClick={() => {
                    const name = fullNameFrom(profile)
                    navigate('/dashboard/new-campaign', {
                      state: { preselectedRecipient: { phone: profile.phone, name } },
                    })
                  }}
                >
                  שלח SMS
                </button>
                <button
                  type="button"
                  style={{ ...btnBase, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onClick={() =>
                    navigate('/dashboard/inbox', {
                      state: { openConversation: profile.phone, openConversationName: fullNameFrom(profile) },
                    })
                  }
                >
                  אינבוקס
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={36} style={{ color: ACCENT, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#EF4444' }}>{error}</div>
      )}

      {profile && !loading && !error && (
        <div className="contact-layout" style={{ display: 'flex', flex: 1, padding: isMobile ? 16 : 24, gap: 20, alignItems: 'flex-start' }}>
          <aside className="contact-sidebar" style={{ width: isMobile ? '100%' : 280, flexShrink: 0 }}>
            {kpiCards}
          </aside>

          <main style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                overflowX: 'auto',
                paddingBottom: 4,
                borderBottom: '1px solid var(--border)',
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...btnBase,
                    flexShrink: 0,
                    background: activeTab === tab.id ? 'rgba(0,195,122,0.15)' : 'transparent',
                    color: activeTab === tab.id ? ACCENT : 'var(--text-secondary)',
                    borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: isMobile ? 16 : 24,
              }}
            >
              {tabContent()}
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
