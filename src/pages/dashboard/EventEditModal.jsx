import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  X, Upload, Link, Plus, Trash2, QrCode, Globe, MapPin, Navigation, Share2, Copy,
  LayoutGrid,
} from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'
import DateTimePicker from '@/components/ui/DateTimePicker'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { copyToClipboard } from '@/utils/clipboard'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

const DATETIME_LOCAL_STYLE = {
  width: '100%',
  height: 40,
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'var(--glass)',
  color: 'var(--text)',
  padding: '0 10px',
  fontSize: 13,
  boxSizing: 'border-box',
  colorScheme: 'dark',
  WebkitAppearance: 'none',
}

function stationScannersFromMetadata(st) {
  const m = st?.metadata
  if (!m) return []
  if (typeof m === 'object' && m !== null && Array.isArray(m.scanners)) return m.scanners
  if (typeof m === 'string') {
    try {
      const p = JSON.parse(m)
      return Array.isArray(p?.scanners) ? p.scanners : []
    } catch {
      return []
    }
  }
  return []
}

function waMeDigits(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('972')) return d
  if (d.startsWith('0')) return `972${d.slice(1)}`
  if (d.length === 9 && d.startsWith('5')) return `972${d}`
  return d
}

const EDIT_TABS = [
  { id: 'basic', label: 'פרטים' },
  { id: 'description', label: '📝 תיאור' },
  { id: 'tickets', label: 'כרטיסים' },
  { id: 'tables', label: 'שולחנות' },
  { id: 'fields', label: 'שדות הרשמה' },
  { id: 'promoters', label: 'יחצ"נים' },
  { id: 'staff', label: 'צוות' },
  { id: 'venue', label: 'מקום' },
  { id: 'organizer', label: 'מארגן' },
  { id: 'faq', label: 'שאלות נפוצות' },
  { id: 'webview', label: 'Webview' },
  { id: 'design', label: 'עיצוב' },
  { id: 'summary', label: 'סיכום' },
]

function parseContactInfo(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return typeof p === 'object' && p !== null ? p : {}
    } catch {
      return {}
    }
  }
  return {}
}

function initialFaq(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}

const CREATE_TAB_IDS = ['basic', 'tickets', 'tables', 'venue', 'organizer']

function parseDisplayConfig(raw) {
  if (raw && typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return typeof p === 'object' && p !== null ? p : {}
    } catch {
      return {}
    }
  }
  return {}
}

function buildFormStateFromEvent(ev) {
  const contactInfo0 = parseContactInfo(ev?.contact_info)
  const displayConfig0 = parseDisplayConfig(ev?.display_config)
  return {
    title: ev?.title || '',
    date: ev?.date ? new Date(ev.date).toISOString() : '',
    doors_open: ev?.doors_open ? new Date(ev.doors_open).toISOString() : '',
    event_end: ev?.event_end ? new Date(ev.event_end).toISOString() : '',
    location: ev?.location || '',
    venue_name: ev?.venue_name || '',
    venue_address: ev?.venue_address || '',
    venue_maps_url: ev?.venue_maps_url || '',
    description: ev?.description || '',
    image_url: ev?.image_url || '',
    cover_image_url: ev?.cover_image_url || '',
    age_restriction: ev?.age_restriction || '',
    dress_code: ev?.dress_code || '',
    venue_image: displayConfig0.venue_image || '',
    organizer_name: contactInfo0.name || '',
    organizer_whatsapp: contactInfo0.whatsapp || '',
    organizer_email: contactInfo0.email || '',
    organizer_avatar: contactInfo0.avatar || '',
    faq: initialFaq(ev?.faq),
    min_age: ev?.min_age || 0,
    approval_mode: ev?.approval_mode || 'none',
    approval_required: ev?.approval_required || false,
    display_config: { ...displayConfig0 },
    slug: ev?.slug || '',
    share_messages:
      ev?.share_messages && typeof ev.share_messages === 'object' ? ev.share_messages : {},
  }
}

