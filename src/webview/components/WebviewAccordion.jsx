import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const accordionStyle = {
  background: 'var(--wv-card, #0f172a)',
  borderBottom: '1px solid var(--glass-border, rgba(148,163,184,0.25))',
  overflow: 'hidden',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '14px 16px',
  border: 'none',
  background: 'transparent',
  color: 'var(--wv-text, #f9fafb)',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--wv-font, "Heebo", "Arial", sans-serif)',
  textAlign: 'right',
}

const contentStyle = {
  padding: '0 16px 16px',
  fontSize: 14,
  color: 'rgba(148,163,184,0.95)',
  lineHeight: 1.7,
}

export default function WebviewAccordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={accordionStyle}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={headerStyle}>
        <span>{title}</span>
        <span style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={18} style={{ opacity: 0.8 }} />
        </span>
      </button>
      {open && (
        <div
          style={contentStyle}
        >
          {children}
        </div>
      )}
    </div>
  )
}
