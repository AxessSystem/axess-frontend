import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { forceLogout } from '@/lib/authManager'

async function getValidSession() {
  const { data } = await supabase.auth.getSession()
  return data.session || null
}

async function safeRefresh() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data?.session) return null
    return data.session
  } catch (e) {
    console.error('[authCore] safeRefresh failed:', e)
    return null
  }
}

let isRetrying = false

export async function apiFetch(url, options = {}) {
  try {
    const token = (await safeRefresh())?.access_token
    if (!options.headers) options.headers = {}
    if (token) options.headers.Authorization = `Bearer ${token}`

    let res = await fetch(url, options)
    if (res.status === 401 && !isRetrying) {
      isRetrying = true
      try {
        const refreshed = await safeRefresh()
        if (!refreshed) {
          forceLogout()
          throw new Error('Unauthorized')
        }
        options.headers.Authorization = `Bearer ${refreshed.access_token}`
        res = await fetch(url, options)
      } finally {
        isRetrying = false
      }
    }

    return res
  } catch (e) {
    console.error('[apiFetch] error:', e)
    throw e
  }
}

export async function safeQuery(builder) {
  try {
    const session = await safeRefresh()
    if (!session) {
      forceLogout()
      throw new Error('Unauthorized')
    }

    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    const { data, error } = await builder
    if (error) throw error
    return data
  } catch (e) {
    console.error('[safeQuery] failed:', e)
    throw e
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [businessMember, setBusinessMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [identityReady, setIdentityReady] = useState(false)

  const fetchProfile = useCallback(async (userId) => {
    return await safeQuery(
      supabase.from('profiles').select('*, producers(*)').eq('id', userId).single(),
    )
  }, [])

  const fetchBusinessMember = useCallback(async (userId) => {
    const members = await safeQuery(
      supabase
        .from('business_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1),
    )
    if (!members?.length) return null
    const m = members[0]
    const rolePerms = await safeQuery(
      supabase.from('role_permissions').select('permissions').eq('role', m.role).single(),
    )
    const overrides = m.permissions && typeof m.permissions === 'object' ? m.permissions : {}
    const merged = { ...(rolePerms?.permissions || {}), ...overrides }
    return {
      ...m,
      permissions: merged,
      permissionOverrides: overrides,
    }
  }, [])

  useEffect(() => {
    let debounceTimeout = null

    const doRefresh = async () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(async () => {
        try {
          const newSession = await safeRefresh()
          if (newSession) setSession(newSession)
        } catch (e) {
          console.warn('[auth] doRefresh failed:', e)
        }
      }, 3000)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') doRefresh()
    }
    const handleOnline = () => doRefresh()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)

    ;(async () => {
      const s = await getValidSession()
      if (s) setSession(s)
      setLoading(false)
    })()

    return () => {
      clearTimeout(debounceTimeout)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setBusinessMember(null)
      setIdentityReady(true)
      return
    }

    let cancelled = false
    setIdentityReady(false)

    const load = async () => {
      try {
        const p = await fetchProfile(session.user.id)
        const bm = await fetchBusinessMember(session.user.id)
        if (!cancelled) {
          setProfile(p)
          setBusinessMember(bm)
        }
      } catch (e) {
        if (!cancelled) console.error(e)
      } finally {
        if (!cancelled) setIdentityReady(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id, fetchProfile, fetchBusinessMember])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setBusinessMember(null)
  }

  const hasPermission = useCallback(
    (key) => {
      if (!businessMember) return false
      if (businessMember.role === 'owner') return true
      const overrides = businessMember.permissionOverrides || {}
      if (key in overrides) return !!overrides[key]
      return !!businessMember.permissions?.[key]
    },
    [businessMember],
  )

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        businessMember,
        loading,
        identityReady,
        hasPermission,
        memberRole: businessMember?.role,
        businessId: businessMember?.business_id,
        safeQuery,
        apiFetch,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
