import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [businessMember, setBusinessMember] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, producers(id, name, producer_phone, business_name, is_active)')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return null
    }
    return data
  }, [])

  const fetchBusinessMember = useCallback(async (userId) => {
    try {
      console.log('fetchBusinessMember called with userId:', userId)
      const { data: members, error } = await supabase
        .from('business_members')
        .select('role, permissions, business_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
      console.log('business_members result:', JSON.stringify(members), 'error:', JSON.stringify(error))
      console.log('BM QUERY RESULT:', { members, error, userId })
      console.log('BM QUERY DEBUG:', JSON.stringify({ members, error, userId }))
      if (error || !members?.length) {
        if (error) console.error('business_members query error:', error)
        if (!members?.length) console.warn('no business_members found for user:', userId)
        return null
      }
      const m = members[0]
      const { data: rp } = await supabase.from('role_permissions').select('permissions').eq('role', m.role).single()
      const rolePerms = rp?.permissions || {}
      const merged = { ...rolePerms, ...(m.permissions || {}) }
      return { role: m.role, permissions: merged, businessId: m.business_id }
    } catch (err) {
      console.error('fetchBusinessMember error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (!session?.user) {
        setProfile(null)
        setBusinessMember(null)
      }
      setLoading(false)
    }
    init()

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.refreshSession()
        if (session) {
          setSession(session)
        } else {
          const { data: { session: s } } = await supabase.auth.getSession()
          setSession(s)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[auth] state change:', event, !!session)
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session)
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setProfile(null)
          setBusinessMember(null)
        }
      },
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      setBusinessMember(null)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const profileData = await fetchProfile(userId)

        if (cancelled) return

        if (profileData?.is_axess_admin === true) {
          setProfile(profileData)
          setBusinessMember(null)
        } else {
          const bm = await fetchBusinessMember(userId)
          if (cancelled) return
          setProfile(profileData)
          setBusinessMember(bm)
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Auth load failed:', e)
          setProfile(null)
          setBusinessMember(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session?.user?.id, fetchProfile, fetchBusinessMember])

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.warn('[auth] refresh failed:', error.message)
      }
    }, 50 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          await supabase.auth.refreshSession()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithOtp = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
    return data
  }

  const verifyOtp = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) throw error
    return data
  }

  const resetPasswordForEmail = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) throw error
    return data
  }

  const updateUser = async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setBusinessMember(null)
  }

  const role = businessMember?.role ?? null
  const permissions = businessMember?.permissions ?? {}
  const baseBusinessId = businessMember?.businessId ?? null
  const isAdmin = profile?.role === 'admin'
  const isProducer = profile?.role === 'producer'
  const producerId = profile?.producer_id
  const isAxessAdmin = profile?.is_axess_admin === true

  const impersonateId = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('axess_impersonate')
    : null
  const impersonateName = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('axess_impersonate_name') || ''
    : ''
  const isImpersonating = isAxessAdmin && !!impersonateId
  const effectiveBusinessId = isImpersonating ? impersonateId : baseBusinessId

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      role,
      permissions,
      businessId: effectiveBusinessId,
      isAdmin,
      isProducer,
      isAxessAdmin,
      isImpersonating,
      impersonateBusinessId: impersonateId,
      impersonateBusinessName: impersonateName,
      producerId,
      user: session?.user,
      signIn,
      signOut,
      signInWithOtp,
      verifyOtp,
      resetPasswordForEmail,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
