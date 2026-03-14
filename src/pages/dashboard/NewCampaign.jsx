import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Users, FileText, Calendar, QrCode, Send,
  ChevronRight, ChevronLeft, Check, X, AlertCircle,
  ToggleLeft, ToggleRight, Eye, Phone
} from 'lucide-react'
import StepIndicator from '@/components/ui/StepIndicator'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin
const STEPS = ['העלאה', 'נמענים', 'הודעה', 'תזמון', 'Text Lead', 'Validator', 'שליחה']
const MAX_CHARS = 201

/* ── shared style tokens ── */
const S = {
  card: { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '20px' },
  cardSm: { background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px' },
  surfaceSm: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px' },
  muted: { color: 'var(--v2-gray-400)' },
  primary: { color: 'var(--v2-primary)' },
  accent: { color: 'var(--v2-accent)' },
  divider: { borderBottom: '1px solid var(--glass-border)' },
  h2: { fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 700, fontSize: 20, color: '#ffffff', marginBottom: 4 },
}

const MOCK_RECIPIENTS = [
  { id: 1, name: 'דני כהן',   phone: '050-1234567', tags: ['לקוח קבוע'], score: 85 },
  { id: 2, name: 'מיכל לוי',  phone: '052-9876543', tags: ['חדש'],        score: 42 },
  { id: 3, name: 'יוסי ברק',  phone: '054-5555555', tags: ['VIP'],        score: 96 },
  { id: 4, name: 'שרה גולן',  phone: '058-1111222', tags: ['לקוח קבוע'], score: 71 },
  { id: 5, name: 'אבי שמיר',  phone: '050-7777888', tags: ['חדש'],        score: 28 },
  { id: 6, name: 'רחל אברהם', phone: '052-3334455', tags: ['VIP'],        score: 91 },
]

/* ── Step 1: Upload ── */
function StepUpload({ onNext, data, setData, businessId }) {
  const [dragging, setDragging] = useState(false)
  const [events, setEvents] = useState([])
  const fileRef = useRef(null)

  useEffect(() => {
    if (businessId) fetch(`${API_BASE}/api/admin/events?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(setEvents).catch(() => [])
  }, [businessId])

  const handleFile = (file) => {
    if (!file) return
    setData(d => ({ ...d, fileName: file.name, recipientCount: Math.floor(Math.random() * 500 + 50) }))
  }

  const dropStyle = {
    border: `2px dashed ${dragging ? 'var(--v2-primary)' : data.fileName ? 'var(--v2-accent)' : 'var(--glass-border)'}`,
    background: dragging ? 'rgba(0,195,122,0.06)' : data.fileName ? 'rgba(99,102,241,0.04)' : 'transparent',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={S.h2}>העלה רשימת נמענים</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>CSV, Excel, או הדבקת מספרים ישירות</p>
      </div>

      <div
        style={dropStyle}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {data.fileName ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={28} style={{ color: 'var(--v2-accent)' }} />
            </div>
            <div style={{ color: '#ffffff', fontWeight: 600 }}>{data.fileName}</div>
            <div style={{ color: 'var(--v2-accent)', fontSize: 14 }}>{data.recipientCount?.toLocaleString('he-IL')} נמענים נמצאו</div>
            <button onClick={e => { e.stopPropagation(); setData(d => ({ ...d, fileName: null, recipientCount: null })) }}
              style={{ fontSize: 12, color: 'var(--v2-gray-400)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> הסר קובץ
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} style={{ color: 'var(--v2-gray-400)' }} />
            </div>
            <div style={{ color: '#ffffff', fontWeight: 500 }}>גרור קובץ לכאן</div>
            <div style={{ ...S.muted, fontSize: 14 }}>או לחץ לבחירת קובץ</div>
            <div style={{ ...S.muted, fontSize: 12 }}>CSV, XLS, XLSX</div>
          </div>
        )}
      </div>

      {/* Link to event */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>קשר לאירוע קיים</span>
          <div onClick={() => setData(d => ({ ...d, linkToEvent: !d.linkToEvent, selectedEventId: d.linkToEvent ? null : d.selectedEventId }))} style={{ width: 48, height: 24, borderRadius: 9999, background: data.linkToEvent ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)', border: data.linkToEvent ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: data.linkToEvent ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
          </div>
        </div>
        {data.linkToEvent && (
          <select value={data.selectedEventId || ''} onChange={e => setData(d => ({ ...d, selectedEventId: e.target.value || null }))} className="input" style={{ width: '100%' }}>
            <option value="">בחר אירוע</option>
            {events.filter(e => e.status === 'published' || e.status === 'active').map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.slug}</option>)}
          </select>
        )}
      </div>

      {/* OR divider */}
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--glass-border)' }} />
        <span style={{ position: 'relative', background: 'var(--v2-dark-3)', padding: '0 12px', fontSize: 12, color: 'var(--v2-gray-400)' }}>או</span>
      </div>

      <div>
        <label className="label">הדבק מספרי טלפון (שורה לכל מספר)</label>
        <textarea
          className="input"
          style={{ resize: 'none' }}
          rows={4}
          placeholder={"050-1234567\n052-9876543\n054-5555555"}
          value={data.pastedNumbers || ''}
          onChange={e => {
            const lines = e.target.value.split('\n').filter(l => l.trim())
            setData(d => ({ ...d, pastedNumbers: e.target.value, recipientCount: lines.length || null }))
          }}
        />
        {data.pastedNumbers && (
          <div style={{ fontSize: 12, color: 'var(--v2-accent)', marginTop: 4 }}>
            {data.pastedNumbers.split('\n').filter(l => l.trim()).length} מספרים
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onNext} disabled={!data.fileName && !data.pastedNumbers} className="btn-primary">
          המשך <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 2: Recipients ── */
function StepRecipients({ onNext, onPrev, data, setData }) {
  const preselected = data.preselectedRecipients || []
  const allRecipients = [...preselected, ...MOCK_RECIPIENTS.filter(r => !preselected.some(p => p.phone === r.phone))]
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(() => new Set([...preselected.map(r => r.id), ...MOCK_RECIPIENTS.map(r => r.id)]))

  const filtered = allRecipients.filter(r =>
    r.name.includes(filter) || r.phone.includes(filter) || r.tags.some(t => t.includes(filter))
  )

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>בחר נמענים</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>{selected.size} נמענים נבחרו</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input className="input" style={{ flex: 1 }} placeholder="סנן לפי שם, טלפון, תגית..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button onClick={toggleAll} className="btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
          {selected.size === filtered.length ? 'בטל הכל' : 'בחר הכל'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map(r => {
          const isSelected = selected.has(r.id)
          return (
            <div
              key={r.id}
              onClick={() => { const s = new Set(selected); s.has(r.id) ? s.delete(r.id) : s.add(r.id); setSelected(s) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 'var(--radius-md)', border: `1px solid ${isSelected ? 'rgba(0,195,122,0.4)' : 'var(--glass-border)'}`,
                background: isSelected ? 'rgba(0,195,122,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                background: isSelected ? 'var(--v2-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isSelected && <Check size={12} style={{ color: 'var(--v2-dark)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{r.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {r.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', color: 'var(--v2-gray-400)', border: '1px solid var(--glass-border)' }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: r.score >= 70 ? 'var(--v2-primary)' : r.score >= 40 ? '#F59E0B' : '#EF4444' }}>
                {r.score}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button
          onClick={() => {
            const ids = [...selected]
            const phones = allRecipients.filter(r => selected.has(r.id)).map(r => r.phone)
            setData(d => ({ ...d, selectedRecipientIds: ids, selectedRecipientPhones: phones }))
            onNext()
          }}
          disabled={selected.size === 0}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          המשך ({selected.size}) <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 3: Message ── */
function StepMessage({ onNext, onPrev, data, setData }) {
  const chars = (data.message || '').length
  const isOver = chars > MAX_CHARS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>כתוב הודעה</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>עד {MAX_CHARS} תווים במחיר הודעה אחת</p>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label className="label" style={{ marginBottom: 0 }}>תוכן ההודעה</label>
          <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: isOver ? '#F87171' : chars > 180 ? '#F59E0B' : 'var(--v2-gray-400)' }}>
            {chars}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          className="input"
          style={{ resize: 'none', boxShadow: isOver ? '0 0 0 2px rgba(239,68,68,0.3)' : 'none', borderColor: isOver ? 'rgba(239,68,68,0.4)' : undefined }}
          rows={5}
          placeholder="שלום {שם}, קפה רוטשילד מזמינים אותך..."
          value={data.message || ''}
          onChange={e => setData(d => ({ ...d, message: e.target.value }))}
        />
        {isOver && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', fontSize: 12, marginTop: 4 }}>
            <AlertCircle size={12} />
            ההודעה ארוכה מדי — תחויב על {Math.ceil(chars / MAX_CHARS)} הודעות
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>משתנים זמינים:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['{שם}', '{עסק}', '{תאריך}', '{קוד}'].map(v => (
            <button key={v} onClick={() => setData(d => ({ ...d, message: (d.message || '') + v }))}
              style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(0,195,122,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--v2-gray-400)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
            >{v}</button>
          ))}
        </div>
      </div>

      {data.message && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Eye size={14} style={{ color: 'var(--v2-gray-400)' }} />
            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)', fontWeight: 500 }}>תצוגה מקדימה</span>
          </div>
          <div style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.7 }}>
            {(data.message || '').replace('{שם}', 'דני').replace('{עסק}', 'קפה רוטשילד').replace('{תאריך}', '01/03/2026').replace('{קוד}', 'AX-2847')}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button onClick={onNext} disabled={!data.message || isOver} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          המשך <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 4: Schedule ── */
function StepSchedule({ onNext, onPrev, data, setData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>תזמון שליחה</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>מתי לשלוח את הקמפיין?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { value: 'now', label: 'שלח עכשיו', desc: 'הקמפיין יישלח מיד', icon: '⚡' },
          { value: 'scheduled', label: 'תזמן לשעה מסוימת', desc: 'בחר תאריך ושעה', icon: '📅' },
        ].map(opt => {
          const isActive = data.scheduleType === opt.value
          return (
            <div key={opt.value} onClick={() => setData(d => ({ ...d, scheduleType: opt.value }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 'var(--radius-md)', border: `2px solid ${isActive ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                background: isActive ? 'rgba(0,195,122,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 24 }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{opt.desc}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isActive ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                background: isActive ? 'var(--v2-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--v2-dark)' }} />}
              </div>
            </div>
          )
        })}
      </div>

      {data.scheduleType === 'scheduled' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">תאריך</label>
            <input type="date" className="input" value={data.scheduleDate || ''} onChange={e => setData(d => ({ ...d, scheduleDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">שעה</label>
            <input type="time" className="input" value={data.scheduleTime || ''} onChange={e => setData(d => ({ ...d, scheduleTime: e.target.value }))} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button onClick={onNext} disabled={!data.scheduleType || (data.scheduleType === 'scheduled' && !data.scheduleDate)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          המשך <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 5: Text Lead ── */
const VIRTUAL_NUMBER_REGEX = /^05\d{8}$/

function StepTextLead({ onNext, onPrev, data, setData }) {
  const enabled = !!data.textLeadEnabled
  const number = data.virtualNumber || ''
  const isValid = !enabled || VIRTUAL_NUMBER_REGEX.test(number.replace(/-/g, ''))
  const showError = enabled && number.length > 0 && !isValid

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>Text Lead — מספר וירטואלי</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>אפשר ללקוחות להשיב להודעה שלך</p>
      </div>

      {/* Toggle card */}
      <div
        onClick={() => setData(d => ({ ...d, textLeadEnabled: !d.textLeadEnabled, virtualNumber: d.textLeadEnabled ? '' : d.virtualNumber }))}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
          borderRadius: 'var(--radius-md)', border: `2px solid ${enabled ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
          background: enabled ? 'rgba(0,195,122,0.05)' : 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: enabled ? 'rgba(0,195,122,0.12)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Phone size={18} style={{ color: enabled ? 'var(--v2-primary)' : 'var(--v2-gray-400)' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>אפשר לקהל להשיב להודעה</div>
            <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>כל תשובה תגיע אליך ישירות ב-WhatsApp</div>
          </div>
        </div>
        {/* Toggle switch */}
        <div style={{ width: 48, height: 24, borderRadius: 9999, background: enabled ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)', border: enabled ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0, transition: 'all 0.2s' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: enabled ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {enabled && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">מספר וירטואלי</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 12, color: 'var(--v2-gray-400)', pointerEvents: 'none' }} />
              <input
                className="input"
                style={{
                  paddingRight: 36,
                  boxShadow: showError ? '0 0 0 2px rgba(239,68,68,0.3)' : number && isValid ? '0 0 0 2px rgba(0,195,122,0.4)' : 'none',
                  borderColor: showError ? 'rgba(239,68,68,0.4)' : number && isValid ? 'rgba(0,195,122,0.4)' : undefined,
                }}
                placeholder="05XXXXXXXX"
                value={number}
                maxLength={10}
                onChange={e => { const val = e.target.value.replace(/[^\d]/g, ''); setData(d => ({ ...d, virtualNumber: val })) }}
                dir="ltr"
              />
              {number && isValid && <Check size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 12, color: 'var(--v2-primary)' }} />}
            </div>
            {showError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', fontSize: 12, marginTop: 6 }}>
                <AlertCircle size={12} /> מספר לא תקין
              </div>
            )}
            {number && isValid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--v2-primary)', fontSize: 12, marginTop: 6 }}>
                <Check size={12} /> המספר תקין
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(0,195,122,0.05)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📞</span>
            <div style={{ fontSize: 14, color: 'var(--v2-gray-400)', lineHeight: 1.7 }}>
              תשובות מהקהל יגיעו אליך ישירות ב-WhatsApp
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button onClick={onNext} disabled={enabled && !isValid} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          המשך <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 6: Validator ── */
function StepValidator({ onNext, onPrev, data, setData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>הוסף Validator</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>כרטיס/קופון דיגיטלי לכל נמען</p>
      </div>

      <div
        onClick={() => setData(d => ({ ...d, validatorEnabled: !d.validatorEnabled }))}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>הפעל Validator</div>
          <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>כל נמען יקבל קישור ייחודי לקופון</div>
        </div>
        <div style={{ width: 48, height: 24, borderRadius: 9999, background: data.validatorEnabled ? 'var(--v2-primary)' : 'rgba(255,255,255,0.08)', border: data.validatorEnabled ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', padding: '0 4px', transition: 'all 0.2s' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: data.validatorEnabled ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {data.validatorEnabled && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">סוג Validator</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'coupon', label: 'קופון הנחה', icon: '🎫' },
                { value: 'ticket', label: 'כרטיס כניסה', icon: '🎟️' },
                { value: 'benefit', label: 'הטבה', icon: '🎁' },
                { value: 'confirm', label: 'אישור הזמנה', icon: '✅' },
              ].map(opt => {
                const isActive = data.validatorType === opt.value
                return (
                  <div key={opt.value} onClick={() => setData(d => ({ ...d, validatorType: opt.value }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: `1px solid ${isActive ? 'var(--v2-primary)' : 'var(--glass-border)'}`,
                      background: isActive ? 'rgba(0,195,122,0.06)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      color: isActive ? '#ffffff' : 'var(--v2-gray-400)',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <label className="label">כותרת הקופון</label>
            <input className="input" placeholder="20% הנחה על ארוחת בוקר" value={data.validatorTitle || ''} onChange={e => setData(d => ({ ...d, validatorTitle: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">תוקף עד</label>
              <input type="date" className="input" value={data.validatorExpiry || ''} onChange={e => setData(d => ({ ...d, validatorExpiry: e.target.value }))} />
            </div>
            <div>
              <label className="label">מגבלת מימוש</label>
              <select className="input" value={data.validatorLimit || 'once'} onChange={e => setData(d => ({ ...d, validatorLimit: e.target.value }))}>
                <option value="once">פעם אחת</option>
                <option value="unlimited">ללא הגבלה</option>
                <option value="3">עד 3 פעמים</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button onClick={onNext} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          המשך <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 7: Summary ── */
function StepSummary({ onPrev, data, onSubmit, selectedEvent, businessId, authHeaders }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const businessIdRef = useRef(businessId)
  businessIdRef.current = businessId

  const handleSend = async () => {
    let effectiveBusinessId = businessIdRef.current
    if (!effectiveBusinessId) {
      let waited = 0
      while (waited < 3000) {
        await new Promise(r => setTimeout(r, 100))
        waited += 100
        effectiveBusinessId = businessIdRef.current
        if (effectiveBusinessId) break
      }
      if (!effectiveBusinessId) {
        alert('שגיאה: לא נמצא מזהה עסק. נסה לרענן את הדף.')
        setSending(false)
        return
      }
    }
    if (!authHeaders) {
      setError('לא מחובר — התחבר למערכת')
      return
    }
    setSending(true)
    setError('')
    try {
      const recipientPhones = data.pastedNumbers
        ? data.pastedNumbers.split('\n').map(l => l.trim()).filter(Boolean)
        : (data.selectedRecipientPhones || [])
      const recipientCount = Math.max(data.recipientCount || 0, recipientPhones.length)
      if (recipientPhones.length === 0 && recipientCount === 0) {
        setError('בחר נמענים או הדבק מספרי טלפון')
        setSending(false)
        return
      }
      const createBody = {
        business_id: effectiveBusinessId,
        name: data.linkToEvent && selectedEvent ? `קמפיין אירוע: ${selectedEvent.title}` : undefined,
        message: data.message,
        schedule_type: data.scheduleType || 'now',
        schedule_date: data.scheduleType === 'scheduled' && data.scheduleDate ? `${data.scheduleDate}T${data.scheduleTime || '09:00'}:00` : null,
        recipient_count: recipientCount,
        event_page_id: data.selectedEventId || null,
        text_lead_enabled: !!data.textLeadEnabled,
        virtual_number: data.virtualNumber || null,
        validator_enabled: !!data.validatorEnabled,
        validator_type: data.validatorType || null,
        validator_title: data.validatorTitle || null,
        validator_expiry: data.validatorExpiry || null,
        validator_limit: data.validatorLimit || null,
        recipient_phones: recipientPhones,
      }
      const createUrl = `${API_BASE}/api/admin/campaigns`
      const createHeaders = authHeaders()
      console.log('[handleSend] POST create — URL:', createUrl, 'headers:', createHeaders, 'body:', createBody)
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: createHeaders,
        body: JSON.stringify(createBody),
      })
      const createData = await createRes.json().catch(() => ({}))
      console.log('[handleSend] POST create — status:', createRes.status, 'response:', createData)
      if (!createRes.ok) {
        throw new Error(createData.error || 'שגיאה ביצירת קמפיין')
      }
      const campaignId = createData.id
      const sendUrl = `${API_BASE}/api/admin/campaigns/${campaignId}/send`
      const sendBody = {}
      const sendHeaders = authHeaders()
      console.log('[handleSend] POST send — URL:', sendUrl, 'headers:', sendHeaders, 'body:', sendBody)
      const sendRes = await fetch(sendUrl, {
        method: 'POST',
        headers: sendHeaders,
        body: JSON.stringify(sendBody),
      })
      const sendData = await sendRes.json().catch(() => ({}))
      console.log('[handleSend] POST send — status:', sendRes.status, 'response:', sendData)
      if (!sendRes.ok) {
        throw new Error(sendData.error || sendData.details?.[0] || 'שגיאה בשליחת קמפיין')
      }
      setDone(true)
    } catch (err) {
      setError(err.message || 'שגיאה בשליחה')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center', gap: 16 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={40} style={{ color: 'var(--v2-accent)' }} />
        </motion.div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>הקמפיין נשלח! 🎉</h2>
        <p style={{ color: 'var(--v2-gray-400)' }}>תוכל לעקוב אחר הביצועים בדוחות</p>
        <button onClick={onSubmit} className="btn-primary" style={{ marginTop: 8 }}>חזור לסקירה כללית</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={S.h2}>סיכום וסיום</h2>
        <p style={{ ...S.muted, fontSize: 14 }}>בדוק את פרטי הקמפיין לפני השליחה</p>
      </div>

      {data.linkToEvent && selectedEvent && (
        <div style={{ background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>קמפיין מקושר לאירוע</div>
          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>קמפיין זה יישלח ל-{data.recipientCount || 0} נמענים ויכלול לינק לאירוע: {FRONTEND_URL}/e/{selectedEvent.slug}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[
          { label: 'קובץ', value: data.fileName || 'הדבקה ידנית' },
          { label: 'נמענים', value: `${data.recipientCount || 6} נמענים` },
          { label: 'הודעה', value: data.message ? `${data.message.length} תווים` : '—' },
          { label: 'תזמון', value: data.scheduleType === 'now' ? 'שליחה מיידית' : `${data.scheduleDate} ${data.scheduleTime || ''}` },
          { label: 'Text Lead', value: data.textLeadEnabled ? (data.virtualNumber || '') : 'לא מופעל' },
          { label: 'Validator', value: data.validatorEnabled ? `✅ ${data.validatorTitle || 'מופעל'}` : 'לא מופעל' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--v2-gray-400)', fontSize: 14 }}>{label}</span>
            <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(0,195,122,0.08)', border: '1px solid rgba(0,195,122,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>עלות משוערת</span>
          <span style={{ fontFamily: "'Bricolage Grotesque',monospace", fontWeight: 800, fontSize: 22, color: 'var(--v2-primary)' }}>
            ₪{((data.recipientCount || 6) * 0.08).toFixed(2)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>
          {data.recipientCount || 6} הודעות × 8 אג׳
        </div>
      </div>

      {error && (
        <div style={{ color: '#F87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronRight size={16} /> חזור</button>
        <button onClick={handleSend} disabled={sending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {sending ? (
            <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />שולח...</>
          ) : (
            <><Send size={16} />שלח קמפיין</>
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Main Wizard ── */
export default function NewCampaign() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, businessId } = useAuth()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({ scheduleType: 'now', validatorEnabled: false })
  const effectiveBusinessId = businessId
  const [events, setEvents] = useState([])

  const processedPreselected = useRef(false)
  useEffect(() => {
    const preselected = location.state?.preselectedRecipient
    if (preselected?.phone && !processedPreselected.current) {
      processedPreselected.current = true
      const rec = { id: 'preselected-' + preselected.phone, phone: preselected.phone, name: preselected.name || preselected.phone, tags: [], score: 0 }
      setData(d => ({
        ...d,
        preselectedRecipients: [rec],
        selectedRecipientPhones: [preselected.phone],
        recipientCount: 1,
      }))
      setStep(2)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    const savedPhones = sessionStorage.getItem('campaign_recipients')
    const savedSegmentName = sessionStorage.getItem('campaign_segment_name')
    if (savedPhones) {
      try {
        const phones = JSON.parse(savedPhones)
        setData(d => ({
          ...d,
          selectedRecipientPhones: phones,
          recipientCount: phones.length,
          segmentLabel: savedSegmentName || d.segmentLabel,
        }))
        setStep(3)
      } catch (_) {}
      sessionStorage.removeItem('campaign_recipients')
      sessionStorage.removeItem('campaign_segment_name')
    }
  }, [])

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json', 'X-Business-Id': effectiveBusinessId }
    if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`
    return h
  }
  useEffect(() => { if (effectiveBusinessId) fetch(`${API_BASE}/api/admin/events?business_id=${effectiveBusinessId}`).then(r => r.ok ? r.json() : []).then(setEvents).catch(() => []) }, [effectiveBusinessId])
  const selectedEvent = data.selectedEventId ? events.find(e => e.id === data.selectedEventId) : null

  const next = () => setStep(s => Math.min(s + 1, 7))
  const prev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }} dir="rtl">
      <div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque','Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#ffffff' }}>
          קמפיין חדש
        </h1>
        <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>עקוב אחר השלבים ליצירת קמפיין</p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
            {step === 1 && <StepUpload onNext={next} data={data} setData={setData} businessId={effectiveBusinessId} />}
            {step === 2 && <StepRecipients onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 3 && <StepMessage onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 4 && <StepSchedule onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 5 && <StepTextLead onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 6 && <StepValidator onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 7 && <StepSummary onPrev={prev} data={data} onSubmit={() => navigate('/dashboard')} selectedEvent={selectedEvent} businessId={effectiveBusinessId} authHeaders={authHeaders} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
