import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

import AdminRoute from '@/components/guards/AdminRoute'
import ProducerRoute from '@/components/guards/ProducerRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'

import AdminDashboard from '@/pages/admin/Dashboard'
import AdminAudience from '@/pages/admin/Audience'
import AdminProducers from '@/pages/admin/Producers'
import AdminEvents from '@/pages/admin/Events'
import AdminTransactions from '@/pages/admin/Transactions'
import AdminTables from '@/pages/admin/Tables'
import AdminMarketing from '@/pages/admin/Marketing'
import AdminActivity from '@/pages/admin/Activity'

import ProducerDashboard from '@/pages/producer/Dashboard'
import ProducerEvents from '@/pages/producer/Events'
import ProducerTables from '@/pages/producer/Tables'
import ProducerMarketing from '@/pages/producer/Marketing'
import ProducerReports from '@/pages/producer/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#242424',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              fontSize: '14px',
              direction: 'rtl',
            },
            success: {
              iconTheme: { primary: '#25D366', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/audience" element={<AdminAudience />} />
              <Route path="/admin/producers" element={<AdminProducers />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/tables" element={<AdminTables />} />
              <Route path="/admin/marketing" element={<AdminMarketing />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
            </Route>
          </Route>

          {/* Producer */}
          <Route element={<ProducerRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/producer" element={<ProducerDashboard />} />
              <Route path="/producer/events" element={<ProducerEvents />} />
              <Route path="/producer/tables" element={<ProducerTables />} />
              <Route path="/producer/marketing" element={<ProducerMarketing />} />
              <Route path="/producer/reports" element={<ProducerReports />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
