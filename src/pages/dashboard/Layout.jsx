import { useState, useEffect } from 'react'
import { Link, Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Send, Users, BarChart2, QrCode, Settings,
  Bell, Menu, X, ChevronDown, Wallet, LogOut, Calendar, Megaphone, UserCheck, Building
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

const ALL_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'סקירה כללית', path: '/dashboard', permission: null, roles: null },
  { icon: Send,            label: 'קמפיין חדש',  path: '/dashboard/new-campaign', permission: 'can_send_campaigns', roles: null },
  { icon: Users,           label: 'קהלים',        path: '/dashboard/audiences', permission: null, roles: null },
  { icon: Calendar,        label: 'אירועים',      path: '/dashboard/events', permission: 'can_edit_events', roles: null },
  { icon: Megaphone,       label: 'יחצ"נים',      path: '/dashboard/promoters', permission: 'can_manage_promoters', roles: null },
  { icon: UserCheck,       label: 'צוות',         path: '/dashboard/staff', permission: 'can_manage_staff', roles: null },
  { icon: QrCode,          label: 'Validators',   path: '/dashboard/validators', permission: null, roles: null },
  { icon: BarChart2,       label: 'דוחות',        path: '/dashboard/reports', permission: 'can_view_reports', roles: null },
  { icon: Settings,        label: 'הגדרות',       path: '/dashboard/settings', permission: null, roles: null },
  { icon: Building,        label: 'מחלקות',       path: '/dashboard/sub-accounts', permission: 'can_manage_sub_accounts', roles: null },
]

function getVisibleNavItems(role, permissions, businessConfig) {
  if (role === 'door_staff')
    return ALL_NAV_ITEMS.filter(i => i.path === '/dashboard' || i.label === 'Validators')
  if (role === 'bar_staff')
    return ALL_NAV_ITEMS.filter(i => i.path === '/dashboard' || i.label === 'Validators' || i.path === '/dashboard/settings')
  if (role === 'viewer')
    return ALL_NAV_ITEMS.filter(i => i.path === '/dashboard' || i.path === '/dashboard/reports')
  if (role === 'promoter_manager')
    return ALL_NAV_ITEMS.filter(i => i.path === '/dashboard' || i.path === '/dashboard/promoters')

  const pathToNavKey = {
    '/dashboard': 'overview',
    '/dashboard/new-campaign': 'campaigns',
    '/dashboard/audiences': 'audiences',
    '/dashboard/events': 'events',
    '/dashboard/promoters': 'promoters',
    '/dashboard/staff': 'staff',
    '/dashboard/validators': 'validators',
    '/dashboard/reports': 'reports',
    '/dashboard/settings': 'settings',
    '/dashboard/sub-accounts': 'sub_accounts',
  }
  const byConfig = (items) => {
    if (!businessConfig) return items
    const allowedPaths = businessConfig.nav_items || []
    return items.filter(item => {
      if (item.path === '/dashboard') return true
      if (item.path === '/dashboard/settings') return true
      const key = pathToNavKey[item.path]
      return key ? allowedPaths.includes(key) : allowedPaths.some(p => item.path.includes(p))
    })
  }

  if (!permissions || Object.keys(permissions).length === 0)
    return byConfig(ALL_NAV_ITEMS)
  const permFiltered = ALL_NAV_ITEMS.filter(i => {
    if (!i.permission) return true
    return permissions[i.permission] === true
  })
  return byConfig(permFiltered)
}

/* ── QR Logo (same as Header) ── */
function DashLogo({ small = false }) {
  const size = small ? 28 : 34
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: small ? 8 : 10 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="1" y="1" width="34" height="34" rx="6" stroke="var(--v2-primary)" strokeWidth="1.5" fill="#161E2E" />
          <rect x="5" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="7" y="7" width="6" height="6" rx="1" fill="#161E2E" />
          <rect x="9" y="9" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="21" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="23" y="7" width="6" height="6" rx="1" fill="#161E2E" />
          <rect x="25" y="9" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="5" y="21" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="7" y="23" width="6" height="6" rx="1" fill="#161E2E" />
          <rect x="9" y="25" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="5" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="9" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="21" y="17" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="25" y="17" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="17" y="21" width="2" height="2" fill="var(--v2-primary)" />
          <rect x="25" y="25" width="2" height="2" fill="var(--v2-primary)" />
        </svg>
        <div
          className="animate-pulse-green"
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 12,
            height: 12,
            background: 'var(--v2-primary)',
            borderRadius: '50%',
            border: '2px solid var(--v2-dark, #080C14)',
          }}
        />
      </div>
      {!small && (
        <span style={{
          fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: '#ffffff',
          letterSpacing: '-0.5px',
        }}>
          AXESS
        </span>
      )}
    </div>
  )
}

