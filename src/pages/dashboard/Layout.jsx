import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Send, Users, BarChart2, QrCode, Settings,
  Bell, Menu, X, ChevronDown, Wallet, LogOut, Calendar, Megaphone, UserCheck, Building,
  Info, AlertTriangle, Wrench, MessageSquare, Layers, GitBranch, ScanLine, Radio,
  PieChart, Globe,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const NAV_SHORTCUTS = {
  '/dashboard': [],
  '/dashboard/new-campaign': [
    { label: 'SMS לקהל', action: (navigate) => navigate('/dashboard/new-campaign?type=general') },
    { label: 'קמפיין לאירוע', action: (navigate) => navigate('/dashboard/new-campaign?type=event') },
  ],
  '/dashboard/audiences': [
    { label: 'ייבוא קהל', action: (navigate) => navigate('/dashboard/audiences?import=1') },
    { label: 'ייצוא קהל', action: (navigate) => navigate('/dashboard/audiences?export=1') },
  ],
  '/dashboard/events': [
    { label: 'צור אירוע', action: (navigate) => navigate('/dashboard/events?create=event') },
    { label: 'צור תיאטרון', action: (navigate) => navigate('/dashboard/events?create=theater') },
    { label: 'צור שולחנות', action: (navigate) => navigate('/dashboard/events?create=tables') },
  ],
  '/dashboard/promoters': [
    { label: 'הוסף יחצ"ן', action: (navigate) => navigate('/dashboard/promoters?add=true') },
  ],
  '/dashboard/staff': [
    { label: 'הזמן חבר צוות', action: (navigate) => navigate('/dashboard/staff?invite=true') },
  ],
  '/dashboard/validators': [
    { label: 'צור Validator', action: (navigate) => navigate('/dashboard/validators?create=true') },
  ],
}

const pathToNavKey = {
  '/dashboard': 'overview',
  '/dashboard/new-campaign': 'campaigns',
  '/dashboard/audiences': 'audiences',
  '/dashboard/events': 'events',
  '/dashboard/promoters': 'promoters',
  '/dashboard/staff': 'staff',
  '/dashboard/validators': 'validators',
  '/dashboard/inbox': 'inbox',
  '/dashboard/assets': 'assets',
  '/dashboard/webview': 'webview',
  '/dashboard/flows': 'flows',
  '/dashboard/scan-management': 'scan_management',
  '/dashboard/pixel': 'pixel',
  '/dashboard/reports': 'reports',
  '/dashboard/settings': 'settings',
  '/dashboard/sub-accounts': 'sub_accounts',
}

const DASHBOARD_NAV_BASE = [
  { path: '/dashboard', label: 'סקירה', icon: BarChart2, permission: null },
  { path: '/dashboard/inbox', label: 'אינבוקס', icon: MessageSquare, permission: 'can_view_inbox' },
  { path: '/dashboard/assets', label: 'נכסים שלי', icon: Layers, permission: null },
  { path: '/dashboard/new-campaign', label: 'קמפיין חדש', icon: Send, permission: 'can_create_campaigns' },
  { path: '/dashboard/audiences', label: 'קהלים', icon: Users, permission: 'can_view_audiences' },
  { path: '/dashboard/webview', label: 'Webview', icon: Globe, permission: 'can_manage_webview' },
  { path: '/dashboard/flows', label: 'Flows', icon: GitBranch, permission: 'can_manage_flows' },
  { path: '/dashboard/events', label: 'אירועים', icon: Calendar, permission: 'can_view_events' },
  { path: '/dashboard/promoters', label: 'יחצ"נים', icon: Megaphone, permission: 'can_manage_promoters' },
  { path: '/dashboard/validators', label: 'Validators', icon: QrCode, permission: 'can_manage_events' },
  { path: '/dashboard/scan-management', label: 'עמדות סריקה', icon: ScanLine, permission: 'can_scan' },
  { path: '/dashboard/reports', label: 'דוחות', icon: PieChart, permission: 'can_view_reports' },
  { path: '/dashboard/staff', label: 'צוות', icon: UserCheck, permission: 'can_manage_staff' },
  { path: '/dashboard/sub-accounts', label: 'מחלקות', icon: Building, permission: 'can_manage_sub_accounts' },
  { path: '/dashboard/pixel', label: 'Pixel & לינקים', icon: Radio, permission: null },
  { path: '/dashboard/settings', label: 'הגדרות', icon: Settings, permission: 'can_manage_settings' },
]

