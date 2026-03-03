import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'

const AXESS_PHONE = import.meta.env.VITE_AXESS_PHONE || '972586829494'
const WA_LINK = `https://wa.me/${AXESS_PHONE}?text=${encodeURIComponent('שלום AXESS אני רוצה להצטרף')}`

const INDUSTRIES = [
  { label: 'אירועים',   slug: 'events' },
  { label: 'מלונות',    slug: 'hotels' },
  { label: 'מסעדות',    slug: 'restaurants' },
  { label: 'חנויות',    slug: 'retail' },
  { label: 'חדרי כושר', slug: 'gyms' },
  { label: 'ארגונים',   slug: 'organizations' },
]

const NAV_LINKS = [
  { label: 'מוצר',         href: '/#how' },
  { label: 'תכונות',       href: '/features' },
  { label: 'סוגי עסקים',   href: null, dropdown: true },
  { label: 'תמחור',        href: '/pricing' },
  { label: 'עלינו',        href: '/about' },
]

/* ── QR Logo ── */
function AxessLogo() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {/* QR Container */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        {/* QR SVG */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          {/* Outer border */}
          <rect x="1" y="1" width="34" height="34" rx="6" stroke="var(--v2-primary)" strokeWidth="1.5" fill="var(--v2-dark-3, #161E2E)" />
          {/* Top-left QR block */}
          <rect x="5" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="7" y="7" width="6" height="6" rx="1" fill="var(--v2-dark-3, #161E2E)" />
          <rect x="9" y="9" width="2" height="2" fill="var(--v2-primary)" />
          {/* Top-right QR block */}
          <rect x="21" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="23" y="7" width="6" height="6" rx="1" fill="var(--v2-dark-3, #161E2E)" />
          <rect x="25" y="9" width="2" height="2" fill="var(--v2-primary)" />
          {/* Bottom-left QR block */}
          <rect x="5" y="21" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="7" y="23" width="6" height="6" rx="1" fill="var(--v2-dark-3, #161E2E)" />
          <rect x="9" y="25" width="2" height="2" fill="var(--v2-primary)" />
          {/* Center dots pattern */}
          <rect x="17" y="5" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="9" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="13" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="21" y="17" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="25" y="17" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="29" y="17" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="21" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="21" y="25" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="25" y="21" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="29" y="25" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="29" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="25" y="29" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="29" y="29" width="2" height="2" fill="var(--v2-primary)" />
        </svg>
        {/* Floating green dot */}
        <div
          className="animate-pulse-green"
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            background: 'var(--v2-primary)',
            borderRadius: '50%',
            border: '2px solid var(--v2-dark, #080C14)',
            zIndex: 10,
          }}
        />
      </div>
      {/* AXESS text */}
      <span
        style={{
          fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.5px',
        }}
      >
        AXESS
      </span>
    </div>
  )
}

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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const { ripples, addRipple } = useRipple()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false) }, [location])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
          <Link to="/" style={{ textDecoration: 'none' }}>
            <AxessLogo />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: 'center', gap: 28 }}
          >
            {NAV_LINKS.map(({ label, href, dropdown }) => {
              if (dropdown) {
                return (
                  <div
                    key={label}
                    ref={dropdownRef}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--v2-gray-400)',
                        fontSize: 15,
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--v2-gray-400)')}
                    >
                      {label}
                      <ChevronDown
                        size={14}
                        style={{
                          transition: 'transform 0.2s',
                          transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 8,
                            background: 'rgba(15,22,35,0.98)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            borderRadius: 14,
                            padding: '8px',
                            minWidth: 160,
                            backdropFilter: 'blur(20px)',
                            zIndex: 200,
                          }}
                        >
                          {INDUSTRIES.map(({ label: iLabel, slug }) => (
                            <Link
                              key={slug}
                              to={`/industries/${slug}`}
                              style={{
                                display: 'block',
                                padding: '9px 14px',
                                color: 'var(--v2-gray-400)',
                                fontSize: 14,
                                fontWeight: 500,
                                textDecoration: 'none',
                                borderRadius: 8,
                                transition: 'background 0.15s, color 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(0,195,122,0.10)'
                                e.currentTarget.style.color = '#ffffff'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--v2-gray-400)'
                              }}
                            >
                              {iLabel}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              const isExternal = href && href.startsWith('/#')
              const isActive = !isExternal && href && location.pathname === href
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
              פתח חשבון — חינם
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
              maxHeight: 'calc(100vh - 68px)',
              overflowY: 'auto',
            }}
          >
            {NAV_LINKS.map(({ label, href, dropdown }) => {
              if (dropdown) {
                return (
                  <div key={label}>
                    <div
                      style={{
                        color: 'var(--v2-gray-400)',
                        fontSize: 14,
                        fontWeight: 600,
                        padding: '8px 0 4px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: 4,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </div>
                    {INDUSTRIES.map(({ label: iLabel, slug }) => (
                      <Link
                        key={slug}
                        to={`/industries/${slug}`}
                        style={{
                          display: 'block',
                          color: 'var(--v2-gray-400)',
                          fontSize: 15,
                          fontWeight: 500,
                          textDecoration: 'none',
                          padding: '8px 12px',
                        }}
                      >
                        {iLabel}
                      </Link>
                    ))}
                  </div>
                )
              }
              return href && href.startsWith('/#') ? (
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
            })}
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
              פתח חשבון — חינם
            </a>
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '16px 0',
              borderTop: '1px solid var(--glass-border)',
              marginTop: '8px'
            }}>
              <a
                href="/dashboard"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--white)',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                כניסה למערכת
              </a>
              <a
                href="https://wa.me/972586829494"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  background: 'var(--v2-primary)',
                  color: 'var(--v2-dark)',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                פתח חשבון
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
