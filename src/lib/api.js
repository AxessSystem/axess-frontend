import { supabase } from './supabase'
import { refreshSession, forceLogout } from './authManager'

export function getCurrentBusinessId(session) {
  const impersonateId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('axess_impersonate') : null
  if (impersonateId) return impersonateId
  return session?.user?.user_metadata?.business_id ?? ''
}

export async function fetchWithAuth(url, options = {}) {
  let {
    data: { session },
  } = await supabase.auth.getSession()

  const makeRequest = (token, sess) =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'X-Business-Id': getCurrentBusinessId(sess ?? session),
      },
    })

  let res = await makeRequest(session?.access_token, session)

  if (res.status === 401) {
    try {
      const newSession = await refreshSession()
      if (newSession?.access_token) {
        res = await makeRequest(newSession.access_token, newSession)
      } else {
        forceLogout()
        throw new Error('Session expired')
      }
    } catch (e) {
      forceLogout()
      throw e
    }
  }

  return res
}