function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px' : '10px 12px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: isActive ? '#ffffff' : 'var(--v2-gray-400)',
        background: isActive ? 'var(--glass-bg)' : 'transparent',
        borderRight: isActive ? '2px solid var(--v2-primary)' : '2px solid transparent',
      })}
    >
      <item.icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function DashboardClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [businessConfig, setBusinessConfig] = useState(null)
  const { role, permissions, businessId } = useAuth()
  const businessName = 'קפה רוטשילד'
  const balance = 4_820

  useEffect(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/business-config?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setBusinessConfig)
      .catch(() => setBusinessConfig(null))
  }, [businessId])

  const NAV_ITEMS = getVisibleNavItems(role, permissions, businessConfig)

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--v2-dark)',
        display: 'flex',
      }}
    >
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex"
        style={{
          flexDirection: 'column',
          background: 'var(--v2-dark-2)',
          borderLeft: '1px solid var(--glass-border)',
          width: collapsed ? 64 : 240,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '18px 0' : '18px 16px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <DashLogo small={collapsed} />
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Balance */}
        {!collapsed && (
          <div style={{ padding: '12px', borderTop: '1px solid var(--glass-border)' }}>
            <div
              style={{
                background: 'var(--v2-primary-glow)',
                border: '1px solid var(--v2-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Wallet size={14} style={{ color: 'var(--v2-primary)' }} />
                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)', fontWeight: 500 }}>יתרת הודעות</span>
              </div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', monospace",
                  fontWeight: 800,
                  fontSize: 22,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {balance.toLocaleString('he-IL')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginTop: 2 }}>הודעות זמינות</div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: 16,
            borderTop: '1px solid var(--glass-border)',
            color: 'var(--v2-gray-400)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--v2-gray-400)')}
        >
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.3s',
              transform: collapsed ? 'rotate(90deg)' : 'rotate(-90deg)',
            }}
          />
        </button>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 45,
            }}
            className="lg:hidden"
          />
          <aside
            className="lg:hidden"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 260,
              background: 'var(--v2-dark-2)',
              borderLeft: '1px solid var(--glass-border)',
              zIndex: 55,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 300ms ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              <DashLogo />
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV_ITEMS.map(item => (
                <div key={item.path} onClick={() => setSidebarOpen(false)}>
                  <SidebarLink item={item} collapsed={false} />
                </div>
              ))}
            </nav>

            <div style={{ padding: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <div
                style={{
                  background: 'var(--v2-primary-glow)',
                  border: '1px solid var(--v2-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 4 }}>יתרת הודעות</div>
                <div style={{ fontFamily: "'Bricolage Grotesque', monospace", fontWeight: 800, fontSize: 22, color: '#ffffff' }}>
                  {balance.toLocaleString('he-IL')}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── HEADER ── */}
        <header
          style={{
            background: 'var(--v2-dark-2)',
            borderBottom: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '0 24px',
            minHeight: 64,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Mobile menu button */}
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', padding: 4, zIndex: 60, position: 'relative' }}
          >
            <Menu size={22} />
          </button>

          {/* Business name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,195,122,0.12)',
                border: '1px solid rgba(0,195,122,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-primary)' }}>
                {businessName.charAt(0)}
              </span>
            </div>
            <div className="hidden sm:block">
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#ffffff',
                }}
              >
                {businessName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--v2-gray-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {businessConfig?.emoji} {businessConfig?.type_label || 'לוח בקרה'}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Balance badge */}
            <div
              className="hidden sm:flex"
              style={{
                alignItems: 'center',
                gap: 6,
                background: 'var(--v2-primary-glow)',
                border: '1px solid var(--v2-primary)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
              }}
            >
              <Wallet size={13} style={{ color: 'var(--v2-primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-primary)' }}>
                {balance.toLocaleString('he-IL')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>הודעות</span>
            </div>

            {/* Notifications */}
            <button
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--v2-gray-400)',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--v2-gray-400)')}
            >
              <Bell size={16} />
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 16,
                  height: 16,
                  background: 'var(--v2-primary)',
                  borderRadius: '50%',
                  fontSize: 10,
                  color: 'var(--v2-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                2
              </span>
            </button>

            {/* Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--v2-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-dark)' }}>
                {businessName.charAt(0)}
              </span>
            </div>
          </div>
          </div>
          <div className="lg:hidden" style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--v2-gray-400)',
            paddingBottom: 4
          }}>
            {businessName || 'לוח בקרה'}
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main
          className="dash-main dash-main-mobile-pb"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--v2-dark)',
            width: '100%',
            paddingBottom: '80px',
          }}
        >
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav
          className="lg:hidden"
          style={{
            background: 'var(--v2-dark-2)',
            borderTop: '1px solid var(--glass-border)',
            padding: '8px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--v2-primary)' : 'var(--v2-gray-400)',
                fontSize: 10,
                fontWeight: 500,
                transition: 'color 0.2s',
              })}
            >
              <item.icon size={20} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
