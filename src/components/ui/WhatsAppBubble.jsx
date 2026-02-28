export default function WhatsAppBubble({ type = 'bot', children, time }) {
  const isBot = type === 'bot'

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div className="max-w-[85%]">
        <div
          className={`px-4 py-2.5 text-sm shadow-sm ${
            isBot
              ? 'bg-[#F0F4FF] text-gray-800 rounded-2xl rounded-tr-sm'
              : 'bg-primary text-white rounded-2xl rounded-tl-sm'
          }`}
        >
          {children}
        </div>
        {time && (
          <div className={`text-[10px] text-gray-400 mt-0.5 ${isBot ? 'mr-1' : 'ml-1 text-left'}`}>
            {time} ✓✓
          </div>
        )}
      </div>
    </div>
  )
}
