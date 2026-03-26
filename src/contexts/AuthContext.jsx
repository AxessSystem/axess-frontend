import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

/** ברירת מחדל לפי תפקיד — owner: null ⇒ כל ההרשאות */
const ROLE_PERMISSIONS = {
  owner: null,
  manager: {
    can_view_inbox: true,
    can_reply_inbox: true,
    can_view_campaigns: true,
    can_create_campaigns: true,
    can_send_campaigns: true,
    can_view_events: true,
    can_manage_events: true,
    can_view_audiences: true,
    can_manage_audiences: true,
    can_view_reports: true,
    can_export_data: true,
    can_manage_webview: true,
    can_manage_flows: true,
    can_scan: true,
  },
  inbox_agent: { can_view_inbox: true, can_reply_inbox: true },
  event_producer: { can_view_events: true, can_manage_events: true, can_scan: true },
  campaign_manager: {
    can_view_campaigns: true,
    can_create_campaigns: true,
    can_send_campaigns: true,
    can_view_audiences: true,
  },
  scanner: { can_scan: true },
  analyst: {
    can_view_reports: true,
    can_view_audiences: true,
    can_view_campaigns: true,
    can_view_events: true,
  },
  coordinator: {
    can_view_events: true,
    can_manage_events: true,
    can_scan: true,
    can_view_audiences: true,
  },
  division_head: {
    can_view_inbox: true,
    can_reply_inbox: true,
    can_view_campaigns: true,
    can_create_campaigns: true,
    can_send_campaigns: true,
    can_view_events: true,
    can_manage_events: true,
    can_scan: true,
    can_view_audiences: true,
    can_manage_audiences: true,
    can_view_reports: true,
    can_export_data: true,
    can_manage_sub_accounts: true,
    can_manage_webview: true,
    can_manage_flows: true,
  },
  department_manager: {
    can_view_inbox: true,
    can_reply_inbox: true,
    can_view_events: true,
    can_manage_events: true,
    can_scan: true,
    can_view_audiences: true,
    can_manage_audiences: true,
    can_view_reports: true,
    can_approve_registrations: true,
  },
  external_auditor: { can_view_reports: true, can_view_events: true },
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [businessMember, setBusinessMember] = useState(null)
  const [loading, setLoading] = useState(true)
  /** נכון אחרי שסיימנו לטעון profile + businessMember (או שאין משתמש) — למניעת redirect מוקדם ב־useRequirePermission */
  const [identityReady, setIdentityReady] = useState(false)

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
      const rawOverrides = m.permissions && typeof m.permissions === 'object' ? m.permissions : {}
      const merged = { ...rolePerms, ...rawOverrides }
      return {
        role: m.role,
        permissions: merged,
        permissionOverrides: rawOverrides,
        businessId: m.business_id,
      }
    } catch (err) {
      console.error('fetchBusinessMember error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()
      let session = initialSession
      if (error || !session) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (!refreshed?.session) {
          setLoading(false)
          return
        }
        session = refreshed.session
      }
      setSession(session)
      if (!session?.user) {
        setProfile(null)
        setBusinessMember(null)
      }
      setLoading(false)
    }
    init()

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSession(session)
        } else {
          const { data } = await supabase.auth.refreshSession()
          if (data?.session) {
            setSession(data.session)
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    // iOS Safari — pageshow מופעל כשחוזרים מרקע
    const handlePageShow = async (e) => {
      // e.persisted = true כשהדף נטען מ-cache (BFCache) ב-iOS
      if (e.persisted || document.visibilityState === 'visible') {
        console.log('[auth] pageshow/resume — refreshing session');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
        } else {
          const { data } = await supabase.auth.refreshSession();
          if (data?.session) {
            setSession(data.session);
          } else {
            // session מת לגמרי — ניתוק
            setSession(null);
            setProfile(null);
            setBusinessMember(null);
          }
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handlePageShow);
    };
  }, []);

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
          setIdentityReady(true)
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
      setIdentityReady(true)
      return
    }

    let cancelled = false
    setIdentityReady(false)

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
        if (!cancelled) {
          setLoading(false)
          setIdentityReady(true)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [session?.user?.id, fetchProfile, fetchBusinessMember])

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
  const memberRole = businessMember?.role ?? null
  const permissions = businessMember?.permissions ?? {}
  const baseBusinessId = businessMember?.businessId ?? null

  const hasPermission = useCallback(
    (key) => {
      if (!businessMember) return false
      const r = businessMember.role
      if (r === 'owner') return true
      const overrides = businessMember.permissionOverrides || {}
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        return !!overrides[key]
      }
      const preset = ROLE_PERMISSIONS[r]
      if (preset == null) return false
      return !!preset[key]
    },
    [businessMember]
  )
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
      identityReady,
      role,
      memberRole,
      hasPermission,
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
