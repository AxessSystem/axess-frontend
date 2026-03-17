import { useEffect } from 'react'

export default function WebviewToast({ message, onDismiss, duration = 2500 }) {
  useEffect(() => {
    if (!onDismiss || !duration) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--wv-primary, #22C55E)',
        color: 'var(--wv-dark, #020617)',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      {message}
    </div>
  )
}
