import { useEffect, useRef, useState } from 'react'

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="מידע נוסף"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 16,
          color: 'var(--v2-gray-400)',
          lineHeight: 1,
        }}
      >
        ⓘ
      </button>
      {open && (
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 100,
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--v2-gray-200)',
            borderRadius: 'var(--radius-sm)',
            padding: 12,
            maxWidth: 280,
            fontSize: 13,
            color: '#fff',
            lineHeight: 1.6,
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'pre-line',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}
