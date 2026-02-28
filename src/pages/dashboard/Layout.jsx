import { useState } from 'react'
import { Link, useLocation, Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Send, Users, BarChart3, QrCode, Settings,
  Bell, Menu, X, ChevronDown, MessageCircle, Wallet, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'סקירה כללית', path: '/dashboard' },
  { icon: Send,            label: 'קמפיין חדש',  path: '/dashboard/new-campaign' },
  { icon: Users,           label: 'קהלים',        path: '/dashboard/audiences' },
  { icon: BarChart3,       label: 'דוחות',        path: '/dashboard/reports' },
  { icon: QrCode,          label: 'Validators',   path: '/dashboard/validators' },
  { icon: Settings,        label: 'הגדרות',       path: '/dashboard/settings' },
]

function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
          isActive
            ? 'text-white bg-primary/10 border border-primary/20'
            : 'text-subtle hover:text-white hover:bg-surface-50'
        }`
      }
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function DashboardClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const businessName = 'קפה רוטשילד'
  const balance = 4_820

  return (
    <div className="min-h-screen bg-surface-200 flex" dir="rtl">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden lg:flex flex-col bg-surface-100 border-l border-border transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } flex-shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-glow-primary">
            <span className="text-sm font-black text-white">A</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              AXESS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Balance */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} className="text-primary" />
                <span className="text-xs text-subtle font-medium">יתרת הודעות</span>
              </div>
              <div className="text-xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {balance.toLocaleString('he-IL')}
              </div>
              <div className="text-xs text-muted mt-0.5">הודעות זמינות</div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 border-t border-border text-muted hover:text-white transition-colors flex items-center justify-center"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-90' : '-rotate-90'}`}
          />
        </button>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-surface-100 border-l border-border z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-sm font-black text-white">A</span>
                  </div>
                  <span className="text-lg font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>AXESS</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 p-3 flex flex-col gap-1">
                {NAV_ITEMS.map(item => (
                  <div key={item.path} onClick={() => setSidebarOpen(false)}>
                    <SidebarLink item={item} collapsed={false} />
                  </div>
                ))}
              </nav>

              <div className="p-3 border-t border-border">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                  <div className="text-xs text-subtle font-medium mb-1">יתרת הודעות</div>
                  <div className="text-xl font-black text-white">{balance.toLocaleString('he-IL')}</div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── HEADER ── */}
        <header className="bg-surface-100 border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-muted hover:text-white p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Business name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {businessName.charAt(0)}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white">{businessName}</div>
              <div className="text-xs text-muted">לוח בקרה</div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Balance badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
              <Wallet size={14} className="text-primary" />
              <span className="text-sm font-semibold text-white">{balance.toLocaleString('he-IL')}</span>
              <span className="text-xs text-muted">הודעות</span>
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl bg-surface-50 border border-border flex items-center justify-center text-muted hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                2
              </span>
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center cursor-pointer">
              <span className="text-sm font-bold text-white">{businessName.charAt(0)}</span>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden bg-surface-100 border-t border-border px-2 py-2 flex items-center justify-around sticky bottom-0 z-30">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