export default function EventEditModal({
  event: eventProp = null,
  eventId: eventIdProp = null,
  isOpen = true,
  onClose,
  onSave,
  authHeaders,
  businessId,
  mode = 'edit',
  onEventCreated,
  presentation = 'modal',
}) {
  const isCreateMode = mode === 'create'
  const isPage = presentation === 'page'
  const [fetchedEvent, setFetchedEvent] = useState(null)
  // תמיד העדף נתונים מה-DB, אם אין — השתמש ב-prop
  const effectiveEvent = isCreateMode ? null : (fetchedEvent || eventProp)
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState(() => buildFormStateFromEvent(null))
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const visibleTabs = (isCreateMode && !isPage) ? EDIT_TABS.filter((t) => CREATE_TAB_IDS.includes(t.id)) : EDIT_TABS

  useEffect(() => {
    if (!isOpen || isCreateMode) {
      setFetchedEvent(null)
      return
    }
    // תמיד שלוף מה-DB אם יש id — גם אם event כבר קיים
    const id = eventIdProp || eventProp?.id
    if (!id || !authHeaders) return

    let cancelled = false
    const loadEvent = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/events/${id}`,
          { headers: authHeaders() },
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (data?.id && !cancelled) setFetchedEvent(data)
      } catch (err) {
        console.error('Failed to fetch event:', err)
      }
    }

    loadEvent()
    return () => {
      cancelled = true
    }
  }, [eventIdProp, eventProp?.id, isCreateMode, isOpen, authHeaders])

  useEffect(() => {
    if (!isOpen || !isCreateMode) return
    setActiveTab('basic')
    setForm(buildFormStateFromEvent(null))
    setFetchedEvent(null)
  }, [isOpen, isCreateMode])

  useEffect(() => {
    if (!isOpen || isCreateMode || !effectiveEvent?.id) return
    setForm(buildFormStateFromEvent(effectiveEvent))
  }, [isOpen, isCreateMode, effectiveEvent?.id])

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'datetime-dark'
    style.textContent = `
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.7;
      cursor: pointer;
    }
    input[type="datetime-local"]::-webkit-datetime-edit {
      color: var(--text, #fff);
    }
    input[type="datetime-local"] {
      color-scheme: dark;
    }
  `
    if (!document.getElementById('datetime-dark')) {
      document.head.appendChild(style)
    }
    return () => {
      const el = document.getElementById('datetime-dark')
      if (el) el.remove()
    }
  }, [])

  const handleCreate = async () => {
    if (!form.title?.trim()) {
      toast.error('יש להזין שם אירוע')
      return
    }
    try {
      const cleanDate = (val) => (val && String(val).trim() !== '') ? val : null
      const cleanStr = (val) => (val && String(val).trim() !== '') ? String(val).trim() : null
      const res = await fetch(`${API_BASE}/api/admin/events`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          business_id: businessId,
          title: form.title.trim(),
          date: cleanDate(form.date),
          doors_open: cleanDate(form.date),
          event_end: cleanDate(form.event_end),
          location: cleanStr(form.location),
          description: cleanStr(form.description),
          status: 'draft',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'fail')
      const newEvent = data.event || data
      if (newEvent?.id) {
        toast.success(`אירוע נוצר!${newEvent.event_number != null ? ` #${newEvent.event_number}` : ''}`)
        onEventCreated?.(newEvent)
        if (!isPage || !isCreateMode) onClose?.()
      } else {
        toast.error('שגיאה ביצירת אירוע')
      }
    } catch {
      toast.error('שגיאה ביצירת אירוע')
    }
  }

  const saveBasic = async () => {
    if (!effectiveEvent?.id) {
      toast.error('אירוע לא נטען')
      return
    }
    setSaving(true)

    const cleanDate = (val) => (val && val.trim() !== '') ? val : null
    const cleanStr = (val) => (val && val.trim() !== '') ? val.trim() : null
    const cleanInt = (val) => (val && val.toString().trim() !== '') ? parseInt(val) : null

    const payload = {
      title: form.title,
      date: cleanDate(form.date),
      doors_open: cleanDate(form.date),
      event_end: cleanDate(form.event_end),
      location: cleanStr(form.location),
      venue_name: cleanStr(form.venue_name),
      venue_address: cleanStr(form.venue_address),
      venue_maps_url: cleanStr(form.venue_maps_url),
      description: cleanStr(form.description),
      image_url: cleanStr(form.image_url),
      cover_image_url: cleanStr(form.cover_image_url),
      age_restriction: cleanStr(form.age_restriction),
      dress_code: cleanStr(form.dress_code),
      min_age: form.min_age !== undefined && form.min_age !== ''
        ? Number(form.min_age)
        : 0,
      approval_mode: form.approval_mode || 'none',
      approval_required: form.approval_mode !== 'none',
      contact_info: {
        name: cleanStr(form.organizer_name),
        whatsapp: cleanStr(form.organizer_whatsapp),
        email: cleanStr(form.organizer_email),
        avatar: cleanStr(form.organizer_avatar),
      },
      display_config: {
        ...(effectiveEvent?.display_config || {}),
        ...(form.display_config || {}),
        venue_image: cleanStr(form.venue_image),
      },
      faq: form.faq || [],
    }

    const res = await fetch(`${API_BASE}/api/admin/events/${effectiveEvent.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (res.ok) {
      toast.success('השינויים נשמרו!')

      if (eventIdProp) {
        try {
          const refreshRes = await fetch(
            `${API_BASE}/api/admin/events/${eventIdProp}`,
            { headers: authHeaders() },
          )
          if (refreshRes.ok) {
            const refreshedData = await refreshRes.json()
            if (refreshedData?.id) setFetchedEvent(refreshedData)
          }
        } catch (err) {
          console.error('Failed to refresh event:', err)
        }
      }

      onSave?.()
    } else {
      const err = await res.json().catch(() => ({}))
      console.error('[save] error:', err)
      toast.error('שגיאה בשמירה')
    }
  }

  const handleImageUpload = async (file, field) => {
    setImageUploading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const res = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ image: e.target.result, folder: 'events' }),
        })
        const data = await res.json()
        console.log('[upload] response:', data) // ← בדיקה
        if (data.url) {
          // עדכן גם image_url וגם cover_image_url:
          setForm((f) => ({
            ...f,
            [field]: data.url,
            image_url: data.url, // ← הוסף
            cover_image_url: data.url, // ← הוסף
          }))
          console.log('[upload] form updated with:', data.url) // ← בדיקה
        }
      } catch (err) {
        console.error('[upload] error:', err)
      } finally {
        setImageUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const eventUrl = `https://axess.pro/e/${effectiveEvent?.slug}`

  if (presentation === 'modal' && !isOpen) return null

  const panelStyle = isPage
    ? {
        background: 'var(--card, #1a1d2e)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 920,
        minHeight: 'min(92vh, calc(100vh - 100px))',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }
    : {
        background: 'var(--card, #1a1d2e)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 680,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        overflow: 'hidden',
      }

  const inner = (
    <div style={panelStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            background: 'var(--card, #1a1d2e)',
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
            {isCreateMode ? 'אירוע חדש' : (form.title || 'עריכת אירוע')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
          >
            <X size={22} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 0,
            overflowX: 'auto',
            borderBottom: '1px solid var(--glass-border)',
            flexShrink: 0,
            scrollbarWidth: 'none',
          }}
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: 'transparent',
                fontSize: 14,
                flexShrink: 0,
                color: activeTab === tab.id ? '#00C37A' : 'var(--v2-gray-400)',
                borderBottom: activeTab === tab.id ? '2px solid #00C37A' : '2px solid transparent',
                fontWeight: activeTab === tab.id ? 700 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px' }}>
          {!isCreateMode && effectiveEvent?.slug && (
          <div
            style={{
              background: 'rgba(0,195,122,0.08)',
              border: '1px solid rgba(0,195,122,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Link size={14} color="#00C37A" />
            <span style={{ fontSize: 12, color: '#00C37A', flex: 1 }}>{eventUrl}</span>
            <button
              type="button"
              onClick={async () => {
                const result = await copyToClipboard(eventUrl)
                toast[result.success ? 'success' : 'error'](result.message)
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 11 }}
            >
              העתק
            </button>
          </div>
          )}

          {activeTab === 'basic' && (
            isCreateMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  שם האירוע *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 15,
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  תאריך התחלה
                </label>
                <DateTimePicker
                  value={form.date}
                  onChange={(v) => setForm((f) => ({ ...f, date: v, doors_open: v }))}
                  placeholder="בחר תאריך ושעת התחלה"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  תאריך סיום
                </label>
                <DateTimePicker
                  value={form.event_end}
                  onChange={(v) => setForm((f) => ({ ...f, event_end: v }))}
                  placeholder="בחר תאריך סיום"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  מיקום
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="מיקום האירוע"
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  תיאור
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="תיאור קצר של האירוע"
                  rows={5}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: 12,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
             </div>
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                צור אירוע ←
              </button>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  שם האירוע *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 15,
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    תחילת אירוע
                  </label>
                  <DateTimePicker
                    value={form.date}
                    onChange={(v) => setForm((f) => ({ ...f, date: v, doors_open: v }))}
                    placeholder="בחר תאריך ושעת התחלה"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    סיום אירוע
                  </label>
                  <DateTimePicker
                    value={form.event_end}
                    onChange={(v) => setForm((f) => ({ ...f, event_end: v }))}
                    placeholder="בחר תאריך סיום"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  הגבלת גיל
                </label>
                <input
                  value={form.age_restriction || ''}
                  onChange={(e) => setForm((f) => ({ ...f, age_restriction: e.target.value }))}
                  placeholder="למשל: 18+"
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6 }}
                >
                  הגבלת גיל מינימלית
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 18, 21, 25].map((age) => (
                    <div
                      key={age}
                      role="presentation"
                      onClick={() => setForm((f) => ({ ...f, min_age: age }))}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${form.min_age === age ? '#00C37A' : 'var(--glass-border)'}`,
                        background: form.min_age === age ? 'rgba(0,195,122,0.15)' : 'var(--glass)',
                        color: form.min_age === age ? '#00C37A' : 'var(--text)',
                        fontSize: 13,
                        fontWeight: form.min_age === age ? 700 : 400,
                      }}
                    >
                      {age === 0 ? 'ללא' : `${age}+`}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--glass)',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid var(--glass-border)',
                  marginBottom: 12,
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>
                  הגדרות אישור מארגן
                </p>

                {[
                  {
                    value: 'none',
                    label: 'ללא אישור',
                    sub: 'כל רכישה מאושרת אוטומטית',
                  },
                  {
                    value: 'all',
                    label: 'אישור לכל הכרטיסים',
                    sub: 'כל סוגי הכרטיסים והקהל דורשים אישורך',
                  },
                  {
                    value: 'new_only',
                    label: 'אישור לקהל חדש בלבד',
                    sub: 'קהל שרכש ממך באירועי עבר — מאושר אוטומטית',
                  },
                  {
                    value: 'tables_only',
                    label: 'אישור לשולחנות בלבד',
                    sub: 'כרטיסי כניסה מאושרים אוטומטית, שולחנות דורשים אישור',
                  },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    role="presentation"
                    onClick={() => setForm((f) => ({ ...f, approval_mode: opt.value }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      marginBottom: 6,
                      cursor: 'pointer',
                      border: `1px solid ${form.approval_mode === opt.value ? '#00C37A' : 'rgba(255,255,255,0.06)'}`,
                      background:
                        form.approval_mode === opt.value ? 'rgba(0,195,122,0.08)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: `2px solid ${form.approval_mode === opt.value ? '#00C37A' : 'rgba(255,255,255,0.3)'}`,
                        background: form.approval_mode === opt.value ? '#00C37A' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {form.approval_mode === opt.value && (
                        <div
                          style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }}
                        />
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                        {opt.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  שם המקום
                </label>
                <input
                  value={form.venue_name}
                  onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                  placeholder="כתוב את שם המקום בו יתקיים האירוע (מועדון / אולם / גן אירועים...)"
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  כתובת
                </label>
                <input
                  value={form.venue_address}
                  onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '0 12px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 8 }}>
                  תמונת כרטיס (Banner)
                </label>
                <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', margin: '0 0 10px' }}>
                  רזולוציה מומלצת: 1080×1080px · עד 5MB · JPG/PNG/WebP
                </p>

                {(form.cover_image_url || form.image_url) ? (
                  <div style={{ marginBottom: 8, borderRadius: 10, overflow: 'hidden', height: 160 }}>
                    <img
                      key={form.cover_image_url || form.image_url}
                      src={form.cover_image_url || form.image_url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }}
                      alt="תצוגה מקדימה"
                    />
                  </div>
                ) : (
                  <div style={{
                    height: 160, borderRadius: 10, marginBottom: 8,
                    background: 'linear-gradient(135deg, #1a1d2e 0%, #2a2d3e 100%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: '2px dashed rgba(0,195,122,0.3)'
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#00C37A', letterSpacing: 3 }}>AXESS</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Upload size={12} /> העלאת תמונת אירוע
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <label
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 8,
                      border: '2px dashed var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--v2-gray-400)',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'cover_image_url')}
                    />
                    <Upload size={14} /> {imageUploading ? 'מעלה...' : 'העלה תמונה'}
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                    או
                  </span>
                  <input
                    value={form.cover_image_url}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                    placeholder="הדבק URL תמונה"
                    style={{
                      flex: 2,
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--glass)',
                      color: 'var(--text)',
                      padding: '0 10px',
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={saveBasic}
                disabled={saving}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
            )
          )}

          {activeTab === 'description' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
                תיאור האירוע יוצג בדף הציבורי
              </p>
              <RichTextEditor
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="תאר את האירוע..."
                authHeaders={authHeaders}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={saveBasic}
                  style={{
                    flex: 2, height: 46, borderRadius: 10, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  }}
                >
                  שמור תיאור
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`${API_BASE}/api/admin/business/${businessId}/templates`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify({
                        template_type: 'description',
                        source_event_id: effectiveEvent?.id,
                        template_data: { description: form.description },
                      }),
                    })
                    toast.success('התיאור נשמר כתבנית!')
                  }}
                  style={{
                    flex: 1, height: 46, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  💾 שמור כתבנית
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (isCreateMode ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)', fontSize: 14 }}>
              <p style={{ margin: 0 }}>צור תחילה את האירוע בטאב «פרטים» עם כפתור «צור אירוע».</p>
            </div>
          ) : <TicketsTab eventId={effectiveEvent?.id} authHeaders={authHeaders} />)}

          {activeTab === 'tables' && (isCreateMode ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)', fontSize: 14 }}>
              <p style={{ margin: 0 }}>צור תחילה את האירוע בטאב «פרטים» עם כפתור «צור אירוע».</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)' }}>
              <p>הגדרות שולחנות זמינות בטאב &quot;שולחנות&quot; בדף האירוע</p>
              <p style={{ marginTop: 8, fontSize: 13 }}>
                תוספות כלולות לכל משקה מוגדרות בתפריט השולחנות (ניהול שולחנות → רשימת תפריט → כפתור תוספות)
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                עבור לניהול שולחנות
              </button>
            </div>
          ))}

          {activeTab === 'fields' && <RegistrationFieldsTab event={effectiveEvent} authHeaders={authHeaders} />}

          {activeTab === 'promoters' && <PromotersTab eventId={effectiveEvent?.id} authHeaders={authHeaders} />}

          {activeTab === 'staff' && (
            <div>
              <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#00C37A' }}>
                  לניהול מלא של הצוות — עבור לטאב &quot;שולחנות&quot; → כפתור &quot;צוות&quot;
                </p>
              </div>
              <ScanStationsTab eventId={effectiveEvent?.id} authHeaders={authHeaders} eventSlug={effectiveEvent?.slug} />
            </div>
          )}

          {activeTab === 'venue' && (isCreateMode ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)', fontSize: 14 }}>
              <p style={{ margin: 0 }}>צור תחילה את האירוע בטאב «פרטים» עם כפתור «צור אירוע».</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'rgba(0,195,122,0.15)',
                      border: '2px solid rgba(0,195,122,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {form.venue_image ? (
                      <img src={form.venue_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <MapPin size={28} color="#00C37A" />
                    )}
                  </div>
                  <label
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#00C37A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async (ev) => {
                          const res = await fetch(`${API_BASE}/api/upload/image`, {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify({ image: ev.target.result, folder: 'venues' }),
                          })
                          const data = await res.json()
                          if (data.url) setForm((f) => ({ ...f, venue_image: data.url }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    <Upload size={12} color="#000" />
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>תמונת/לוגו המקום</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                    יוצג בבלוק המקום בדף האירוע
                  </p>
                </div>
              </div>

              <input
                value={form.venue_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                placeholder="שם המקום"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <input
                value={form.venue_address || ''}
                onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                placeholder="כתובת מלאה"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              {form.venue_address && (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=${encodeURIComponent(form.venue_address)}`}
                    style={{ width: '100%', height: 200, border: 'none' }}
                    title="מפה"
                  />
                  <div style={{ display: 'flex', gap: 8, padding: 10, background: 'var(--card)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(form.venue_address)}`
                        window.open(mapsUrl, '_blank')
                      }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--glass)',
                        color: 'var(--text)',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Navigation size={13} color="#00C37A" /> פתח במפה
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const shareUrl = `https://axess.pro/e/${effectiveEvent?.slug}#venue`
                        const result = await copyToClipboard(shareUrl)
                        toast[result.success ? 'success' : 'error'](result.message)
                      }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 6,
                        border: 'none',
                        background: 'rgba(0,195,122,0.15)',
                        color: '#00C37A',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Share2 size={13} /> שתף מיקום
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={saveBasic}
                style={{
                  height: 42,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                שמור
              </button>
            </div>
          ))}

          {activeTab === 'organizer' && (isCreateMode ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)', fontSize: 14 }}>
              <p style={{ margin: 0 }}>צור תחילה את האירוע בטאב «פרטים» עם כפתור «צור אירוע».</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'rgba(0,195,122,0.15)',
                      border: '2px solid rgba(0,195,122,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {form.organizer_avatar ? (
                      <img src={form.organizer_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#00C37A' }}>
                        {(form.organizer_name || form.title || 'M')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#00C37A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async (ev) => {
                          const res = await fetch(`${API_BASE}/api/upload/image`, {
                            method: 'POST',
                            headers: authHeaders(),
                            body: JSON.stringify({ image: ev.target.result, folder: 'organizers' }),
                          })
                          const data = await res.json()
                          if (data.url) setForm((f) => ({ ...f, organizer_avatar: data.url }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    <Upload size={12} color="#000" />
                  </label>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>תמונת פרופיל מארגן</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                    יוצג בבלוק &quot;מארגן האירוע&quot;
                  </p>
                </div>
              </div>

              <input
                value={form.organizer_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, organizer_name: e.target.value }))}
                placeholder="שם המארגן / שם העסק"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <input
                value={form.organizer_whatsapp || ''}
                onChange={(e) => setForm((f) => ({ ...f, organizer_whatsapp: e.target.value }))}
                placeholder="מספר WhatsApp (972501234567)"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <input
                value={form.organizer_email || ''}
                onChange={(e) => setForm((f) => ({ ...f, organizer_email: e.target.value }))}
                placeholder="מייל ליצירת קשר"
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                }}
              />

              <div style={{ background: 'rgba(0,195,122,0.08)', borderRadius: 8, padding: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#00C37A' }}>
                  💬 צ&apos;אט עם המארגן יפתח ישירות ל-Webview inbox
                </p>
              </div>

              <button
                type="button"
                onClick={saveBasic}
                style={{
                  height: 42,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                שמור
              </button>
            </div>
          ))}

          {activeTab === 'faq' && (
            <FAQEditTab event={effectiveEvent} form={form} setForm={setForm} authHeaders={authHeaders} />
          )}

          {activeTab === 'webview' && (
            <WebviewTab event={effectiveEvent} authHeaders={authHeaders} businessId={businessId} />
          )}

          {activeTab === 'design' && (
            <DesignTab form={form} setForm={setForm} event={effectiveEvent} authHeaders={authHeaders} onSave={saveBasic} />
          )}

          {activeTab === 'summary' && (
            <SummaryTab
              event={effectiveEvent}
              form={form}
              authHeaders={authHeaders}
              onNavigateToCampaigns={(data) => {
                sessionStorage.setItem('pendingCampaign', JSON.stringify(data))
                onClose?.({ navigateTo: 'campaigns' })
              }}
            />
          )}
        </div>
    </div>
  )

  return isPage ? (
    <div dir="rtl" style={{ width: '100%', padding: 'var(--space-3)', boxSizing: 'border-box' }}>{inner}</div>
  ) : (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {inner}
    </div>
  )
}

const DEFAULT_TICKET = {
  name: '',
  description: '',
  price: '0',
  quantity_total: '',
  max_per_order: 10,
  ticket_category: 'general',
  status: 'active',
}

const DEFAULT_TABLE_TICKET = {
  name: 'שולחן',
  description: '',
  quantity_total: 10,
  approval_required: true,
  show_menu_link: true,
  table_type: 'smart',
  min_spend: 0,
  free_people_premium: 3,
  free_people_standard: 2,
  price_threshold: 1000,
  extras_per_bottle: 1,
}

function TicketsTab({ eventId, authHeaders }) {
  const [tickets, setTickets] = useState([])
  const [showAdd, setShowAdd] = useState(null)
  const [newTicket, setNewTicket] = useState({ ...DEFAULT_TICKET })
  const [newTableTicket, setNewTableTicket] = useState({ ...DEFAULT_TABLE_TICKET })

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) =>
        setTickets(Array.isArray(d.ticket_types) ? d.ticket_types : Array.isArray(d) ? d : []),
      )
  }, [eventId, authHeaders])

  const loadTickets = () => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) =>
        setTickets(Array.isArray(d.ticket_types) ? d.ticket_types : Array.isArray(d) ? d : []),
      )
  }

  const TICKET_CATEGORIES = [
    { value: 'general', label: 'כניסה כללית' },
    { value: 'early_bird', label: 'מוקדמות' },
    { value: 'vip', label: 'VIP' },
    { value: 'table', label: 'שולחן' },
    { value: 'group', label: 'קבוצה' },
  ]

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>סוגי כרטיסים</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setShowAdd('ticket')
            setNewTicket({ ...DEFAULT_TICKET })
          }}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#00C37A',
            color: '#000',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> כרטיס כניסה
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAdd('table')
            setNewTableTicket({ ...DEFAULT_TABLE_TICKET })
          }}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(0,195,122,0.15)',
            color: '#00C37A',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            border: '1px solid rgba(0,195,122,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <LayoutGrid size={14} /> כרטיס שולחן
        </button>
      </div>

      {tickets.map((tt) => (
        <div
          key={tt.id}
          style={{
            background: 'var(--glass)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 10,
            border: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{tt.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                ₪{tt.price} · {tt.quantity_total} כרטיסים · {tt.quantity_sold || 0} נמכרו
              </p>
              {tt.ticket_category && (
                <span
                  style={{
                    fontSize: 11,
                    background: 'rgba(0,195,122,0.1)',
                    color: '#00C37A',
                    padding: '1px 8px',
                    borderRadius: 10,
                    display: 'inline-block',
                    marginTop: 4,
                  }}
                >
                  {TICKET_CATEGORIES.find((c) => c.value === tt.ticket_category)?.label || tt.ticket_category}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: tt.status === 'active' ? 'rgba(0,195,122,0.15)' : 'rgba(239,68,68,0.15)',
                  color: tt.status === 'active' ? '#00C37A' : '#EF4444',
                }}
              >
                {tt.status === 'active' ? 'פעיל' : 'מושבת'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types/${tt.id}`, {
                    method: 'DELETE',
                    headers: authHeaders(),
                  })
                  loadTickets()
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: '#00C37A',
                  width: `${Math.min(100, ((tt.quantity_sold || 0) / (tt.quantity_total || 1)) * 100)}%`,
                }}
              />
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--v2-gray-400)', textAlign: 'left' }}>
              נותרו {Math.max(0, (tt.quantity_total || 0) - (tt.quantity_sold || 0) - (tt.quantity_reserved || 0))}
            </p>
          </div>
        </div>
      ))}

      {tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--v2-gray-400)' }}>
          <p>אין כרטיסים עדיין</p>
        </div>
      )}

      {showAdd === 'ticket' && (
        <div
          style={{
            background: 'var(--glass)',
            borderRadius: 10,
            padding: 16,
            marginTop: 12,
            border: '1px solid var(--glass-border)',
          }}
        >
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>כרטיס חדש</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={newTicket.name}
              onChange={(e) => setNewTicket((f) => ({ ...f, name: e.target.value }))}
              placeholder="שם הכרטיס *"
              style={{
                height: 38,
                borderRadius: 6,
                border: '1px solid var(--glass-border)',
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
            <input
              value={newTicket.description || ''}
              onChange={(e) => setNewTicket((f) => ({ ...f, description: e.target.value }))}
              placeholder="תיאור (אופציונלי)"
              style={{
                height: 38,
                borderRadius: 6,
                border: '1px solid var(--glass-border)',
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  מחיר ₪ *
                </label>
                <input
                  value={newTicket.price}
                  onChange={(e) => setNewTicket((f) => ({ ...f, price: e.target.value }))}
                  placeholder="₪0"
                  type="number"
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  כמות כרטיסים *
                </label>
                <input
                  value={newTicket.quantity_total}
                  onChange={(e) => setNewTicket((f) => ({ ...f, quantity_total: e.target.value }))}
                  placeholder="כמה כרטיסים למכירה"
                  type="number"
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  מקסימום לרכישה אחת
                </label>
                <input
                  value={newTicket.max_per_order || ''}
                  onChange={(e) => setNewTicket((f) => ({ ...f, max_per_order: e.target.value }))}
                  placeholder="10"
                  type="number"
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <CustomSelect
              value={newTicket.ticket_category}
              onChange={(v) => setNewTicket((f) => ({ ...f, ticket_category: v }))}
              options={TICKET_CATEGORIES}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newTicket.name?.trim()) return
                  if (!newTicket.price || !newTicket.quantity_total) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(newTicket),
                  })
                  setShowAdd(null)
                  setNewTicket({ ...DEFAULT_TICKET })
                  loadTickets()
                }}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 6,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                הוסף כרטיס
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(null)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd === 'table' && (
        <div
          style={{
            background: 'var(--glass)',
            borderRadius: 10,
            padding: 16,
            marginTop: 12,
            border: '1px solid rgba(0,195,122,0.3)',
          }}
        >
          <h4
            style={{
              margin: '0 0 14px',
              fontSize: 14,
              fontWeight: 700,
              color: '#00C37A',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LayoutGrid size={16} /> כרטיס שולחן חדש
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--v2-gray-400)',
                  display: 'block',
                  marginBottom: 3,
                }}
              >
                שם הכרטיס *
              </label>
              <input
                value={newTableTicket.name}
                onChange={(e) => setNewTableTicket((f) => ({ ...f, name: e.target.value }))}
                placeholder='למשל: "שולחן VIP", "שולחן ליד הבמה"'
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--v2-gray-400)',
                  display: 'block',
                  marginBottom: 3,
                }}
              >
                תיאור (אופציונלי)
              </label>
              <input
                value={newTableTicket.description || ''}
                onChange={(e) => setNewTableTicket((f) => ({ ...f, description: e.target.value }))}
                placeholder="מה כולל השולחן..."
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--v2-gray-400)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                סוג שולחן
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'smart', label: '🎯 חכם', sub: 'הלקוח בוחר שתייה וכמות' },
                  { value: 'specific', label: '🍾 ספציפי', sub: 'מוצר ומחיר קבועים' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => setNewTableTicket((f) => ({ ...f, table_type: opt.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setNewTableTicket((f) => ({ ...f, table_type: opt.value }))
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: `2px solid ${newTableTicket.table_type === opt.value ? '#00C37A' : 'var(--glass-border)'}`,
                      background:
                        newTableTicket.table_type === opt.value ? 'rgba(0,195,122,0.1)' : 'transparent',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{opt.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--v2-gray-400)' }}>{opt.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {newTableTicket.table_type === 'smart' && (
              <div
                style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(0,195,122,0.08)',
                  border: '1px solid rgba(0,195,122,0.2)',
                  fontSize: 13, color: 'var(--v2-gray-400)',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#00C37A', fontWeight: 700 }}>שולחן חכם — </span>
                כלל הכניסות החינמיות והתוספות נקבעים אוטומטית לפי תפריט העסק.
                הלקוח יבחר משקאות ויראה את הכלל המתאים לכל פריט.
              </div>
            )}

            {newTableTicket.table_type === 'specific' && (
              <div
                style={{
                  background: 'rgba(0,195,122,0.05)',
                  borderRadius: 8,
                  padding: 10,
                  border: '1px solid rgba(0,195,122,0.15)',
                }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>כלל כניסות חינם</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label
                      style={{
                        fontSize: 10,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 3,
                      }}
                    >
                      אנשים חינם (בקבוק מעל ₪X)
                    </label>
                    <input
                      value={newTableTicket.free_people_premium}
                      onChange={(e) =>
                        setNewTableTicket((f) => ({
                          ...f,
                          free_people_premium: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      type="number"
                      min="0"
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 10,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 3,
                      }}
                    >
                      אנשים חינם (מתחת לסף)
                    </label>
                    <input
                      value={newTableTicket.free_people_standard}
                      onChange={(e) =>
                        setNewTableTicket((f) => ({
                          ...f,
                          free_people_standard: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      type="number"
                      min="0"
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 10,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 3,
                      }}
                    >
                      סף מחיר ₪
                    </label>
                    <input
                      value={newTableTicket.price_threshold}
                      onChange={(e) =>
                        setNewTableTicket((f) => ({
                          ...f,
                          price_threshold: parseInt(e.target.value, 10) || 1000,
                        }))
                      }
                      type="number"
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 10,
                        color: 'var(--v2-gray-400)',
                        display: 'block',
                        marginBottom: 3,
                      }}
                    >
                      תוספות לבקבוק
                    </label>
                    <input
                      value={newTableTicket.extras_per_bottle}
                      onChange={(e) =>
                        setNewTableTicket((f) => ({
                          ...f,
                          extras_per_bottle: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      type="number"
                      min="0"
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  כמות שולחנות זמינים
                </label>
                <input
                  value={newTableTicket.quantity_total}
                  onChange={(e) =>
                    setNewTableTicket((f) => ({
                      ...f,
                      quantity_total: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  type="number"
                  placeholder="10"
                  style={{
                    width: '100%',
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 8px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-gray-400)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  מינימום הזמנה ₪
                </label>
                <input
                  value={newTableTicket.min_spend}
                  onChange={(e) =>
                    setNewTableTicket((f) => ({ ...f, min_spend: parseInt(e.target.value, 10) || 0 }))
                  }
                  type="number"
                  placeholder="0"
                  style={{
                    width: '100%',
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 8px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={newTableTicket.approval_required}
                  onChange={(e) =>
                    setNewTableTicket((f) => ({ ...f, approval_required: e.target.checked }))
                  }
                />
                דורש אישור מפיק (מומלץ לשולחנות)
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={newTableTicket.show_menu_link !== false}
                  onChange={(e) =>
                    setNewTableTicket((f) => ({ ...f, show_menu_link: e.target.checked }))
                  }
                />
                הצג לינק תפריט בדף האירוע
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newTableTicket.name) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      name: newTableTicket.name,
                      description: newTableTicket.description || '',
                      price: 0,
                      quantity_total: newTableTicket.quantity_total || 10,
                      max_per_order: 1,
                      ticket_category: 'table',
                      status: 'active',
                      min_spend: newTableTicket.min_spend,
                      approval_required: newTableTicket.approval_required,
                      metadata: {
                        table_type: newTableTicket.table_type,
                        show_menu_link: newTableTicket.show_menu_link,
                        free_rule: {
                          people: newTableTicket.free_people_premium,
                          below_threshold_people: newTableTicket.free_people_standard,
                          price_threshold: newTableTicket.price_threshold,
                          per_liter: newTableTicket.extras_per_bottle,
                        },
                      },
                    }),
                  })
                  setShowAdd(null)
                  loadTickets()
                  toast.success('כרטיס שולחן נוסף!')
                }}
                style={{
                  flex: 2,
                  height: 42,
                  borderRadius: 8,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                הוסף כרטיס שולחן
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(null)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
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

function RegistrationFieldsTab({ event, authHeaders }) {
  const [fields, setFields] = useState(
    Array.isArray(event?.registration_fields) && event.registration_fields.length > 0
      ? event.registration_fields
      : [
          { id: 'first_name', label: 'שם פרטי', type: 'text', required: true, system: true },
          { id: 'last_name', label: 'שם משפחה', type: 'text', required: true, system: true },
          { id: 'phone', label: 'טלפון', type: 'tel', required: true, system: true },
          { id: 'email', label: 'מייל', type: 'email', required: false, system: true },
          { id: 'id_number', label: 'ת.ז', type: 'text', required: false, system: true },
          { id: 'gender', label: 'מין', type: 'select', required: false, system: true, options: ['זכר', 'נקבה', 'אחר'] },
          { id: 'birth_date', label: 'תאריך לידה', type: 'date', required: false, system: true },
          { id: 'instagram', label: 'אינסטגרם', type: 'text', required: false, system: true, placeholder: '@username' },
        ],
  )
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false })
  const [saving, setSaving] = useState(false)

  const saveFields = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ registration_fields: fields }),
      })
      if (res.ok) {
        toast.success('שדות ההרשמה נשמרו ✓')
      } else {
        toast.error('שגיאה בשמירת השדות')
      }
    } catch {
      toast.error('שגיאה בחיבור לשרת')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--v2-gray-400)', margin: '0 0 16px' }}>
        הגדר אילו שדות יוצגו בטופס ההרשמה ואילו יהיו חובה.
      </p>

      {fields.map((field, idx) => (
        <div
          key={field.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 0',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{field.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--v2-gray-400)' }}>{field.type}</p>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              cursor: field.system ? 'default' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={field.required}
              disabled={field.id === 'phone' || field.id === 'first_name'}
              onChange={(e) =>
                setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, required: e.target.checked } : f)))
              }
            />
            חובה
          </label>
          {!field.system && (
            <button
              type="button"
              onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      <div style={{ marginTop: 16, padding: 14, background: 'var(--glass)', borderRadius: 8 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>+ הוסף שדה מותאם</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newField.label}
            onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
            placeholder="שם השדה"
            style={{
              flex: 2,
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '0 8px',
              fontSize: 13,
            }}
          />
          <CustomSelect
            value={newField.type}
            onChange={(v) => setNewField((f) => ({ ...f, type: v }))}
            options={[
              { value: 'text', label: 'טקסט' },
              { value: 'number', label: 'מספר' },
              { value: 'select', label: 'בחירה' },
              { value: 'date', label: 'תאריך' },
            ]}
            style={{ width: 100 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField((f) => ({ ...f, required: e.target.checked }))}
            />
            חובה
          </label>
          <button
            type="button"
            onClick={() => {
              if (!newField.label) return
              setFields((prev) => [...prev, { ...newField, id: `custom_${Date.now()}` }])
              setNewField({ label: '', type: 'text', required: false })
            }}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 6,
              border: 'none',
              background: '#00C37A',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={saveFields}
        disabled={saving}
        style={{
          width: '100%',
          height: 42,
          borderRadius: 8,
          border: 'none',
          background: '#00C37A',
          color: '#000',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          marginTop: 16,
        }}
      >
        {saving ? 'שומר...' : 'שמור שדות הרשמה'}
      </button>
    </div>
  )
}

function PromotersTab({ eventId, authHeaders }) {
  const [promoters, setPromoters] = useState([])
  const [newPromoter, setNewPromoter] = useState({
    name: '',
    phone: '',
    commission_pct: '',
    commission_type: 'pct',
  })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) =>
        setPromoters(Array.isArray(d.promoters) ? d.promoters : Array.isArray(d) ? d : []),
      )
  }, [eventId, authHeaders])

  const loadPromoters = () => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) =>
        setPromoters(Array.isArray(d.promoters) ? d.promoters : Array.isArray(d) ? d : []),
      )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>יחצ&quot;נים</h3>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#00C37A',
            color: '#000',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + הוסף
        </button>
      </div>

      {promoters.map((p) => (
        <div
          key={p.id}
          style={{
            background: 'var(--glass)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 8,
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{p.name}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--v2-gray-400)' }}>
              {p.phone} · {p.commission_pct || 10}% עמלה
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const url = `https://axess.pro/e/${eventId}?ref=${p.id}`
              const result = await copyToClipboard(url)
              toast[result.success ? 'success' : 'error'](result.message)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 12 }}
          >
            העתק לינק
          </button>
        </div>
      ))}

      {showAdd && (
        <div style={{ background: 'var(--glass)', borderRadius: 10, padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={newPromoter.name}
              onChange={(e) => setNewPromoter((f) => ({ ...f, name: e.target.value }))}
              placeholder="שם פרטי ושם משפחה *"
              style={{
                height: 36,
                borderRadius: 6,
                border: '1px solid var(--glass-border)',
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
            <input
              value={newPromoter.phone}
              onChange={(e) => setNewPromoter((f) => ({ ...f, phone: e.target.value }))}
              placeholder="נייד לאיש קשר *"
              type="tel"
              style={{
                height: 36,
                borderRadius: 6,
                border: '1px solid var(--glass-border)',
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
            <div>
              <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 6 }}>
                דיל יחצ&quot;ן
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <CustomSelect
                  value={newPromoter.commission_type || 'pct'}
                  onChange={(v) => setNewPromoter((f) => ({ ...f, commission_type: v }))}
                  options={[
                    { value: 'pct', label: '% מהכרטיס' },
                    { value: 'fixed', label: '₪ קבוע לכרטיס' },
                  ]}
                  style={{ width: 140 }}
                />
                <input
                  value={newPromoter.commission_pct || ''}
                  onChange={(e) => setNewPromoter((f) => ({ ...f, commission_pct: e.target.value }))}
                  placeholder={newPromoter.commission_type === 'fixed' ? '₪ לכרטיס' : '% עמלה'}
                  type="number"
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    padding: '0 10px',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                {newPromoter.commission_type === 'fixed'
                  ? 'סכום קבוע בש"ח עבור כל כרטיס שנמכר'
                  : 'אחוז ממחיר הכרטיס הנמכר'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newPromoter.name || !newPromoter.phone) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(newPromoter),
                  })
                  setShowAdd(false)
                  setNewPromoter({
                    name: '',
                    phone: '',
                    commission_pct: '',
                    commission_type: 'pct',
                  })
                  loadPromoters()
                }}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 6,
                  border: 'none',
                  background: '#00C37A',
                  color: '#000',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                הוסף
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 6,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
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

function DesignTab({ form, setForm, event, authHeaders: _authHeaders, onSave }) {
  const AXESS_DEFAULTS = {
    primary_color: '#00C37A',
    background_color: '#0a1628',
    card_color: '#1a1d2e',
    text_color: '#ffffff',
    button_style: 'rounded',
  }

  const [design, setDesign] = useState({
    ...AXESS_DEFAULTS,
    ...(event?.display_config || {}),
  })

  const updateDesign = (key, val) => {
    setDesign((d) => ({ ...d, [key]: val }))
    setForm((f) => ({ ...f, display_config: { ...(f.display_config || {}), [key]: val } }))
  }

  const resetToDefaults = () => {
    setDesign(AXESS_DEFAULTS)
    setForm((f) => ({ ...f, display_config: AXESS_DEFAULTS }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)',
        background: design.background_color,
      }}
      >
        <div style={{ height: 60, background: design.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#000', fontWeight: 800, fontSize: 14 }}>{event?.title || 'שם האירוע'}</span>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ height: 8, borderRadius: 4, background: design.primary_color, width: '60%', marginBottom: 8 }} />
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', width: '80%', marginBottom: 6 }} />
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', width: '70%', marginBottom: 12 }} />
          <div style={{
            height: 32, borderRadius: design.button_style === 'pill' ? 16 : design.button_style === 'square' ? 0 : 8,
            background: design.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          >
            <span style={{ color: '#000', fontWeight: 700, fontSize: 12 }}>רכוש כרטיס</span>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>צבעים</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'primary_color', label: 'צבע ראשי (כפתורים)' },
            { key: 'background_color', label: 'רקע' },
            { key: 'card_color', label: 'צבע כרטיסים' },
            { key: 'text_color', label: 'צבע טקסט' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={design[key] || AXESS_DEFAULTS[key]}
                  onChange={(e) => updateDesign(key, e.target.value)}
                  style={{ width: 40, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2 }}
                />
                <input
                  value={design[key] || ''}
                  onChange={(e) => updateDesign(key, e.target.value)}
                  style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', padding: '0 8px', fontSize: 12 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>סגנון כפתורים</h4>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'rounded', label: 'מעוגל', radius: 8 },
            { value: 'pill', label: 'עגול', radius: 50 },
            { value: 'square', label: 'ישר', radius: 0 },
          ].map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => updateDesign('button_style', style.value)}
              style={{
                flex: 1, height: 40, borderRadius: style.radius,
                border: design.button_style === style.value ? `2px solid ${design.primary_color}` : '1px solid var(--glass-border)',
                background: design.button_style === style.value ? `${design.primary_color}22` : 'var(--glass)',
                color: design.button_style === style.value ? design.primary_color : 'var(--text)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={resetToDefaults} style={{
          flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)',
          background: 'transparent', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13,
        }}
        >
          איפוס לברירת מחדל AXESS
        </button>
        <button type="button" onClick={onSave} style={{
          flex: 2, height: 40, borderRadius: 8, border: 'none',
          background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
        }}
        >
          שמור עיצוב
        </button>
      </div>
    </div>
  )
}

function SummaryTab({ event, form, authHeaders, onNavigateToCampaigns }) {
  const [previewMode, setPreviewMode] = useState('mobile')
  const [shareTab, setShareTab] = useState('default')
  const [shareMessages, setShareMessages] = useState({
    default: form.share_messages?.default || '',
    whatsapp: form.share_messages?.whatsapp || '',
    sms: form.share_messages?.sms || '',
    instagram: form.share_messages?.instagram || '',
  })
  const [savingShare, setSavingShare] = useState(false)

  useEffect(() => {
    // בנה ברירת מחדל מתיאור האירוע
    const stripHtml = (html) => (html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/h[1-6]>/gi, ' ')
      .replace(/<\/div>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300)

    const defaultMsg = form.share_messages?.default ||
      stripHtml(form.description || event?.description || '')

    setShareMessages({
      default: defaultMsg,
      whatsapp: form.share_messages?.whatsapp || '',
      sms: form.share_messages?.sms || '',
      instagram: form.share_messages?.instagram || '',
    })
  }, [form.share_messages, form.description, event?.description])

  const eventUrl = `https://axess.pro/e/${form.slug || event?.slug || ''}`

  const saveShareMessages = async (silent = false) => {
    if (!event?.id || !authHeaders) return false
    setSavingShare(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ share_messages: shareMessages }),
      })
      if (res.ok) {
        if (!silent) toast.success('הודעות השיתוף נשמרו ✓')
        return true
      }
      if (!silent) toast.error('שגיאה בשמירה')
      return false
    } catch {
      if (!silent) toast.error('שגיאה בחיבור לשרת')
      return false
    } finally {
      setSavingShare(false)
    }
  }

  const activeMessage = shareMessages[shareTab] || shareMessages.default || ''
  const fullMessage = `${activeMessage}\n${eventUrl}`
  const maxChars = shareTab === 'sms' ? 160 : 500

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { value: 'mobile', label: '📱 מובייל' },
          { value: 'desktop', label: '🖥️ דסקטופ' },
          { value: 'whatsapp', label: '💬 WhatsApp' },
        ].map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setPreviewMode(mode.value)}
            style={{
              flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: previewMode === mode.value ? 'rgba(0,195,122,0.15)' : 'var(--glass)',
              color: previewMode === mode.value ? '#00C37A' : 'var(--text)',
              fontWeight: previewMode === mode.value ? 700 : 400, fontSize: 13,
              borderBottom: previewMode === mode.value ? '2px solid #00C37A' : '2px solid transparent',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {previewMode === 'mobile' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 320, border: '8px solid #222', borderRadius: 36, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ height: 20, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 60, height: 4, borderRadius: 2, background: '#444' }} />
            </div>
            <iframe
              src={eventUrl}
              style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
              title="תצוגה מקדימה מובייל"
            />
          </div>
        </div>
      )}

      {previewMode === 'desktop' && (
        <div style={{ border: '1px solid var(--glass-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ height: 28, background: '#222', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
            <div style={{ flex: 1, height: 16, borderRadius: 4, background: '#333', margin: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#888' }}>{eventUrl}</span>
            </div>
          </div>
          <iframe
            src={eventUrl}
            style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
            title="תצוגה מקדימה דסקטופ"
          />
        </div>
      )}

      {previewMode === 'whatsapp' && (
        <div style={{ background: '#0a1628', borderRadius: 12, padding: 16, border: '1px solid var(--glass-border)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--v2-gray-400)', textAlign: 'center' }}>
            כך ייראה הלינק בשיתוף WhatsApp
          </p>
          <div style={{ background: '#1e2d1e', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(37,211,102,0.3)', maxWidth: 280, margin: '0 auto' }}>
            {(form.cover_image_url || event?.cover_image_url) && (
              <img
                src={form.cover_image_url || event?.cover_image_url}
                style={{ width: '100%', height: 140, objectFit: 'cover' }}
                alt="preview"
              />
            )}
            <div style={{ padding: 10 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                {form.title || event?.title}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                {(form.description || event?.description || '')
                  .replace(/<br\s*\/?>/gi, ' ')
                  .replace(/<\/p>/gi, ' ')
                  .replace(/<\/h[1-6]>/gi, ' ')
                  .replace(/<\/div>/gi, ' ')
                  .replace(/<[^>]*>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 150)}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(37,211,102,0.8)' }}>axess.pro</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${form.title || event?.title}\n${eventUrl}`)}`, '_blank')}
              style={{ flex: 1, height: 38, borderRadius: 8, border: 'none', background: '#25D366', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              שתף בWhatsApp
            </button>
            <button type="button" onClick={async () => {
              const result = await copyToClipboard(eventUrl)
              toast[result.success ? 'success' : 'error'](result.message)
            }}
              style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
            >
              העתק לינק
            </button>
          </div>
        </div>
      )}

      {/* הודעות שיתוף */}
      <div style={{
        marginTop: 24,
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        padding: 20,
      }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, textAlign: 'right' }}>
          הודעות שיתוף
        </h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'default', label: 'ברירת מחדל' },
            { id: 'whatsapp', label: '📱 WhatsApp' },
            { id: 'sms', label: '💬 SMS' },
            { id: 'instagram', label: '📸 אינסטגרם' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setShareTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13,
                border: `1px solid ${shareTab === t.id ? '#00C37A' : 'var(--glass-border)'}`,
                background: shareTab === t.id ? 'rgba(0,195,122,0.1)' : 'var(--glass)',
                color: shareTab === t.id ? '#00C37A' : 'var(--text)',
                cursor: 'pointer', fontWeight: shareTab === t.id ? 700 : 400,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <textarea
            value={shareMessages[shareTab] ?? ''}
            onChange={(e) => setShareMessages((prev) => ({ ...prev, [shareTab]: e.target.value }))}
            placeholder={
              shareTab === 'sms'
                ? `הודעת SMS קצרה (עד 160 תווים)... (ברירת מחדל: ${shareMessages.default?.slice(0, 50)}...)`
                : shareTab === 'instagram'
                  ? 'טקסט לאינסטגרם עם האשטאגים... (ריק = ישתמש בברירת מחדל)'
                  : shareTab === 'whatsapp'
                    ? 'הודעת WhatsApp מותאמת... (ריק = ישתמש בברירת מחדל)'
                    : 'ברירת מחדל לכל הפלטפורמות...'
            }
            maxLength={maxChars}
            rows={4}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              background: 'var(--card)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', fontSize: 14, textAlign: 'right',
              resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <span style={{
            position: 'absolute', bottom: 8, left: 12,
            fontSize: 11, color: (shareMessages[shareTab]?.length || 0) > maxChars * 0.9 ? '#ff4444' : 'var(--v2-gray-400)',
          }}
          >
            {shareMessages[shareTab]?.length || 0}
            /
            {maxChars}
          </span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--v2-gray-400)', textAlign: 'right', margin: '0 0 16px' }}>
          🔗 הלינק יצורף אוטומטית:
          {' '}
          <span style={{ color: '#00C37A' }}>{eventUrl}</span>
        </p>

        {activeMessage && (
          <div style={{
            background: 'rgba(0,195,122,0.05)',
            border: '1px solid rgba(0,195,122,0.2)',
            borderRadius: 10, padding: 12, marginBottom: 16,
            fontSize: 13, textAlign: 'right', lineHeight: 1.6,
            color: 'var(--text)', whiteSpace: 'pre-wrap',
          }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--v2-gray-400)' }}>תצוגה מקדימה:</p>
            {activeMessage}
            {'\n'}
            <span style={{ color: '#00C37A' }}>{eventUrl}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

          <button
            type="button"
            onClick={saveShareMessages}
            disabled={savingShare}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13,
              background: '#00C37A', color: '#000', border: 'none',
              cursor: 'pointer', fontWeight: 700,
              opacity: savingShare ? 0.6 : 1,
            }}
          >
            {savingShare ? 'שומר...' : 'שמור הודעות'}
          </button>

          {(shareTab === 'whatsapp' || shareTab === 'default') && (
            <button
              type="button"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank')}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 13,
                background: '#25D366', color: '#fff', border: 'none',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              📱 שתף בWhatsApp
            </button>
          )}

          {shareTab === 'sms' && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const result = await copyToClipboard(fullMessage, 'הועתק ✓')
                  toast[result.success ? 'success' : 'error'](result.message)
                }}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13,
                  background: 'var(--glass)', color: 'var(--text)',
                  border: '1px solid var(--glass-border)', cursor: 'pointer',
                }}
              >
                📋 העתק טקסט
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveShareMessages(true)
                  if (onNavigateToCampaigns) {
                    onNavigateToCampaigns({
                      type: 'sms',
                      message: fullMessage,
                    })
                  }
                }}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13,
                  background: 'rgba(0,195,122,0.1)', color: '#00C37A',
                  border: '1px solid rgba(0,195,122,0.3)', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📨 צור קמפיין SMS
              </button>
            </>
          )}

          {shareTab === 'instagram' && (
            <button
              type="button"
              onClick={async () => {
                const result = await copyToClipboard(fullMessage, 'הועתק לאינסטגרם ✓')
                toast[result.success ? 'success' : 'error'](result.message)
              }}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: 13,
                background: 'var(--glass)', color: 'var(--text)',
                border: '1px solid var(--glass-border)', cursor: 'pointer',
              }}
            >
              📸 העתק לאינסטגרם
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function WebviewTab({ event, authHeaders, businessId: _businessId }) {
  const webviewUrl = `https://axess.pro/w/${event?.slug}`
  const [webviewEnabled, setWebviewEnabled] = useState(event?.display_config?.webview_enabled || false)

  const toggleWebview = async () => {
    const newVal = !webviewEnabled
    setWebviewEnabled(newVal)
    await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ display_config: { ...(event.display_config || {}), webview_enabled: newVal } }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--glass)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Webview פעיל</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--v2-gray-400)' }}>
            דף נחיתה מוכן לשיווק בWhatsApp
          </p>
        </div>
        <div onClick={toggleWebview} style={{
          width: 48, height: 26, borderRadius: 13, cursor: 'pointer', position: 'relative',
          background: webviewEnabled ? '#00C37A' : 'rgba(255,255,255,0.1)',
          transition: 'background 0.2s',
        }}
        >
          <div style={{
            position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', left: webviewEnabled ? 25 : 3,
          }}
          />
        </div>
      </div>

      {webviewEnabled && (
        <>
          <div style={{ background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 10, padding: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700 }}>לינק Webview:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={webviewUrl} readOnly style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: '#00C37A', padding: '0 10px', fontSize: 12 }} />
              <button type="button" onClick={async () => {
                const result = await copyToClipboard(webviewUrl)
                toast[result.success ? 'success' : 'error'](result.message)
              }}
                style={{ padding: '0 12px', borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
              >
                העתק
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => window.open(webviewUrl, '_blank')}
              style={{ flex: 1, height: 40, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Globe size={14} /> פתח Webview
            </button>
            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(webviewUrl)}`, '_blank')}
              style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: '#25D366', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              שתף בWA
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FAQEditTab({ event, form, setForm, authHeaders }) {
  const [faqs, setFaqs] = useState(() => {
    try {
      return Array.isArray(form.faq) ? form.faq : JSON.parse(form.faq || '[]')
    } catch {
      return []
    }
  })
  const [saving, setSaving] = useState(false)

  const addFaq = () => setFaqs((prev) => [...prev, { question: '', answer: '' }])

  const saveFaqs = async () => {
    setSaving(true)
    await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ faq: faqs }),
    })
    setForm((f) => ({ ...f, faq: faqs }))
    setSaving(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--v2-gray-400)' }}>שאלות שיוצגו בדף האירוע</p>
        <button
          type="button"
          onClick={addFaq}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#00C37A',
            color: '#000',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          + הוסף שאלה
        </button>
      </div>

      {faqs.map((faq, i) => (
        <div
          key={i}
          style={{
            background: 'var(--glass)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
            border: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>שאלה {i + 1}</span>
            <button
              type="button"
              onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={faq.question}
            onChange={(e) => setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)))}
            placeholder="מה השאלה?"
            style={{
              width: '100%',
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '0 10px',
              fontSize: 13,
              marginBottom: 6,
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={faq.answer}
            onChange={(e) => setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)))}
            placeholder="מה התשובה?"
            rows={2}
            style={{
              width: '100%',
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '8px 10px',
              fontSize: 13,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}

      {faqs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--v2-gray-400)' }}>
          <p>אין שאלות עדיין — לחץ &quot;+ הוסף שאלה&quot;</p>
        </div>
      )}

      <button
        type="button"
        onClick={saveFaqs}
        disabled={saving}
        style={{
          width: '100%',
          height: 42,
          borderRadius: 8,
          border: 'none',
          background: '#00C37A',
          color: '#000',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        {saving ? 'שומר...' : 'שמור שאלות'}
      </button>
    </div>
  )
}

function ScanStationsTab({ eventId, authHeaders, eventSlug }) {
  const [tokens, setTokens] = useState([])
  const [label, setLabel] = useState('')
  const [newTokenResult, setNewTokenResult] = useState(null)
  const [stationStaff, setStationStaff] = useState({})

  const loadStations = () => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/staff-tokens`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTokens(Array.isArray(d) ? d : []))
  }

  useEffect(() => {
    loadStations()
  }, [eventId])

  const copy = async (text) => {
    const result = await copyToClipboard(text)
    toast[result.success ? 'success' : 'error'](result.message)
  }

  const draftFor = (stationId) => stationStaff[stationId] || { name: '', phone: '' }
  const setDraftFor = (stationId, field, value) => {
    setStationStaff((prev) => ({
      ...prev,
      [stationId]: { ...(prev[stationId] || { name: '', phone: '' }), [field]: value },
    }))
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <QrCode size={18} color="#00C37A" /> עמדות סריקה
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
        צור לינקים לעמדות סריקה נפרדות (כניסה, בר, VIP וכו׳)
      </p>

      {tokens.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {tokens.map((station) => {
            const scanners = stationScannersFromMetadata(station)
            const draft = draftFor(station.id)
            return (
              <div
                key={station.id || station.token}
                style={{
                  padding: 12,
                  background: 'var(--glass)',
                  borderRadius: 10,
                  marginBottom: 8,
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{station.label || 'עמדת סריקה'}</span>
                    <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {station.scans_count || 0} סריקות</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(`${FRONTEND_URL}/scan/${eventSlug}?token=${station.token}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: '#00C37A',
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <Copy size={14} /> העתק לינק
                  </button>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--v2-gray-400)' }}>סורקים בעמדה:</p>
                  {scanners.map((scanner, i) => {
                    const wa = waMeDigits(scanner.phone)
                    const scanUrl = `https://axess.pro/v/${station.token}`
                    const msg = `שלום ${scanner.name}! לינק עמדת סריקה שלך: ${scanUrl}`
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, flex: 1 }}>
                          {scanner.name} · {scanner.phone}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!wa) return
                            window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank')
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', fontSize: 11 }}
                        >
                          שלח WA
                        </button>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraftFor(station.id, 'name', e.target.value)}
                      placeholder="שם סורק"
                      style={{
                        flex: 2,
                        minWidth: 80,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      value={draft.phone}
                      onChange={(e) => setDraftFor(station.id, 'phone', e.target.value)}
                      placeholder="נייד WA"
                      style={{
                        flex: 2,
                        minWidth: 80,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        padding: '0 8px',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!draft.name || !draft.phone) return
                        const updatedScanners = [...scanners, { name: draft.name, phone: draft.phone }]
                        await fetch(`${API_BASE}/api/admin/events/${eventId}/scan-stations/${station.id}`, {
                          method: 'PATCH',
                          headers: authHeaders(),
                          body: JSON.stringify({ scanners: updatedScanners }),
                        })
                        setStationStaff((prev) => ({ ...prev, [station.id]: { name: '', phone: '' } }))
                        loadStations()
                      }}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#00C37A',
                        color: '#000',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="שם עמדה (אופציונלי)"
          style={{
            flex: 1,
            minWidth: 140,
            height: 40,
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--card)',
            color: 'var(--text)',
            padding: '0 12px',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={async () => {
            if (!eventId) return
            try {
              const r = await fetch(`${API_BASE}/api/admin/events/${eventId}/staff-tokens`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ label: label || 'עמדת סריקה' }),
              })
              const data = await r.json()
              if (!r.ok) throw new Error(data.error || 'שגיאה')
              setNewTokenResult({ scan_url: data.scan_url })
              setLabel('')
              loadStations()
            } catch {
              setNewTokenResult(null)
            }
          }}
          style={{
            padding: '0 16px',
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: '#00C37A',
            color: '#000',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          צור עמדה
        </button>
      </div>

      {newTokenResult && (
        <div
          style={{
            padding: 14,
            background: 'rgba(0,195,122,0.12)',
            border: '1px solid rgba(0,195,122,0.35)',
            borderRadius: 10,
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>לינק חדש</div>
          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 10, wordBreak: 'break-all' }}>
            {newTokenResult.scan_url}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => copy(newTokenResult.scan_url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#00C37A',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Copy size={14} /> העתק
            </button>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(newTokenResult.scan_url)}`}
              alt="QR"
              style={{ width: 80, height: 80, borderRadius: 8 }}
            />
          </div>
          <button
            type="button"
            onClick={() => setNewTokenResult(null)}
            style={{
              marginTop: 10,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: 'var(--v2-gray-400)',
              cursor: 'pointer',
            }}
          >
            סגור
          </button>
        </div>
      )}
    </div>
  )
}
