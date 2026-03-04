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
      const { data: members, error } = await supabase
        .from('business_members')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
      if (error || !members?.length) return null
      const m = members[0]
      const { data: rp } = await supabase.from('role_permissions').select('permissions').eq('role', m.role).single()
      const rolePerms = rp?.permissions || {}
      const merged = { ...rolePerms, ...(m.permissions || {}) }
      return { role: m.role, permissions: merged }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setProfile(profile)
        const bm = await fetchBusinessMember(session.user.id)
        setBusinessMember(bm)
      } else {
        setBusinessMember(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setProfile(profile)
          const bm = await fetchBusinessMember(session.user.id)
          setBusinessMember(bm)
        } else {
          setProfile(null)
          setBusinessMember(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, fetchBusinessMember])

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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login?reset=ok` })
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
  const isAdmin = profile?.role === 'admin'
  const isProducer = profile?.role === 'producer'
  const producerId = profile?.producer_id

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      role,
      permissions,
      isAdmin,
      isProducer,
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
