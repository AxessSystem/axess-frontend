import { useRef, useEffect } from 'react'

const BTNS = [
  { cmd: 'bold', label: 'B' },
  { cmd: 'italic', label: 'I' },
  { cmd: 'underline', label: 'U' },
  { cmd: 'insertUnorderedList', label: '•' },
  { cmd: 'insertOrderedList', label: '1.' },
  { cmd: 'formatBlock', value: 'h1', label: 'H1' },
  { cmd: 'formatBlock', value: 'h2', label: 'H2' },
  { cmd: 'createLink', label: '🔗', prompt: true },
]

export default function RichTextEditor({ value = '', onChange, placeholder = 'תאר את האירוע...', minHeight = 200 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && value) {
      ref.current.innerHTML = value
    }
  }, [])

  const handleInput = () => {
    onChange?.(ref.current?.innerHTML || '')
  }

  const runCmd = (cmd, value, prompt) => {
    document.execCommand('styleWithCSS', false, true)
    if (cmd === 'createLink' && prompt) {
      const url = window.prompt('הזן קישור:')
      if (url) document.execCommand(cmd, false, url)
    } else if (cmd === 'formatBlock') {
      document.execCommand(cmd, false, value)
    } else {
      document.execCommand(cmd, false, null)
    }
    ref.current?.focus()
    handleInput()
  }

  return (
    <div dir="rtl" style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--v2-dark-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, borderBottom: '1px solid var(--glass-border)', background: 'var(--v2-dark-2)' }}>
        {BTNS.map((b, i) => (
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
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: 12,
          color: '#fff',
          fontSize: 15,
          lineHeight: 1.6,
          outline: 'none',
        }}
      />
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--v2-gray-400); }
      `}</style>
    </div>
  )
}
