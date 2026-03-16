import { MessageCircle } from 'lucide-react'

export default function WebviewChatButton({ business, recipient }) {
  if (!business) return null
  if (business.business_type === 'restaurant') return null

  const handleClick = () => {
    const waNumber = business.wa_number || business.phone || recipient?.phone
    if (!waNumber) return

    const encodedName = encodeURIComponent(business.name || '')
    const baseText = `שלום, אני בדף ${encodedName}`

    const url =
      business.integration_type === 'direct_api'
        ? `https://wa.me/${waNumber}`
        : `https://wa.me/${waNumber}?text=${encodeURIComponent(baseText)}`

    window.open(url, '_blank')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 52,
        height: 52,
        borderRadius: '999px',
        border: 'none',
        background: '#22C55E',
        boxShadow: '0 12px 30px rgba(16,185,129,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
      }}
    >
      <MessageCircle size={20} color="#020617" />
    </button>
  )
}

