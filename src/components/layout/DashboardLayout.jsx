import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-surface-200 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${collapsed ? 'mr-16' : 'mr-60'}`}
      >
        <div className="max-w-screen-xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
