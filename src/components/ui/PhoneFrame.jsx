export default function PhoneFrame({ children, width = 260 }) {
  return (
    <div
      className="relative rounded-[2.5rem] shadow-2xl"
      style={{
        width,
        background: '#0F172A',
        border: '3px solid #1e293b',
        padding: '12px',
      }}
    >
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-dark rounded-full z-10" />
      {/* Screen */}
      <div className="rounded-[2rem] overflow-hidden bg-white">
        {children}
      </div>
    </div>
  )
}
