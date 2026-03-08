import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

import AdminRoute from '@/components/guards/AdminRoute'
import ProducerRoute from '@/components/guards/ProducerRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

/* ── Existing pages (eager) ── */
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import NotFound from '@/pages/NotFound'
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'
import Validator from '@/pages/Validator'
import ScanStation from '@/pages/ScanStation'
import Join from '@/pages/Join'

/* ── New AXESS pages (lazy) ── */
const Onboarding      = lazy(() => import('@/pages/Onboarding'))
const About           = lazy(() => import('@/pages/About'))
const Pricing         = lazy(() => import('@/pages/Pricing'))
const Features        = lazy(() => import('@/pages/Features'))

/* ── Industry pages (lazy) ── */
const IndustryEvents        = lazy(() => import('@/pages/industries/Events'))
const IndustryHotels        = lazy(() => import('@/pages/industries/Hotels'))
const IndustryRestaurants   = lazy(() => import('@/pages/industries/Restaurants'))
const IndustryRetail        = lazy(() => import('@/pages/industries/Retail'))
const IndustryGyms          = lazy(() => import('@/pages/industries/Gyms'))
const IndustryOrganizations = lazy(() => import('@/pages/industries/Organizations'))
const EventPage = lazy(() => import('@/pages/EventPage'))
const GroupRegistrationPage = lazy(() => import('@/pages/GroupRegistrationPage'))
const GroupManagementPage = lazy(() => import('@/pages/GroupManagementPage'))
const TableBookingPage = lazy(() => import('@/pages/TableBookingPage'))
const BookingManagementPage = lazy(() => import('@/pages/BookingManagementPage'))
const GuestPaymentPage = lazy(() => import('@/pages/GuestPaymentPage'))

/* ── Client Dashboard (lazy bundle) ── */
const ClientLayout   = lazy(() => import('@/pages/dashboard/Layout'))
const Overview       = lazy(() => import('@/pages/dashboard/Overview'))
const NewCampaign    = lazy(() => import('@/pages/dashboard/NewCampaign'))
const Audiences      = lazy(() => import('@/pages/dashboard/Audiences'))
const Reports        = lazy(() => import('@/pages/dashboard/Reports'))
const ValidatorsPage = lazy(() => import('@/pages/dashboard/Validators'))
const EventsPage     = lazy(() => import('@/pages/dashboard/Events'))
const PromotersPage  = lazy(() => import('@/pages/dashboard/Promoters'))
const Staff          = lazy(() => import('@/pages/dashboard/Staff'))
const Settings       = lazy(() => import('@/pages/dashboard/Settings'))
const SubAccounts    = lazy(() => import('@/pages/dashboard/SubAccounts'))
const Inbox          = lazy(() => import('@/pages/dashboard/Inbox'))
const Notifications  = lazy(() => import('@/pages/dashboard/Notifications'))

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

/* ── AXESS Admin (platform) ── */
const AxessAdminLayout   = lazy(() => import('@/pages/axessAdmin/AdminLayout'))
const AdminOverviewPage  = lazy(() => import('@/pages/axessAdmin/AdminOverview'))
const AdminBusinessesPage = lazy(() => import('@/pages/axessAdmin/AdminBusinesses'))
const AdminSMSPage       = lazy(() => import('@/pages/axessAdmin/AdminSMS'))
const AdminNoticesPage   = lazy(() => import('@/pages/axessAdmin/AdminNotices'))
const AdminAuditLogPage  = lazy(() => import('@/pages/axessAdmin/AdminAuditLog'))

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--v2-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--v2-dark)' }}>A</span>
        </div>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(0,195,122,0.3)', borderTopColor: 'var(--v2-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading && !session) return null
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function RecoveryRedirectHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      navigate('/reset-password' + hash, { replace: true })
    }
  }, [navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RecoveryRedirectHandler />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--v2-dark-2)',
              color: '#fff',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              fontSize: '14px',
              direction: 'rtl',
            },
            success: {
              iconTheme: { primary: '#00C37A', secondary: '#080C14' },
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/join" element={<Join />} />
            <Route path="/join/:token" element={<Join />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/v/:slug" element={<Validator />} />
            <Route path="/e/:slug" element={<EventPage />} />
            <Route path="/e/:slug/group-register" element={<GroupRegistrationPage />} />
            <Route path="/group/:code" element={<GroupManagementPage />} />
            <Route path="/t/slug/:slug" element={<TableBookingPage />} />
            <Route path="/booking/:id" element={<BookingManagementPage />} />
            <Route path="/g/token/:token" element={<GuestPaymentPage />} />
            <Route path="/scan/:eventSlug" element={<ScanStation />} />

            {/* ── Industries ── */}
            <Route path="/industries" element={<Navigate to="/industries/events" replace />} />
            <Route path="/industries/events"        element={<IndustryEvents />} />
            <Route path="/industries/hotels"        element={<IndustryHotels />} />
            <Route path="/industries/restaurants"   element={<IndustryRestaurants />} />
            <Route path="/industries/retail"        element={<IndustryRetail />} />
            <Route path="/industries/gyms"          element={<IndustryGyms />} />
            <Route path="/industries/organizations" element={<IndustryOrganizations />} />

            {/* ── Client Dashboard ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ClientLayout />}>
                <Route index element={<Overview />} />
                <Route path="new-campaign" element={<NewCampaign />} />
                <Route path="audiences" element={<Audiences />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="promoters" element={<PromotersPage />} />
                <Route path="reports" element={<Reports />} />
                <Route path="validators" element={<ValidatorsPage />} />
                <Route path="staff" element={<Staff />} />
                <Route path="settings" element={<Settings />} />
                <Route path="sub-accounts" element={<SubAccounts />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
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

            {/* ── AXESS Admin (platform) ── */}
            <Route path="/axess-admin" element={<AxessAdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="businesses" element={<AdminBusinessesPage />} />
              <Route path="sms" element={<AdminSMSPage />} />
              <Route path="notices" element={<AdminNoticesPage />} />
              <Route path="audit" element={<AdminAuditLogPage />} />
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
