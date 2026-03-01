import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const NAV_LINKS = [
  { label: 'מוצר',    href: '/#how' },
  { label: 'תכונות',  href: '/features' },
  { label: 'תמחור',   href: '/pricing' },
  { label: 'עלינו',   href: '/about' },
]

/* ── Ripple hook ── */
function useRipple() {
  const [ripples, setRipples] = useState([])
  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const id = Date.now()
    setRipples(r => [...r, { id, x, y, size }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
  }
  return { ripples, addRipple }
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { ripples, addRipple } = useRipple()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location])

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 68,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: scrolled ? 'rgba(8,12,20,0.92)' : 'rgba(8,12,20,0.75)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'background 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              AXESS
            </span>
            <span
              className="animate-pulse-green"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--v2-primary)',
                display: 'inline-block',
                marginBottom: 2,
              }}
            />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: 'center', gap: 32 }}
          >
            {NAV_LINKS.map(({ label, href }) => {
              const isExternal = href.startsWith('/#')
              const isActive = !isExternal && location.pathname === href
              return isExternal ? (
                <a
                  key={label}
                  href={href}
                  style={{
                    color: isActive ? '#ffffff' : 'var(--v2-gray-400)',
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => (e.target.style.color = '#ffffff')}
                  onMouseLeave={e => (e.target.style.color = isActive ? '#ffffff' : 'var(--v2-gray-400)')}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  style={{
                    color: isActive ? '#ffffff' : 'var(--v2-gray-400)',
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => (e.target.style.color = '#ffffff')}
                  onMouseLeave={e => (e.target.style.color = isActive ? '#ffffff' : 'var(--v2-gray-400)')}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
            <Link
              to="/login"
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--v2-gray-400)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'var(--v2-gray-400)'
              }}
            >
              כניסה למערכת
            </Link>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-v2-primary"
              style={{ padding: '10px 24px', fontSize: 14 }}
              onClick={addRipple}
            >
              {ripples.map(rp => (
                <span
                  key={rp.id}
                  className="ripple-circle"
                  style={{ width: rp.size, height: rp.size, left: rp.x, top: rp.y }}
                />
              ))}
              התחל בחינם
            </a>
          </div>

          {/* ── Mobile Burger ── */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: '#ffffff',
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed',
              top: 68,
              insetInline: 0,
              zIndex: 99,
              background: 'rgba(8,12,20,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_LINKS.map(({ label, href }) =>
              href.startsWith('/#') ? (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: 'var(--v2-gray-400)',
                    fontSize: 16,
                    fontWeight: 500,
                    textDecoration: 'none',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  style={{
                    color: 'var(--v2-gray-400)',
                    fontSize: 16,
                    fontWeight: 500,
                    textDecoration: 'none',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {label}
                </Link>
              )
            )}
            <Link
              to="/login"
              style={{
                color: 'var(--v2-gray-400)',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              כניסה למערכת
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-v2-primary"
              style={{ marginTop: 12, textAlign: 'center', justifyContent: 'center' }}
            >
              התחל בחינם
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
