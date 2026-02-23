import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, UserCheck, Calendar, CreditCard,
  Table2, Megaphone, Activity, LogOut, ChevronRight,
  BarChart3, Upload, Settings,
} from 'lucide-react'

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/admin/audience', icon: Users, label: 'קהל' },
  { to: '/admin/producers', icon: UserCheck, label: 'מפיקים' },
  { to: '/admin/events', icon: Calendar, label: 'אירועים' },
  { to: '/admin/transactions', icon: CreditCard, label: 'עסקאות וצ\'ק-אין' },
  { to: '/admin/tables', icon: Table2, label: 'שולחנות ומחירון' },
  { to: '/admin/marketing', icon: Megaphone, label: 'שיווק' },
  { to: '/admin/activity', icon: Activity, label: 'פעילות מערכת' },
]

const producerLinks = [
  { to: '/producer', icon: LayoutDashboard, label: 'דשבורד' },
  { to: '/producer/events', icon: Calendar, label: 'האירועים שלי' },
  { to: '/producer/tables', icon: Table2, label: 'שולחנות ומחירים' },
  { to: '/producer/marketing', icon: Megaphone, label: 'שיווק' },
  { to: '/producer/reports', icon: BarChart3, label: 'דוחות מכירות' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : producerLinks

  const handleSignOut = async () => {
    await signOut()
    toast.success('התנתקת בהצלחה')
    navigate('/login')
  }

  return (
    <aside
      className={`
        fixed top-0 right-0 h-screen bg-surface-100 border-l border-border
        flex flex-col transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-gradient-wa flex items-center justify-center flex-shrink-0 glow-wa">
          <span className="text-sm font-black text-white">A</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-lg font-black text-gradient-wa leading-none">AXESS</span>
            <p className="text-[10px] text-muted mt-0.5 truncate">
              {isAdmin ? 'ניהול מערכת' : profile?.producers?.name || 'מפיק'}
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="mr-auto text-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-50"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 mb-3">
            {isAdmin ? 'ניהול' : 'המפיק שלי'}
          </p>
        )}
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/producer'}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-wa flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-[11px] text-muted truncate">
                {isAdmin ? 'אדמין' : 'מפיק'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/5"
          title={collapsed ? 'יציאה' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>יציאה</span>}
        </button>
      </div>
    </aside>
  )
}
