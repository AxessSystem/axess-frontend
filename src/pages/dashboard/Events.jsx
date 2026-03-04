import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Plus, TrendingUp, Users, ExternalLink, Key, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    location_url: '',
    description: '',
    image_url: '',
    primary_color: 'var(--v2-primary)',
    ticket_types: [{ name: 'כניסה', price: 0, quantity_total: null }],
  })
  const businessId = 'placeholder' // TODO: from AuthContext/profile
  const [staffModalEvent, setStaffModalEvent] = useState(null)
  const [staffTokens, setStaffTokens] = useState([])
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [newTokenResult, setNewTokenResult] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [businessId])

  const addTicketType = () => {
    setForm(f => ({ ...f, ticket_types: [...f.ticket_types, { name: '', price: 0, quantity_total: null }] }))
  }
  const updateTicketType = (i, field, val) => {
    setForm(f => ({
      ...f,
      ticket_types: f.ticket_types.map((t, j) => j === i ? { ...t, [field]: val } : t),
    }))
  }

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          title: form.title,
          date: form.date || null,
          location: form.location || null,
          location_url: form.location_url || null,
          description: form.description || null,
          image_url: form.image_url || null,
          display_config: { primary_color: form.primary_color },
          ticket_types: form.ticket_types.filter(t => t.name),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setEvents(prev => [data, ...prev])
      setWizardOpen(false)
      setForm({ title: '', date: '', location: '', description: '', image_url: '', primary_color: 'var(--v2-primary)', ticket_types: [{ name: 'כניסה', price: 0, quantity_total: null }] })
      setStep(1)
      toast.success(`האירוע נוצר! ${data.url}`)
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const openStaffModal = async ev => {
    setStaffModalEvent(ev)
    setNewTokenResult(null)
    setNewTokenLabel('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${ev.id}/staff-tokens`)
      const data = r.ok ? await r.json() : []
      setStaffTokens(Array.isArray(data) ? data : [])
    } catch {
      setStaffTokens([])
    }
  }

  const addStaffToken = async () => {
    if (!staffModalEvent) return
    try {
      const r = await fetch(`${API_BASE}/api/admin/events/${staffModalEvent.id}/staff-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTokenLabel || 'עמדת סריקה' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'שגיאה')
      setNewTokenResult({ token: data.token, scan_url: data.scan_url })
      setStaffTokens(prev => [...prev, { token: data.token, label: newTokenLabel || 'עמדת סריקה', scans_count: 0 }])
      toast.success('עמדת סריקה נוצרה')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  const copyToClipboard = str => {
    navigator.clipboard?.writeText(str).then(() => toast.success('הועתק')).catch(() => toast.error('העתקה נכשלה'))
  }

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>אירועים</h1>
        <button
          onClick={() => setWizardOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--v2-primary)',
            color: 'var(--v2-dark)',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          צור אירוע חדש
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : events.length === 0 ? (
        <div
          style={{
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <Calendar size={48} style={{ color: 'var(--v2-gray-400)', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>אין אירועים עדיין</div>
          <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>צור אירוע ראשון וקבל קישור לשיתוף</div>
          <button
            onClick={() => setWizardOpen(true)}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--v2-primary)',
              color: 'var(--v2-dark)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            צור אירוע
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {events.map(ev => (
            <div
              key={ev.id}
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v2-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{ev.title}</div>
              {ev.date && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 4 }}>{new Date(ev.date).toLocaleDateString('he-IL')}</div>}
              {ev.location && <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 12 }}>{ev.location}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => openStaffModal(ev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--v2-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Key size={14} />
                  עמדות סריקה
                </button>
                <a
                  href={`${FRONTEND_URL}/e/${ev.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--v2-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  פתח דף
                </a>
                <Link
                  to={`/dashboard/reports`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--v2-gray-400)',
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <TrendingUp size={14} />
                  אנליטיקה
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {wizardOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setWizardOpen(false)}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 'var(--radius-lg)',
              padding: 32,
              maxWidth: 480,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>צור אירוע חדש</h2>

            {step === 1 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם האירוע</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="מסיבת ריקודים"
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תאריך ושעה</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>מיקום</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="אולם האירועים, תל אביב"
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>תיאור</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="תיאור קצר"
                    rows={3}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.title}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 'var(--radius-full)',
                    background: form.title ? 'var(--v2-primary)' : 'var(--gray-600)',
                    color: 'var(--v2-dark)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: form.title ? 'pointer' : 'not-allowed',
                  }}
                >
                  המשך
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {form.ticket_types.map((tt, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: 16, background: 'var(--v2-dark-3)', borderRadius: 12 }}>
                    <input
                      value={tt.name}
                      onChange={e => updateTicketType(i, 'name', e.target.value)}
                      placeholder="שם סוג (למשל: VIP)"
                      style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }}
                    />
                    <input
                      type="number"
                      value={tt.price}
                      onChange={e => updateTicketType(i, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="מחיר"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)', color: '#fff' }}
                    />
                  </div>
                ))}
                <button
                  onClick={addTicketType}
                  style={{
                    marginBottom: 20,
                    padding: 10,
                    background: 'transparent',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: 12,
                    color: 'var(--v2-gray-400)',
                    cursor: 'pointer',
                  }}
                >
                  + הוסף סוג כרטיס
                </button>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    חזור
                  </button>
                  <button
                    onClick={handleCreate}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--v2-primary)',
                      color: 'var(--v2-dark)',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    פרסם
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Staff Scan Tokens Modal */}
      {staffModalEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => { setStaffModalEvent(null); setNewTokenResult(null) }}
        >
          <div
            style={{
              background: 'var(--v2-dark-2)',
              borderRadius: 'var(--radius-lg)',
              padding: 32,
              maxWidth: 480,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>🔑 עמדות סריקה — {staffModalEvent.title}</h2>
            <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 24 }}>צור לינקים לעמדות סריקה בודדות (כניסה ראשית, בר, VIP וכו׳)</div>

            {/* Existing tokens */}
            {staffTokens.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {staffTokens.map(t => (
                  <div
                    key={t.id || t.token}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      background: 'var(--v2-dark-3)',
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{t.label || 'עמדת סריקה'}</span>
                      <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {t.scans_count || 0} סריקות</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${FRONTEND_URL}/scan/${staffModalEvent.slug}?token=${t.token}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        background: 'var(--v2-primary)',
                        color: 'var(--v2-dark)',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <Copy size={14} />
                      העתק לינק
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new token */}
            {newTokenResult ? (
              <div
                style={{
                  padding: 16,
                  background: 'rgba(0,195,122,0.15)',
                  border: '1px solid var(--v2-primary)',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>לינק חדש נוצר</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 12, wordBreak: 'break-all' }}>{newTokenResult.scan_url}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => copyToClipboard(newTokenResult.scan_url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      background: 'var(--v2-primary)',
                      color: 'var(--v2-dark)',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <Copy size={16} />
                    העתק לינק
                  </button>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(newTokenResult.scan_url)}`}
                    alt="QR"
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                  />
                </div>
                <button
                  onClick={() => setNewTokenResult(null)}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    color: 'var(--v2-gray-400)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  הוסף עמדה נוספת
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)', fontSize: 14 }}>שם העמדה (למשל: כניסה ראשית, בר, VIP)</label>
                <input
                  value={newTokenLabel}
                  onChange={e => setNewTokenLabel(e.target.value)}
                  placeholder="כניסה ראשית"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    marginBottom: 12,
                  }}
                />
                <button
                  onClick={addStaffToken}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--v2-primary)',
                    color: 'var(--v2-dark)',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Key size={18} />
                  הוסף עמדה
                </button>
              </div>
            )}

            <button
              onClick={() => { setStaffModalEvent(null); setNewTokenResult(null) }}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                color: 'var(--v2-gray-400)',
                cursor: 'pointer',
              }}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
