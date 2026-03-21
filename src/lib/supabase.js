import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export async function fetchWithAuth(url, options = {}, _session, onUnauthorized) {
  const { data: { session } } = await supabase.auth.getSession()

  const makeRequest = async (token) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  let res = await makeRequest(session?.access_token)

  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed?.session?.access_token) {
      res = await makeRequest(refreshed.session.access_token)
    } else {
      onUnauthorized?.()
    }
  }

  return res
}
