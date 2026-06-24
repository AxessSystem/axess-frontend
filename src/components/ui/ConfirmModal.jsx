import { useEffect } from 'react'
import { X } from 'lucide-react'

const ACCENT = '#00C37A'

export default function ConfirmModal({
  open,
  title = 'לאשר?',
  message = 'פעולה זו לא ניתנת לביטול.',
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card, var(--v2-dark-2))',
          border: '1px solid var(--glass-border, var(--border))',
          borderRadius: 12,
          padding: 24,
          width: 'min(400px, 100%)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="סגור"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary, var(--v2-gray-400))',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} />
        </button>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text, #fff)' }}>{title}</h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary, var(--v2-gray-400))' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border, var(--border))',
              background: 'transparent',
              color: 'var(--text, #fff)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: danger ? '#ef4444' : ACCENT,
              color: danger ? '#fff' : '#000',
              fontWeight: 600,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
