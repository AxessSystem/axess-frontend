import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  MessageCircle,
  DollarSign,
  MessageSquare,
  Wrench,
  Users,
  Users2,
  Bell,
  AlertCircle,
  FileText,
  Activity,
  Menu,
  X,
  Globe,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'סקירה', path: '/axess-admin' },
  { icon: Building2, label: 'עסקים', path: '/axess-admin/businesses' },
  { icon: MessageCircle, label: 'WhatsApp', path: '/axess-admin/whatsapp' },
  { icon: DollarSign, label: 'כספים', path: '/axess-admin/finance' },
  { icon: MessageSquare, label: 'SMS', path: '/axess-admin/sms' },
  { icon: Wrench, label: 'תמיכה', path: '/axess-admin/support' },
  { icon: Users, label: 'משתמשים', path: '/axess-admin/users' },
  { icon: Users2, label: 'לקוחות', path: '/axess-admin/recipients' },
  { icon: Bell, label: 'הודעות מערכת', path: '/axess-admin/notices' },
  { icon: AlertCircle, label: 'התראות', path: '/axess-admin/alerts' },
  { icon: FileText, label: 'Audit Log', path: '/axess-admin/audit' },
  { icon: Activity, label: 'System Health', path: '/axess-admin/system' },
  { icon: Globe, label: 'Webview', path: '/axess-admin/webview' },
  { icon: BarChart3, label: 'Pixel', path: '/axess-admin/pixel' },
]

const MOBILE_PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'סקירה', path: '/axess-admin' },
  { icon: Building2, label: 'עסקים', path: '/axess-admin/businesses' },
  { icon: MessageCircle, label: 'WhatsApp', path: '/axess-admin/whatsapp' },
  { icon: DollarSign, label: 'כספים', path: '/axess-admin/finance' },
]

function DashLogo({ small = false }) {
  const size = small ? 24 : 28
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 6 : 8 }}>
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <rect x="1" y="1" width="34" height="34" rx="6" stroke="var(--v2-primary)" strokeWidth="1.5" fill="#161E2E" />
          <rect x="5" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="21" y="5" width="10" height="10" rx="2" fill="var(--v2-primary)" />
          <rect x="5" y="21" width="10" height="10" rx="2" fill="var(--v2-primary)" />
        </svg>
      </div>
      {!small && <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Admin Panel</span>}
    </div>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAxessAdmin, loading, session } = useAuth()
  const navigate = useNavigate()

  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: notifData } = useQuery({
    queryKey: ['adminUnreadCount'],
    queryFn: () => fetch(`${API_BASE}/api/admin/notifications/unread-count`, { headers }).then(r => r.json()),
    refetchInterval: 30000,
    enabled: !!session?.access_token,
  })

  const unreadCount = notifData?.count || 0

  useEffect(() => {
    sessionStorage.removeItem('axess_impersonate');
    sessionStorage.removeItem('axess_impersonate_name');
  }, []);

  useEffect(() => {
    if (loading) return
    if (!isAxessAdmin && !loading) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAxessAdmin, loading, navigate])

  if (loading || !isAxessAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--glass-border)', borderTopColor: 'var(--v2-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', width: '100%', overflowX: 'hidden' }}>
      <aside
        className="hidden lg:flex"
        style={{
          flexDirection: 'column',
          background: 'var(--v2-dark-2)',
          borderLeft: '1px solid var(--glass-border)',
          width: 220,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
          <Link to="/axess-admin" style={{ textDecoration: 'none' }}>
            <DashLogo />
          </Link>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/axess-admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--v2-gray-400)',
                background: isActive ? 'var(--glass-bg)' : 'transparent',
                borderRight: isActive ? '2px solid var(--v2-primary)' : '2px solid transparent',
              })}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:hidden" style={{ position: 'fixed', top: 16, right: 16, zIndex: 60 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 8, color: '#fff', cursor: 'pointer' }}>
          <Menu size={20} />
        </button>
      </div>

      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50 }}
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
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <DashLogo />
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {NAV_ITEMS.map(item => (
              <div key={item.path} onClick={() => setSidebarOpen(false)}>
                <NavLink
                  to={item.path}
                  end={item.path === '/axess-admin'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: isActive ? '#fff' : 'var(--v2-gray-400)',
                    background: isActive ? 'var(--glass-bg)' : 'transparent',
                    marginBottom: 4,
                  })}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              </div>
            ))}
          </aside>
        </>
      )}

      <main style={{ flex: 1, padding: 24, minWidth: 0, maxWidth: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <DashLogo small />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => navigate('/axess-admin/alerts')}
            >
              <Bell size={20} color="var(--v2-gray-400)" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'var(--v2-dark-2)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 70,
        }}
      >
        {MOBILE_PRIMARY_NAV.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--v2-gray-400)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 10,
              cursor: 'pointer',
              padding: '4px 6px',
              flex: 1,
            }}
          >
            <item.icon size={20} />
          </button>
        ))}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--v2-gray-400)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            fontSize: 10,
            cursor: 'pointer',
            padding: '4px 6px',
            flex: 1,
          }}
        >
          <Menu size={20} />
        </button>
      </nav>
    </div>
  )
}
