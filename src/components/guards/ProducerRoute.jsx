import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProducerRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-wa/30 border-t-wa rounded-full animate-spin" />
          <p className="text-muted text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== 'producer') return <Navigate to="/login" replace />
  if (!profile?.producer_id) {
    return (
      <div className="min-h-screen bg-surface-200 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">חשבון לא מקושר</h2>
          <p className="text-muted text-sm">
            החשבון שלך אינו מקושר למפיק. פנה לאדמין לקישור החשבון.
          </p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
