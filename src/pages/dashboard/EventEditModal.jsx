import { useState, useEffect } from 'react'
import { X, Upload, Link, Plus, Trash2, Globe } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const EDIT_TABS = [
  { id: 'basic', label: 'פרטים' },
  { id: 'tickets', label: 'כרטיסים' },
  { id: 'tables', label: 'שולחנות' },
  { id: 'fields', label: 'שדות הרשמה' },
  { id: 'promoters', label: 'יחצ"נים' },
  { id: 'staff', label: 'צוות' },
  { id: 'webview', label: 'Webview' },
]

export default function EventEditModal({ event, onClose, onSave, authHeaders, businessId }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    doors_open: event?.doors_open ? new Date(event.doors_open).toISOString().slice(0, 16) : '',
    event_end: event?.event_end ? new Date(event.event_end).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    venue_name: event?.venue_name || '',
    venue_address: event?.venue_address || '',
    venue_maps_url: event?.venue_maps_url || '',
    description: event?.description || '',
    image_url: event?.image_url || '',
    cover_image_url: event?.cover_image_url || '',
    age_restriction: event?.age_restriction || '',
    dress_code: event?.dress_code || '',
  })
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const saveBasic = async () => {
    setSaving(true)
    await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSuccessMsg('נשמר!')
    setTimeout(() => setSuccessMsg(''), 2000)
    onSave?.()
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
        if (data.url) setForm((f) => ({ ...f, [field]: data.url }))
      } finally {
        setImageUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const eventUrl = `https://axess.pro/e/${event?.slug}`

  return (
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
      <div
        style={{
          background: 'var(--card, #1a1d2e)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--glass-border)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>עריכת אירוע — {event?.title}</h2>
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
          {EDIT_TABS.map((tab) => (
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
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
              onClick={() => navigator.clipboard.writeText(eventUrl)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00C37A', fontSize: 11 }}
            >
              העתק
            </button>
          </div>

          {activeTab === 'basic' && (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    תאריך ושעת התחלה
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
                <div>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    פתיחת דלתות
                  </label>
                  <input
                    type="datetime-local"
                    value={form.doors_open}
                    onChange={(e) => setForm((f) => ({ ...f, doors_open: e.target.value }))}
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
                <div>
                  <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                    סיום האירוע
                  </label>
                  <input
                    type="datetime-local"
                    value={form.event_end}
                    onChange={(e) => setForm((f) => ({ ...f, event_end: e.target.value }))}
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
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  שם המקום
                </label>
                <input
                  value={form.venue_name}
                  onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                  placeholder="שם הקאנסוף/מועדון/אולם"
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
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 4 }}>
                  תיאור קצר
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    color: 'var(--text)',
                    padding: '10px 12px',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--v2-gray-400)', display: 'block', marginBottom: 8 }}>
                  תמונת כרטיס (Banner)
                </label>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                  רזולוציה מומלצת: 1200×630px, עד 2MB
                </p>

                {form.cover_image_url && (
                  <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', height: 120 }}>
                    <img src={form.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                {saving ? 'שומר...' : successMsg || 'שמור שינויים'}
              </button>
            </div>
          )}

          {activeTab === 'tickets' && <TicketsTab eventId={event?.id} authHeaders={authHeaders} />}

          {activeTab === 'tables' && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)' }}>
              <p>הגדרות שולחנות זמינות בטאב &quot;שולחנות&quot; בדף האירוע</p>
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
          )}

          {activeTab === 'fields' && <RegistrationFieldsTab event={event} authHeaders={authHeaders} />}

          {activeTab === 'promoters' && <PromotersTab eventId={event?.id} authHeaders={authHeaders} />}

          {activeTab === 'staff' && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--v2-gray-400)' }}>
              <p>ניהול צוות זמין בטאב &quot;שולחנות&quot; → צוות</p>
            </div>
          )}

          {activeTab === 'webview' && <WebviewTab event={event} authHeaders={authHeaders} businessId={businessId} />}
        </div>
      </div>
    </div>
  )
}

function TicketsTab({ eventId, authHeaders }) {
  const [tickets, setTickets] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newTicket, setNewTicket] = useState({
    name: '',
    description: '',
    price: '',
    quantity_total: '',
    max_per_order: 10,
    ticket_category: 'general',
    status: 'active',
  })

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setTickets(d.ticket_types || d || []))
  }, [eventId, authHeaders])

  const loadTickets = () => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setTickets(d.ticket_types || d || []))
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>סוגי כרטיסים</h3>
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
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> הוסף כרטיס
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

      {showAdd && (
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
              <input
                value={newTicket.price}
                onChange={(e) => setNewTicket((f) => ({ ...f, price: e.target.value }))}
                placeholder="מחיר ₪ *"
                type="number"
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
                value={newTicket.quantity_total}
                onChange={(e) => setNewTicket((f) => ({ ...f, quantity_total: e.target.value }))}
                placeholder="כמות *"
                type="number"
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
                value={newTicket.max_per_order || ''}
                onChange={(e) => setNewTicket((f) => ({ ...f, max_per_order: e.target.value }))}
                placeholder="מקס להזמנה"
                type="number"
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
                  if (!newTicket.name || !newTicket.price || !newTicket.quantity_total) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/ticket-types`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(newTicket),
                  })
                  setShowAdd(false)
                  setNewTicket({
                    name: '',
                    description: '',
                    price: '',
                    quantity_total: '',
                    max_per_order: 10,
                    ticket_category: 'general',
                    status: 'active',
                  })
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
                onClick={() => setShowAdd(false)}
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
    </div>
  )
}

function RegistrationFieldsTab({ event, authHeaders }) {
  const [fields, setFields] = useState(
    event?.registration_fields || [
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
    await fetch(`${API_BASE}/api/admin/events/${event.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ registration_fields: fields }),
    })
    setSaving(false)
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
  const [newPromoter, setNewPromoter] = useState({ name: '', phone: '', commission_pct: 10 })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setPromoters(d.promoters || d || []))
  }, [eventId, authHeaders])

  const loadPromoters = () => {
    if (!eventId) return
    fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setPromoters(d.promoters || d || []))
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
            onClick={() => {
              const url = `https://axess.pro/e/${eventId}?ref=${p.id}`
              navigator.clipboard.writeText(url)
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
              placeholder="שם יחצ'ן *"
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
              placeholder="טלפון"
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
              value={newPromoter.commission_pct}
              onChange={(e) => setNewPromoter((f) => ({ ...f, commission_pct: e.target.value }))}
              placeholder="% עמלה"
              type="number"
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!newPromoter.name) return
                  await fetch(`${API_BASE}/api/admin/events/${eventId}/promoters`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(newPromoter),
                  })
                  setShowAdd(false)
                  setNewPromoter({ name: '', phone: '', commission_pct: 10 })
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

function WebviewTab({ event, authHeaders: _authHeaders, businessId: _businessId }) {
  const webviewUrl = `https://axess.pro/w/${event?.slug}`

  return (
    <div>
      <div
        style={{
          background: 'rgba(0,195,122,0.08)',
          border: '1px solid rgba(0,195,122,0.2)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>Webview של האירוע</p>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--v2-gray-400)' }}>
          דף נחיתה עם רכישת כרטיסים, תפריט וצ&apos;אט עם המארגן
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={webviewUrl}
            readOnly
            style={{
              flex: 1,
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass)',
              color: '#00C37A',
              padding: '0 10px',
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(webviewUrl)}
            style={{
              padding: '0 12px',
              borderRadius: 6,
              border: 'none',
              background: '#00C37A',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            העתק
          </button>
        </div>
      </div>
      <a
        href={`/dashboard/webview?event=${event?.slug}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text)',
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        <Globe size={16} color="#00C37A" /> ערוך Webview של האירוע
      </a>
    </div>
  )
}
