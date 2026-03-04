import { useState } from 'react'

export default function Tooltip({ text, position = 'top' }) {
  const [show, setShow] = useState(false)

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' },
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <button
        type="button"
        aria-label={text}
        onClick={() => setShow(s => !s)}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          color: 'var(--v2-gray-400)',
          fontSize: 11,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          marginRight: 4,
        }}
      >
        ?
      </button>
      {show && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...positionStyles[position],
            background: 'var(--v2-dark-2)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--v2-white)',
            maxWidth: 240,
            lineHeight: 1.6,
            zIndex: 100,
            whiteSpace: 'normal',
            animation: 'fadeUp 150ms ease',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}
