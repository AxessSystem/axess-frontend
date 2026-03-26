import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function useRequirePermission(permission) {
  const { hasPermission, loading, identityReady } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!identityReady || loading) return
    if (permission == null || permission === undefined) return
    if (!hasPermission(permission)) {
      navigate('/dashboard', { replace: true })
    }
  }, [permission, hasPermission, navigate, loading, identityReady])

  if (!identityReady || loading) return true
  if (permission == null || permission === undefined) return true
  return hasPermission(permission)
}