function getLegacyNavForRole(role) {
  if (role === 'door_staff')
    return DASHBOARD_NAV_BASE.filter(i => i.path === '/dashboard' || i.path === '/dashboard/validators')
  if (role === 'bar_staff')
    return DASHBOARD_NAV_BASE.filter(i => i.path === '/dashboard' || i.path === '/dashboard/validators' || i.path === '/dashboard/settings')
  if (role === 'viewer')
    return DASHBOARD_NAV_BASE.filter(i => i.path === '/dashboard' || i.path === '/dashboard/reports' || i.path === '/dashboard/pixel')
  if (role === 'promoter_manager')
    return DASHBOARD_NAV_BASE.filter(i => i.path === '/dashboard' || i.path === '/dashboard/promoters')
  return null
}

function applyBusinessNavConfig(items, businessConfig) {
  if (!businessConfig) return items
  const allowedPaths = businessConfig.nav_items || []
  return items.filter(item => {
    if (item.path === '/dashboard') return true
    if (item.path === '/dashboard/settings') return true
    if (item.path === '/dashboard/inbox') return true
    if (item.path === '/dashboard/webview') return true
    if (item.path === '/dashboard/flows') return true
    if (item.path === '/dashboard/scan-management') return true
    if (item.path === '/dashboard/assets') return true
    if (item.path === '/dashboard/pixel') return true
    const key = pathToNavKey[item.path]
    return key ? allowedPaths.includes(key) : allowedPaths.some(p => item.path.includes(p))
  })
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

function SidebarLink({ item, collapsed, navigate, isMobile = false, badgeCount = null }) {
  const shortcuts = NAV_SHORTCUTS[item.path] || []
  const [openDropdown, setOpenDropdown] = useState(false)
  const containerRef = useRef(null)
  const location = useLocation()
  const pendingNavRef = useRef(null)

  const isActive = item.path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/')

  useEffect(() => {
    if (!openDropdown) return
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpenDropdown(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openDropdown])

  const handleLinkClick = (e) => {
    if (shortcuts.length === 0 || collapsed || isMobile) return
    e.preventDefault()
    const now = Date.now()
    const last = pendingNavRef.current
    if (last && now - last < 300) {
      pendingNavRef.current = 0
      setOpenDropdown(o => !o)
      return
    }
    pendingNavRef.current = now
    setTimeout(() => {
      if (pendingNavRef.current === now) {
        pendingNavRef.current = 0
        navigate(item.path)
      }
    }, 300)
  }

  const showChevron = !isMobile && !collapsed && shortcuts.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <NavLink
          to={item.path}
          end={item.path === '/dashboard'}
          onClick={handleLinkClick}
          style={() => ({
            flex: 1,
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
          {!collapsed && (
            <>
              <span>{item.label}</span>
              {item.path === '/dashboard/inbox' && badgeCount != null && (
                <span
                  style={{
                    marginRight: 'auto',
                    background: 'var(--v2-primary)',
                    color: 'var(--v2-dark)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 99,
                  }}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </>
          )}
        </NavLink>
        {showChevron && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenDropdown(o => !o); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--v2-gray-400)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={14} style={{ transform: openDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>
      {showChevron && openDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: 8,
            zIndex: 500,
            width: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {shortcuts.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                s.action(navigate)
                setOpenDropdown(false)
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--v2-dark-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                color: '#fff',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
            >
              + {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileDrawerNavItem({ item, navigate, onClose, expandedItem, setExpandedItem, badgeCount = null }) {
  const shortcuts = NAV_SHORTCUTS[item.path] || []
  const hasShortcuts = shortcuts.length > 0
  const expanded = expandedItem === item.path

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <NavLink
          to={item.path}
          end={item.path === '/dashboard'}
          onClick={onClose}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#ffffff' : 'var(--v2-gray-400)',
            background: isActive ? 'var(--glass-bg)' : 'transparent',
          })}
        >
          <item.icon size={18} style={{ flexShrink: 0 }} />
          <span>{item.label}</span>
          {item.path === '/dashboard/inbox' && badgeCount != null && (
            <span
              style={{
                marginRight: 'auto',
                background: 'var(--v2-primary)',
                color: 'var(--v2-dark)',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 99,
              }}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </NavLink>
        {hasShortcuts && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedItem(expanded ? null : item.path)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--v2-gray-400)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
          </button>
        )}
      </div>
      {hasShortcuts && expanded && (
        <div style={{ paddingRight: 32, fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 4 }}>
          {shortcuts.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { s.action(navigate); onClose(); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                color: 'var(--v2-gray-400)',
                cursor: 'pointer',
              }}
            >
              + {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState(null)
  const [businessConfig, setBusinessConfig] = useState(null)
  const [systemNotices, setSystemNotices] = useState([])
  const [dismissedNotices, setDismissedNotices] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_notices') || '[]') } catch { return [] }
  })
  const { role, businessId, isAxessAdmin, session, profile, hasPermission, memberRole, loading: authLoading, identityReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0)
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState([])
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false)
  const notificationsBeepedIdsRef = useRef(new Set())
  const notificationsRef = useRef(null)

  useEffect(() => {
    if (!session?.access_token || !businessId) return
    const fetchInboxUnread = () => {
      fetch(`${API_BASE}/api/inbox/unread-count`, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId },
      })
        .then(r => r.json())
        .then(data => setInboxUnreadCount(data?.count ?? 0))
        .catch(() => {})
    }
    fetchInboxUnread()
    const interval = setInterval(fetchInboxUnread, 30000)
    return () => clearInterval(interval)
  }, [session?.access_token, businessId])

  useEffect(() => {
    if (!session?.access_token || !businessId) return
    const playUrgentBeep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 800
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
      } catch (_) {}
    }
    const pollNotifications = () => {
      const headers = { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId }
      Promise.all([
        fetch(`${API_BASE}/api/notifications/unread-count`, { headers }).then(r => r.json()).then(d => d?.count ?? 0).catch(() => 0),
        fetch(`${API_BASE}/api/notifications?limit=5`, { headers }).then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []),
      ]).then(([count, list]) => {
        setNotificationsUnreadCount(count)
        setRecentNotifications(list)
        list.forEach(n => {
          if (!n.is_read && n.priority === 'urgent' && !notificationsBeepedIdsRef.current.has(n.id)) {
            playUrgentBeep()
            notificationsBeepedIdsRef.current.add(n.id)
          }
        })
      })
    }
    pollNotifications()
    const interval = setInterval(pollNotifications, 30000)
    return () => clearInterval(interval)
  }, [session?.access_token, businessId])

  useEffect(() => {
    if (!notificationsDropdownOpen) return
    const onClose = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsDropdownOpen(false)
    }
    document.addEventListener('click', onClose)
    return () => document.removeEventListener('click', onClose)
  }, [notificationsDropdownOpen])

  const impersonation = (() => {
    try {
      const s = sessionStorage.getItem('axess_impersonate')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })()
  const businessName = profile?.business_name ?? profile?.full_name ?? 'AXESS Admin'
  const balance = 4_820

  useEffect(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/business-config?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setBusinessConfig)
      .catch(() => setBusinessConfig(null))
  }, [businessId])

  useEffect(() => {
    const type = businessConfig?.type_key || 'all'
    fetch(`${API_BASE}/api/system-notices?business_type=${type}`)
      .then(r => r.ok ? r.json() : [])
      .then(setSystemNotices)
      .catch(() => setSystemNotices([]))
  }, [businessConfig?.type_key])

  const dismissNotice = (id) => {
    setDismissedNotices(prev => {
      const next = [...prev, id]
      sessionStorage.setItem('dismissed_notices', JSON.stringify(next))
      return next
    })
  }

  const activeNotices = systemNotices.filter(n => !dismissedNotices.includes(n.id))

  const NAV_ITEMS = useMemo(() => {
    const legacy = getLegacyNavForRole(role)
    const permissionFiltered =
      legacy ?? DASHBOARD_NAV_BASE.filter((item) => !item.permission || hasPermission(item.permission))
    return applyBusinessNavConfig(permissionFiltered, businessConfig)
  }, [role, hasPermission, businessConfig])

  useEffect(() => {
    if (!identityReady || authLoading) return
    if (memberRole !== 'scanner') return
    const p = location.pathname
    if (p === '/dashboard/scan-management' || p === '/scan-station') return
    navigate('/scan-station', { replace: true })
  }, [memberRole, authLoading, identityReady, navigate, location.pathname])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('signOut error:', e)
    } finally {
      window.location.href = '/login'
    }
  }

  const SETTINGS_PATH = '/dashboard/settings'
  const MAIN_NAV = NAV_ITEMS.filter(i => i.path !== SETTINGS_PATH)
  const SETTINGS_ITEM = NAV_ITEMS.find(i => i.path === SETTINGS_PATH)

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
          paddingBottom: 24,
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

        {/* Nav items (כולל מחלקות) */}
        <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.path} item={item} collapsed={collapsed} navigate={navigate} badgeCount={inboxUnreadCount} />
          ))}
        </nav>

        {/* Balance — מעל הspacer (בין nav לשם העסק) */}
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

        {/* flex spacer */}
        <div style={{ marginTop: 'auto' }} />

        {/* שם העסק + subtitle */}
        {!collapsed && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{businessName}</div>
            <div style={{ fontSize: 12, color: isAxessAdmin ? 'var(--v2-primary)' : 'var(--v2-gray-400)', marginTop: 2 }}>
              {isAxessAdmin ? 'AXESS Admin' : 'לוח בקרה'}
            </div>
          </div>
        )}

        {/* קו מפריד + התנתק/י */}
        <div style={{ borderTop: '1px solid var(--glass-border)' }} />
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--v2-gray-400)',
            cursor: 'pointer',
            borderRadius: 8,
          }}
        >
          <LogOut size={18} />
          {!collapsed && 'התנתק/י'}
        </button>

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
            {/* א. header: לוגו AXESS + X */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid var(--glass-border)',
                gap: 12,
              }}
            >
              <DashLogo />
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ב. תוכן drawer — גלילה חופשית */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                height: '100%',
                paddingBottom: 100,
                WebkitOverflowScrolling: 'touch',
              }}
            >
            {/* nav items (כולל מחלקות) + קיצורים מתקפלים */}
            <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {MAIN_NAV.map(item => (
                <MobileDrawerNavItem
                  key={item.path}
                  item={item}
                  navigate={navigate}
                  onClose={() => setSidebarOpen(false)}
                  expandedItem={expandedItem}
                  setExpandedItem={setExpandedItem}
                  badgeCount={inboxUnreadCount}
                />
              ))}
            </nav>

            {/* ד. הגדרות */}
            {SETTINGS_ITEM && (
              <div style={{ padding: '0 8px 4px' }}>
                <MobileDrawerNavItem
                  item={SETTINGS_ITEM}
                  navigate={navigate}
                  onClose={() => setSidebarOpen(false)}
                  expandedItem={expandedItem}
                  setExpandedItem={setExpandedItem}
                  badgeCount={null}
                />
              </div>
            )}

            {/* ג. Balance (יתרת הודעות) */}
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

            {/* שם משתמש */}
            <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--v2-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0
              }}>
                {businessName?.charAt(0) ?? 'A'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{businessName}</div>
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>{isAxessAdmin ? 'AXESS Admin' : 'לוח בקרה'}</div>
              </div>
            </div>

            {/* קו מפריד */}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '8px 0' }} />

            {/* התנתק */}
            <div style={{ paddingBottom: 32 }}>
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 14 }}
              >
                <LogOut size={18} />
                התנתק/י
              </button>
            </div>
            </div>
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Impersonation Banner ── */}
        {impersonation?.business && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              background: '#DC2626',
              color: '#fff',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 9999,
              fontSize: 14,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              מצב תמיכה — צופה כ: {impersonation.business?.name || 'עסק'}
            </span>
            <button
              onClick={() => {
                sessionStorage.removeItem('axess_impersonate')
                const adminToken = sessionStorage.getItem('axess_admin_token')
                if (adminToken) {
                  try {
                    const p = JSON.parse(adminToken)
                    const at = p?.access_token ?? p?.session?.access_token
                    const rt = p?.refresh_token ?? p?.session?.refresh_token
                    if (at && rt) supabase.auth.setSession({ access_token: at, refresh_token: rt })
                  } catch (_) {}
                }
                sessionStorage.removeItem('axess_admin_token')
                window.location.href = '/axess-admin'
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              חזור לאדמין
            </button>
          </div>
        )}

        {/* ── System Notice Banners ── */}
        {activeNotices.map(n => {
          const isInfo = n.type === 'info'
          const isWarning = n.type === 'warning'
          const isMaintenance = n.type === 'maintenance'
          const bg = isInfo ? 'rgba(37,99,235,0.15)' : isWarning ? 'rgba(234,179,8,0.15)' : 'rgba(220,38,38,0.15)'
          const border = isInfo ? '#2563EB' : isWarning ? '#EAB308' : '#DC2626'
          const Icon = isInfo ? Info : isWarning ? AlertTriangle : Wrench
          return (
            <div
              key={n.id}
              style={{
                background: bg,
                borderBottom: `1px solid ${border}`,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Icon size={18} style={{ color: border, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#fff' }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{n.message}</div>
              </div>
              <button
                onClick={() => dismissNotice(n.id)}
                style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
          )
        })}

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
          {/* Right (RTL): mobile = המבורגר + עיגול + שם עסק | desktop = circle + שם עסק + לוח בקרה */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* המבורגר — mobile only */}
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)', padding: 4, zIndex: 60 }}
            >
              <Menu size={22} />
            </button>
            {/* circle + text — both mobile (name only) and desktop (full) */}
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
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-primary)' }}>
                {businessName.charAt(0)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                className="hidden lg:flex"
                style={{
                  fontSize: 11,
                  color: 'var(--v2-gray-400)',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {businessConfig?.emoji || ''} {isAxessAdmin ? 'AXESS Admin' : (businessConfig?.type_label || 'לוח בקרה')}
              </div>
            </div>
          </div>

          {/* Left (RTL end): Balance + Notifications + Avatar (desktop) | פעמון */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Balance badge — desktop only */}
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

            {/* Notifications — dropdown with 5 recent + link to full page */}
            <div ref={notificationsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotificationsDropdownOpen(o => !o)}
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
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    background: 'var(--v2-primary)',
                    borderRadius: 99,
                    fontSize: 10,
                    color: 'var(--v2-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {notificationsUnreadCount > 99 ? '99+' : notificationsUnreadCount}
                </span>
              </button>
              {notificationsDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 8,
                    width: 320,
                    maxHeight: 360,
                    background: 'var(--v2-dark-3)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ padding: 12, borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>התראות</div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                    {recentNotifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--v2-gray-400)', fontSize: 13 }}>אין התראות</div>
                    ) : (
                      recentNotifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNotificationsDropdownOpen(false)
                            if (!n.is_read) {
                              fetch(`${API_BASE}/api/notifications/${n.id}/read`, {
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${session.access_token}`, 'X-Business-Id': businessId },
                              }).then(() => setNotificationsUnreadCount(c => Math.max(0, c - 1)))
                            }
                            const url = n.action_url || '/dashboard/notifications'
                            if (url.startsWith('http')) window.location.href = url
                            else navigate(url)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            width: '100%',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'right',
                            borderBottom: '1px solid var(--glass-border)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--v2-dark-2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: !n.is_read ? '#3B82F6' : 'transparent' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: '#fff', fontSize: 13 }}>{n.title}</div>
                            {n.body && <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginTop: 2 }}>{n.body}</div>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <Link
                    to="/dashboard/notifications"
                    onClick={() => setNotificationsDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: 10,
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--v2-primary)',
                      textDecoration: 'none',
                      borderTop: '1px solid var(--glass-border)',
                    }}
                  >
                    צפה בהכל
                  </Link>
                </div>
              )}
            </div>

            {/* Avatar — desktop only */}
            <div
              className="hidden lg:block"
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
