import { useRef, useEffect, useState } from 'react'
import CustomSelect from '@/components/ui/CustomSelect'

const ROW1_BTNS = [
  { cmd: 'bold', label: 'B' },
  { cmd: 'italic', label: 'I' },
  { cmd: 'underline', label: 'U' },
  { cmd: 'formatBlock', value: 'h1', label: 'H1' },
  { cmd: 'formatBlock', value: 'h2', label: 'H2' },
]

const COLORS = [
  { color: '#ffffff', label: 'לבן' },
  { color: '#facc15', label: 'צהוב' },
  { color: '#22c55e', label: 'ירוק' },
  { color: '#ec4899', label: 'ורוד' },
]

const FONT_SIZES = [
  { value: 1, px: 14, label: 'קטן' },
  { value: 2, px: 16, label: 'רגיל' },
  { value: 3, px: 20, label: 'גדול' },
  { value: 4, px: 28, label: 'כותרת' },
]

export default function RichTextEditor({ value = '', onChange, placeholder = 'תאר את האירוע...', minHeight = 200 }) {
  const ref = useRef(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [fontSizeUi, setFontSizeUi] = useState(2)

  useEffect(() => {
    if (ref.current && value) {
      ref.current.innerHTML = value
    }
  }, [])

  useEffect(() => {
    if (ref.current && !previewMode && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value
    }
  }, [previewMode])

  const handleInput = () => {
    onChange?.(ref.current?.innerHTML || '')
  }

  const runCmd = (cmd, val, prompt) => {
    document.execCommand('styleWithCSS', false, true)
    if (cmd === 'createLink' && prompt) {
      const url = window.prompt('הזן קישור:')
      if (url) document.execCommand(cmd, false, url)
    } else if (cmd === 'formatBlock') {
      document.execCommand(cmd, false, val)
    } else if (cmd === 'foreColor') {
      document.execCommand('foreColor', false, val)
    } else if (cmd === 'fontSize') {
      document.execCommand('fontSize', false, val)
    } else {
      document.execCommand(cmd, false, null)
    }
    ref.current?.focus()
    handleInput()
  }

  const insertHr = () => {
    document.execCommand('insertHTML', false, '<hr>')
    ref.current?.focus()
    handleInput()
  }

  return (
    <div dir="rtl" style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--v2-dark-3)' }}>
      <div style={{ padding: 8, borderBottom: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)' }}>
        {/* שורה 1 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {ROW1_BTNS.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => runCmd(b.cmd, b.value, b.prompt)}
              style={{
                padding: '6px 10px',
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        {/* שורה 2 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {/* צבע טקסט */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {COLORS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => runCmd('foreColor', c.color)}
                title={c.label}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: c.color,
                  border: c.color === '#ffffff' ? '1px solid var(--glass-border)' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </span>
          <span style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
          {/* יישור */}
          <span style={{ display: 'flex', gap: 2 }}>
            <button type="button" onClick={() => runCmd('justifyLeft')} style={{ padding: 6, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }} title="שמאל">⬅</button>
            <button type="button" onClick={() => runCmd('justifyCenter')} style={{ padding: 6, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }} title="מרכז">↔</button>
            <button type="button" onClick={() => runCmd('justifyRight')} style={{ padding: 6, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }} title="ימין">➡</button>
          </span>
          <span style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
          {/* רשימות */}
          <button type="button" onClick={() => runCmd('insertUnorderedList')} style={{ padding: '6px 10px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>• רשימה</button>
          <button type="button" onClick={() => runCmd('insertOrderedList')} style={{ padding: '6px 10px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>1. ממוספרת</button>
          <span style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
          <button type="button" onClick={insertHr} style={{ padding: '6px 10px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>—</button>
          <button type="button" onClick={() => runCmd('createLink', null, true)} style={{ padding: '6px 10px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>🔗</button>
          <span style={{ flex: 1 }} />
          {/* גודל גופן */}
          <CustomSelect
            value={fontSizeUi}
            onChange={val => {
              const v = Number(val)
              setFontSizeUi(v)
              runCmd('fontSize', v)
            }}
            style={{ padding: 6, background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 6, color: '#fff', fontSize: 13, width: 'auto' }}
            options={FONT_SIZES.map((f) => ({ value: f.value, label: `${f.label} (${f.px}px)` }))}
          />
          {/* עריכה / תצוגה מקדימה */}
          <span style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={() => setPreviewMode(false)} style={{ padding: '6px 10px', background: previewMode ? 'transparent' : 'var(--v2-primary)', border: '1px solid var(--glass-border)', borderRadius: 6, color: previewMode ? 'var(--v2-gray-400)' : 'var(--v2-dark)', cursor: 'pointer', fontWeight: 600 }}>✏️ עריכה</button>
            <button type="button" onClick={() => setPreviewMode(true)} style={{ padding: '6px 10px', background: previewMode ? 'var(--v2-primary)' : 'transparent', border: '1px solid var(--glass-border)', borderRadius: 6, color: previewMode ? 'var(--v2-dark)' : 'var(--v2-gray-400)', cursor: 'pointer', fontWeight: 600 }}>👁️ תצוגה מקדימה</button>
          </span>
        </div>
      </div>
      {previewMode ? (
        <div
          dir="rtl"
          style={{
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            minHeight: minHeight,
            color: '#fff',
            textAlign: 'right',
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: value || '<span style="color: var(--v2-gray-400)">אין תוכן</span>' }}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          dir="rtl"
          onInput={handleInput}
          data-placeholder={placeholder}
          style={{
            background: 'var(--v2-dark-3)',
            border: 'none',
            padding: 16,
            minHeight: minHeight,
            color: '#fff',
            fontSize: 15,
            lineHeight: 1.6,
            outline: 'none',
            textAlign: 'right',
          }}
        />
      )}
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--v2-gray-400); }
        [contenteditable] { font-family: inherit; }
      `}</style>
    </div>
  )
}
