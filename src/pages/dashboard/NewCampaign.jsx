import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Users, FileText, Calendar, QrCode, Send,
  ChevronRight, ChevronLeft, Check, X, AlertCircle,
  ToggleLeft, ToggleRight, Eye, Phone
} from 'lucide-react'
import StepIndicator from '@/components/ui/StepIndicator'

const STEPS = ['העלאה', 'נמענים', 'הודעה', 'תזמון', 'Text Lead', 'Validator', 'שליחה']

const MAX_CHARS = 201

/* ── Mock recipients ── */
const MOCK_RECIPIENTS = [
  { id: 1, name: 'דני כהן',      phone: '050-1234567', tags: ['לקוח קבוע'], score: 85 },
  { id: 2, name: 'מיכל לוי',     phone: '052-9876543', tags: ['חדש'],        score: 42 },
  { id: 3, name: 'יוסי ברק',     phone: '054-5555555', tags: ['VIP'],        score: 96 },
  { id: 4, name: 'שרה גולן',     phone: '058-1111222', tags: ['לקוח קבוע'], score: 71 },
  { id: 5, name: 'אבי שמיר',     phone: '050-7777888', tags: ['חדש'],        score: 28 },
  { id: 6, name: 'רחל אברהם',    phone: '052-3334455', tags: ['VIP'],        score: 91 },
]

