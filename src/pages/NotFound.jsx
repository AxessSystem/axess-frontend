import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,195,122,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(80px, 20vw, 140px)',
          lineHeight: 1,
          color: 'var(--v2-primary)',
          marginBottom: 16,
          opacity: 0.9,
        }}>
          404
        </div>

        <h1 style={{
          fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(20px, 5vw, 28px)',
          color: '#ffffff',
          marginBottom: 10,
        }}>
          הדף לא נמצא
        </h1>

        <p style={{ color: 'var(--v2-gray-400)', fontSize: 15, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
          הכתובת שביקשת אינה קיימת במערכת.
        </p>

        <Link
          to="/"
          className="btn-primary"
          style={{ display: 'inline-flex', textDecoration: 'none' }}
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
