import { useState } from 'react'

const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

function pad(n) { return String(n).padStart(2, '0') }
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i))
const MINS = ['00', '30']

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'בחר תאריך ושעה',
  dateOnly = false,
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('date') // 'date' | 'time'
  const d = value ? new Date(value) : null
  const [viewMonth, setViewMonth] = useState(() => {
    const base = d || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [selDate, setSelDate] = useState(d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null)
  const [selHour, setSelHour] = useState(d ? pad(d.getHours()) : '20')
  const [selMin, setSelMin] = useState(d ? (d.getMinutes() >= 30 ? '30' : '00') : '00')

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const padding = (firstDay + 6) % 7 // Sunday = 0 → start week from Sunday for Hebrew display

  const handleDatePick = (day) => {
    const newDate = new Date(year, month, day)
    setSelDate(newDate)
    if (dateOnly) {
      const dt = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0)
      onChange(dt.toISOString())
      setOpen(false)
      return
    }
    setMode('time')
  }

  const handleTimePick = () => {
    const base = selDate || new Date()
    const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), parseInt(selHour, 10), parseInt(selMin, 10))
    onChange(dt.toISOString())
    setOpen(false)
  }

  const displayVal = value ? (() => {
    const x = new Date(value)
    if (dateOnly) {
      return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`
    }
    return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`
  })() : ''

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          background: 'var(--v2-dark-3)',
          color: displayVal ? '#fff' : 'var(--v2-gray-400)',
          textAlign: 'right',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {displayVal || placeholder}
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            background: 'var(--v2-dark-2)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            minWidth: 280,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {mode === 'date' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                  style={{ padding: '4px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}
                >
                  ←
                </button>
                <span style={{ fontWeight: 600 }}>{MONTHS_HE[month]} {year}</span>
                <button
                  type="button"
                  onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                  style={{ padding: '4px 12px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}
                >
                  →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {DAYS_HE.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-gray-400)' }}>{d}</div>)}
                {Array(padding).fill(null).map((_, i) => <div key={`p${i}`} />)}
                {days.map(day => {
                  const isSel = selDate && selDate.getDate() === day && selDate.getMonth() === month && selDate.getFullYear() === year
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDatePick(day)}
                      style={{
                        padding: 8,
                        background: isSel ? 'var(--v2-primary)' : 'var(--v2-dark-3)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 8,
                        color: isSel ? 'var(--v2-dark)' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              {!dateOnly && (
                <button type="button" onClick={() => setMode('time')} style={{ width: '100%', padding: 10, background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  בחר שעה
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>בחר שעה</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>שעה</div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--v2-dark-3)', borderRadius: 8 }}>
                    {HOURS.map(h => (
                      <div
                        key={h}
                        onClick={() => setSelHour(h)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          background: selHour === h ? 'var(--v2-primary)' : 'transparent',
                          color: selHour === h ? 'var(--v2-dark)' : '#fff',
                          fontSize: 14,
                        }}
                      >
                        {h}:00
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 4 }}>דקות</div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--v2-dark-3)', borderRadius: 8 }}>
                    {MINS.map(m => (
                      <div
                        key={m}
                        onClick={() => setSelMin(m)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          background: selMin === m ? 'var(--v2-primary)' : 'transparent',
                          color: selMin === m ? 'var(--v2-dark)' : '#fff',
                          fontSize: 14,
                        }}
                      >
                        :{m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setMode('date')} style={{ flex: 1, padding: 10, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: 8, cursor: 'pointer' }}>
                  חזור
                </button>
                <button type="button" onClick={handleTimePick} style={{ flex: 1, padding: 10, background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  אשר
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