/* ── Step 1: Upload ── */
function StepUpload({ onNext, data, setData }) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setData(d => ({ ...d, fileName: file.name, recipientCount: Math.floor(Math.random() * 500 + 50) }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">העלה רשימת נמענים</h2>
        <p className="text-muted text-sm">CSV, Excel, או הדבקת מספרים ישירות</p>
      </div>

      {/* Drag & Drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-primary bg-primary/10'
            : data.fileName
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-primary/50 hover:bg-surface-50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />

        {data.fileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Check size={28} className="text-accent" />
            </div>
            <div className="text-white font-semibold">{data.fileName}</div>
            <div className="text-accent text-sm">{data.recipientCount?.toLocaleString('he-IL')} נמענים נמצאו</div>
            <button
              onClick={e => { e.stopPropagation(); setData(d => ({ ...d, fileName: null, recipientCount: null })) }}
              className="text-xs text-muted hover:text-red-400 flex items-center gap-1"
            >
              <X size={12} /> הסר קובץ
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-50 flex items-center justify-center">
              <Upload size={28} className="text-muted" />
            </div>
            <div className="text-white font-medium">גרור קובץ לכאן</div>
            <div className="text-muted text-sm">או לחץ לבחירת קובץ</div>
            <div className="text-xs text-muted">CSV, XLS, XLSX</div>
          </div>
        )}
      </div>

      {/* OR paste */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface-200 px-3 text-xs text-muted">או</span>
        </div>
      </div>

      <div>
        <label className="label">הדבק מספרי טלפון (שורה לכל מספר)</label>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="050-1234567&#10;052-9876543&#10;054-5555555"
          value={data.pastedNumbers || ''}
          onChange={e => {
            const lines = e.target.value.split('\n').filter(l => l.trim())
            setData(d => ({ ...d, pastedNumbers: e.target.value, recipientCount: lines.length || null }))
          }}
        />
        {data.pastedNumbers && (
          <div className="text-xs text-accent mt-1">
            {data.pastedNumbers.split('\n').filter(l => l.trim()).length} מספרים
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <button
          onClick={onNext}
          disabled={!data.fileName && !data.pastedNumbers}
          className="btn-primary disabled:opacity-40"
        >
          המשך
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 2: Recipients ── */
function StepRecipients({ onNext, onPrev, data, setData }) {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(new Set(MOCK_RECIPIENTS.map(r => r.id)))

  const filtered = MOCK_RECIPIENTS.filter(r =>
    r.name.includes(filter) || r.phone.includes(filter) || r.tags.some(t => t.includes(filter))
  )

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">בחר נמענים</h2>
        <p className="text-muted text-sm">{selected.size} נמענים נבחרו</p>
      </div>

      <div className="flex gap-3">
        <input
          className="input flex-1"
          placeholder="סנן לפי שם, טלפון, תגית..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button onClick={toggleAll} className="btn-secondary text-sm whitespace-nowrap">
          {selected.size === filtered.length ? 'בטל הכל' : 'בחר הכל'}
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => {
              const s = new Set(selected)
              s.has(r.id) ? s.delete(r.id) : s.add(r.id)
              setSelected(s)
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selected.has(r.id)
                ? 'border-primary/40 bg-primary/5'
                : 'border-border hover:border-border-light bg-surface-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              selected.has(r.id) ? 'bg-primary border-primary' : 'border-border'
            }`}>
              {selected.has(r.id) && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{r.name}</div>
              <div className="text-xs text-muted">{r.phone}</div>
            </div>
            <div className="flex gap-1.5">
              {r.tags.map(t => (
                <span key={t} className="text-xs bg-surface-100 text-subtle px-2 py-0.5 rounded-full border border-border">
                  {t}
                </span>
              ))}
            </div>
            <div className="text-xs font-bold" style={{ color: r.score >= 70 ? '#10B981' : r.score >= 40 ? '#F59E0B' : '#EF4444' }}>
              {r.score}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button onClick={onNext} disabled={selected.size === 0} className="btn-primary gap-2 disabled:opacity-40">
          המשך ({selected.size})
          <ChevronLeft size={16} />
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">כתוב הודעה</h2>
        <p className="text-muted text-sm">עד {MAX_CHARS} תווים במחיר הודעה אחת</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">תוכן ההודעה</label>
          <span className={`text-sm font-mono font-bold ${isOver ? 'text-red-400' : chars > 180 ? 'text-yellow-400' : 'text-muted'}`}>
            {chars}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          className={`input resize-none transition-all ${isOver ? 'ring-2 ring-red-500/40 border-red-500/40' : ''}`}
          rows={5}
          placeholder="שלום {שם}, קפה רוטשילד מזמינים אותך..."
          value={data.message || ''}
          onChange={e => setData(d => ({ ...d, message: e.target.value }))}
        />
        {isOver && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
            <AlertCircle size={12} />
            ההודעה ארוכה מדי — תחויב על {Math.ceil(chars / MAX_CHARS)} הודעות
          </div>
        )}
      </div>

      {/* Variables */}
      <div>
        <div className="text-xs text-muted mb-2">משתנים זמינים:</div>
        <div className="flex flex-wrap gap-2">
          {['{שם}', '{עסק}', '{תאריך}', '{קוד}'].map(v => (
            <button
              key={v}
              onClick={() => setData(d => ({ ...d, message: (d.message || '') + v }))}
              className="text-xs bg-surface-50 border border-border text-subtle hover:text-white hover:border-primary/40 px-3 py-1.5 rounded-lg transition-all"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {data.message && (
        <div className="bg-surface-50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-muted" />
            <span className="text-xs text-muted font-medium">תצוגה מקדימה</span>
          </div>
          <div className="text-sm text-white leading-relaxed">
            {(data.message || '').replace('{שם}', 'דני').replace('{עסק}', 'קפה רוטשילד').replace('{תאריך}', '01/03/2026').replace('{קוד}', 'AX-2847')}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button onClick={onNext} disabled={!data.message || isOver} className="btn-primary gap-2 disabled:opacity-40">
          המשך
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 4: Schedule ── */
function StepSchedule({ onNext, onPrev, data, setData }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">תזמון שליחה</h2>
        <p className="text-muted text-sm">מתי לשלוח את הקמפיין?</p>
      </div>

      <div className="grid gap-3">
        {[
          { value: 'now', label: 'שלח עכשיו', desc: 'הקמפיין יישלח מיד', icon: '⚡' },
          { value: 'scheduled', label: 'תזמן לשעה מסוימת', desc: 'בחר תאריך ושעה', icon: '📅' },
        ].map(opt => (
          <div
            key={opt.value}
            onClick={() => setData(d => ({ ...d, scheduleType: opt.value }))}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              data.scheduleType === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border-light bg-surface-50'
            }`}
          >
            <div className="text-2xl">{opt.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{opt.label}</div>
              <div className="text-xs text-muted">{opt.desc}</div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              data.scheduleType === opt.value ? 'border-primary bg-primary' : 'border-border'
            }`}>
              {data.scheduleType === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        ))}
      </div>

      {data.scheduleType === 'scheduled' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">תאריך</label>
            <input
              type="date"
              className="input"
              value={data.scheduleDate || ''}
              onChange={e => setData(d => ({ ...d, scheduleDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">שעה</label>
            <input
              type="time"
              className="input"
              value={data.scheduleTime || ''}
              onChange={e => setData(d => ({ ...d, scheduleTime: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button
          onClick={onNext}
          disabled={!data.scheduleType || (data.scheduleType === 'scheduled' && !data.scheduleDate)}
          className="btn-primary gap-2 disabled:opacity-40"
        >
          המשך
          <ChevronLeft size={16} />
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Text Lead — מספר וירטואלי</h2>
        <p className="text-muted text-sm">אפשר לקהל להשיב ישירות להודעה</p>
      </div>

      {/* Toggle card */}
      <div
        onClick={() => setData(d => ({ ...d, textLeadEnabled: !d.textLeadEnabled, virtualNumber: d.textLeadEnabled ? '' : d.virtualNumber }))}
        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          enabled
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface-50 hover:border-border-light'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            enabled ? 'bg-primary/10' : 'bg-surface-100'
          }`}>
            <Phone size={18} className={enabled ? 'text-primary' : 'text-muted'} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">אפשר לקהל להשיב להודעה</div>
            <div className="text-xs text-muted mt-0.5">כל תשובה תגיע אליך ישירות ב-WhatsApp</div>
          </div>
        </div>
        <div className={`w-12 h-6 rounded-full transition-all duration-200 flex items-center px-1 flex-shrink-0 ${
          enabled ? 'bg-primary' : 'bg-surface-100 border border-border'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </div>
      </div>

      {/* Virtual number field */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div>
            <label className="label">מספר וירטואלי</label>
            <div className="relative">
              <Phone size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-muted pointer-events-none" />
              <input
                className={`input pr-9 transition-all ${
                  showError
                    ? 'ring-2 ring-red-500/40 border-red-500/40'
                    : number && isValid
                    ? 'ring-2 ring-accent/30 border-accent/40'
                    : ''
                }`}
                placeholder="05XXXXXXXX"
                value={number}
                maxLength={10}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, '')
                  setData(d => ({ ...d, virtualNumber: val }))
                }}
                dir="ltr"
              />
              {number && isValid && (
                <Check size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-accent" />
              )}
            </div>

            {showError && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                <AlertCircle size={12} />
                פורמט לא תקין — נדרש 05XXXXXXXX (10 ספרות)
              </div>
            )}

            {number && isValid && (
              <div className="flex items-center gap-1.5 text-accent text-xs mt-1.5">
                <Check size={12} />
                המספר תקין
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <span className="text-xl flex-shrink-0">📞</span>
            <div className="text-sm text-subtle leading-relaxed">
              תשובות מהקהל יגיעו אליך ישירות ב-WhatsApp למספר שהזנת. המספר הוירטואלי יופיע כשולח ה-SMS.
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button
          onClick={onNext}
          disabled={enabled && !isValid}
          className="btn-primary gap-2 disabled:opacity-40"
        >
          המשך
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 6: Validator ── */
function StepValidator({ onNext, onPrev, data, setData }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">הוסף Validator</h2>
        <p className="text-muted text-sm">כרטיס/קופון דיגיטלי לכל נמען</p>
      </div>

      {/* Toggle */}
      <div
        onClick={() => setData(d => ({ ...d, validatorEnabled: !d.validatorEnabled }))}
        className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-50 cursor-pointer hover:border-border-light transition-all"
      >
        <div>
          <div className="text-sm font-semibold text-white">הפעל Validator</div>
          <div className="text-xs text-muted mt-0.5">כל נמען יקבל קישור ייחודי לקופון</div>
        </div>
        <div className={`w-12 h-6 rounded-full transition-all duration-200 flex items-center px-1 ${
          data.validatorEnabled ? 'bg-primary' : 'bg-surface-100 border border-border'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
            data.validatorEnabled ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </div>
      </div>

      {data.validatorEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <label className="label">סוג Validator</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'coupon', label: 'קופון הנחה', icon: '🎫' },
                { value: 'ticket', label: 'כרטיס כניסה', icon: '🎟️' },
                { value: 'benefit', label: 'הטבה', icon: '🎁' },
                { value: 'confirm', label: 'אישור הזמנה', icon: '✅' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setData(d => ({ ...d, validatorType: opt.value }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    data.validatorType === opt.value
                      ? 'border-primary bg-primary/5 text-white'
                      : 'border-border bg-surface-50 text-subtle hover:border-border-light'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">כותרת הקופון</label>
            <input
              className="input"
              placeholder="20% הנחה על ארוחת בוקר"
              value={data.validatorTitle || ''}
              onChange={e => setData(d => ({ ...d, validatorTitle: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">תוקף עד</label>
              <input
                type="date"
                className="input"
                value={data.validatorExpiry || ''}
                onChange={e => setData(d => ({ ...d, validatorExpiry: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">מגבלת מימוש</label>
              <select
                className="input"
                value={data.validatorLimit || 'once'}
                onChange={e => setData(d => ({ ...d, validatorLimit: e.target.value }))}
              >
                <option value="once">פעם אחת</option>
                <option value="unlimited">ללא הגבלה</option>
                <option value="3">עד 3 פעמים</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button onClick={onNext} className="btn-primary gap-2">
          המשך
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Step 6: Summary ── */
function StepSummary({ onPrev, data, onSubmit }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 2000))
    setSending(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center"
        >
          <Check size={40} className="text-accent" />
        </motion.div>
        <h2 className="text-2xl font-black text-white">הקמפיין נשלח! 🎉</h2>
        <p className="text-muted">תוכל לעקוב אחר הביצועים בדוחות</p>
        <button onClick={onSubmit} className="btn-primary mt-2">
          חזור לסקירה כללית
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">סיכום וסיום</h2>
        <p className="text-muted text-sm">בדוק את פרטי הקמפיין לפני השליחה</p>
      </div>

      <div className="space-y-3">
        {[
          { label: 'קובץ', value: data.fileName || 'הדבקה ידנית' },
          { label: 'נמענים', value: `${data.recipientCount || 6} נמענים` },
          { label: 'הודעה', value: data.message ? `${data.message.length} תווים` : '—' },
          { label: 'תזמון', value: data.scheduleType === 'now' ? 'שליחה מיידית' : `${data.scheduleDate} ${data.scheduleTime || ''}` },
          { label: 'Text Lead', value: data.textLeadEnabled ? `📞 ${data.virtualNumber}` : 'לא מופעל' },
          { label: 'Validator', value: data.validatorEnabled ? `✅ ${data.validatorTitle || 'מופעל'}` : 'לא מופעל' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted text-sm">{label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Cost estimate */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">עלות משוערת</span>
          <span className="text-xl font-black text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>
            ₪{((data.recipientCount || 6) * 0.08).toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-muted mt-1">
          {data.recipientCount || 6} הודעות × 8 אג׳
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrev} className="btn-secondary gap-2">
          <ChevronRight size={16} /> חזור
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="btn-primary gap-2 disabled:opacity-60"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              שולח...
            </>
          ) : (
            <>
              <Send size={16} />
              שלח קמפיין
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Main Wizard ── */
export default function NewCampaign() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    scheduleType: 'now',
    validatorEnabled: false,
  })

  const next = () => setStep(s => Math.min(s + 1, 7))
  const prev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          קמפיין חדש
        </h1>
        <p className="text-muted text-sm mt-0.5">עקוב אחר השלבים ליצירת קמפיין</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step Content */}
      <div className="card">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <StepUpload onNext={next} data={data} setData={setData} />}
            {step === 2 && <StepRecipients onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 3 && <StepMessage onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 4 && <StepSchedule onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 5 && <StepTextLead onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 6 && <StepValidator onNext={next} onPrev={prev} data={data} setData={setData} />}
            {step === 7 && <StepSummary onPrev={prev} data={data} onSubmit={() => navigate('/dashboard')} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
