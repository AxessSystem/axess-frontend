import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

import AdminRoute from '@/components/guards/AdminRoute'
import ProducerRoute from '@/components/guards/ProducerRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

/* ── Existing pages (eager) ── */
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'
import Validator from '@/pages/Validator'

/* ── New AXESS pages (lazy) ── */
const Onboarding = lazy(() => import('@/pages/Onboarding'))

/* ── Client Dashboard (lazy bundle) ── */
const ClientLayout   = lazy(() => import('@/pages/dashboard/Layout'))
const Overview       = lazy(() => import('@/pages/dashboard/Overview'))
const NewCampaign    = lazy(() => import('@/pages/dashboard/NewCampaign'))
const Audiences      = lazy(() => import('@/pages/dashboard/Audiences'))
const Reports        = lazy(() => import('@/pages/dashboard/Reports'))
const ValidatorsPage = lazy(() => import('@/pages/dashboard/Validators'))
const Settings       = lazy(() => import('@/pages/dashboard/Settings'))

/* ── Existing admin/producer pages (lazy) ── */
const AdminDashboard    = lazy(() => import('@/pages/admin/Dashboard'))
const AdminAudience     = lazy(() => import('@/pages/admin/Audience'))
const AdminProducers    = lazy(() => import('@/pages/admin/Producers'))
const AdminEvents       = lazy(() => import('@/pages/admin/Events'))
const AdminTransactions = lazy(() => import('@/pages/admin/Transactions'))
const AdminTables       = lazy(() => import('@/pages/admin/Tables'))
const AdminMarketing    = lazy(() => import('@/pages/admin/Marketing'))
const AdminActivity     = lazy(() => import('@/pages/admin/Activity'))

const ProducerDashboard = lazy(() => import('@/pages/producer/Dashboard'))
const ProducerEvents    = lazy(() => import('@/pages/producer/Events'))
const ProducerTables    = lazy(() => import('@/pages/producer/Tables'))
const ProducerMarketing = lazy(() => import('@/pages/producer/Marketing'))
const ProducerReports   = lazy(() => import('@/pages/producer/Reports'))

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div className="min-h-screen bg-surface-200 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <span className="text-base font-black text-white">A</span>
        </div>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  )
}

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
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#fff' },
            },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/v/:slug" element={<Validator />} />

            {/* ── Client Dashboard ── */}
            <Route path="/dashboard" element={<ClientLayout />}>
              <Route index element={<Overview />} />
              <Route path="new-campaign" element={<NewCampaign />} />
              <Route path="audiences" element={<Audiences />} />
              <Route path="reports" element={<Reports />} />
              <Route path="validators" element={<ValidatorsPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* ── Admin ── */}
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

            {/* ── Producer ── */}
            <Route element={<ProducerRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/producer" element={<ProducerDashboard />} />
                <Route path="/producer/events" element={<ProducerEvents />} />
                <Route path="/producer/tables" element={<ProducerTables />} />
                <Route path="/producer/marketing" element={<ProducerMarketing />} />
                <Route path="/producer/reports" element={<ProducerReports />} />
              </Route>
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
