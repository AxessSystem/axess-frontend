import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getValidSession, safeRefresh } from '@/lib/authCore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [businessMember, setBusinessMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [identityReady, setIdentityReady] = useState(false)

  // -----------------------------
  // 🧠 PROFILE
  // -----------------------------
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
        .select('role, permissions, business_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)

      if (error || !members?.length) return null

      const m = members[0]

      const { data: rp } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', m.role)
        .single()

      const rolePerms = rp?.permissions || {}
      const overrides = m.permissions || {}

      return {
        role: m.role,
        permissions: { ...rolePerms, ...overrides },
        permissionOverrides: overrides,
        businessId: m.business_id,
      }
    } catch (err) {
      console.error('fetchBusinessMember error:', err)
      return null
    }
  }, [])

  // -----------------------------
  // 🚀 INIT (FIXED)
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      let session = null
      try {
        session = await getValidSession(supabase)
      } catch (e) {
        // ignore
      }

      setSession(session)

      if (session?.user?.id) {
        try {
          const [bm, p] = await Promise.all([
            fetchBusinessMember(session.user.id),
            fetchProfile(session.user.id)
          ])
          if (bm) setBusinessMember(bm)
          if (p) setProfile(p)
        } catch (e) {
          // ignore
        }
      }

      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setProfile(null)
          setBusinessMember(null)
          setIdentityReady(true)
        } else {
          setSession(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // -----------------------------
  // 📱 iOS FIX (SINGLE LISTENER)
  // -----------------------------
  useEffect(() => {
    let lastRun = 0

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRun < 3000) return;
      lastRun = now;

      // קבל session עדכני
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        // נסה refresh
        const newSession = await safeRefresh(supabase);
        if (newSession) {
          setSession(newSession);
        }
        return;
      }

      // session קיים — בדוק אם businessMember חסר
      setSession(currentSession);

      if (!businessMember && currentSession.user?.id) {
        const bm = await fetchBusinessMember(currentSession.user.id);
        if (bm) setBusinessMember(bm);

        // טען גם profile אם חסר
        if (!profile) {
          const p = await fetchProfile(currentSession.user.id);
          if (p) setProfile(p);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // -----------------------------
  // 👤 LOAD USER DATA
  // -----------------------------
  useEffect(() => {
    const userId = session?.user?.id

    if (!userId) {
      setProfile(null)
      setBusinessMember(null)
      setIdentityReady(true)
      return
    }

    let cancelled = false
    setIdentityReady(false)

    const load = async () => {
      try {
        const profileData = await fetchProfile(userId)
        if (cancelled) return

        if (profileData?.is_axess_admin) {
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
        if (!cancelled) {
          setIdentityReady(true)
        }
      }
    }

    load()

    return () => { cancelled = true }
  }, [session?.user?.id, fetchProfile, fetchBusinessMember])

  // -----------------------------
  // 🔐 AUTH ACTIONS
  // -----------------------------
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setBusinessMember(null)
  }

  // -----------------------------
  // 🎯 PERMISSIONS (UNCHANGED)
  // -----------------------------
  const hasPermission = useCallback(
    (key) => {
      if (!businessMember) return false
      if (businessMember.role === 'owner') return true

      const overrides = businessMember.permissionOverrides || {}
      if (key in overrides) return !!overrides[key]

      return !!businessMember.permissions?.[key]
    },
    [businessMember]
  )

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      businessMember,
      loading,
      identityReady,
      user: session?.user,
      businessId: businessMember?.businessId ?? null,
      hasPermission,
      signIn,
      signOut,
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
