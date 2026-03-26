import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function useRequirePermission(permission) {
  const { hasPermission, memberRole, identityReady, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!identityReady || loading) return
    // owner תמיד מורשה
    if (memberRole === 'owner') return
    if (!hasPermission(permission)) {
      navigate('/dashboard', { replace: true })
    }
  }, [identityReady, loading, memberRole, permission])

  // owner תמיד true
  if (memberRole === 'owner') return true
  return hasPermission(permission)
}
