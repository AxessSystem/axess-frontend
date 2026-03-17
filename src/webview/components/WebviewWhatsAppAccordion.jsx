import WebviewAccordion from './WebviewAccordion'
import { MessageCircle } from 'lucide-react'

export default function WebviewWhatsAppAccordion({ business }) {
  const waNumber = business?.wa_number || business?.phone
  if (!waNumber) return null

  const text = `שלום, יש לי שאלה לגבי ${encodeURIComponent(business?.name || 'העסק')}`
  const url = `https://wa.me/${String(waNumber).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

  const handleClick = () => {
    window.open(url, '_blank')
  }

  return (
    <WebviewAccordion title="💬 יש שאלות? דברו איתנו">
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 12,
          border: 'none',
          background: 'var(--wv-primary, #22C55E)',
          color: 'var(--wv-dark, #020617)',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <MessageCircle size={18} />
        שלח הודעה בוואטסאפ
      </button>
    </WebviewAccordion>
  )
}
