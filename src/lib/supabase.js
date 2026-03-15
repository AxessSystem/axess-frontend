import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchWithAuth(url, options = {}, session, onUnauthorized) {
  const response = await fetch(url, options)
  if (response.status === 401) {
    const { data: { session: newSession } } = await supabase.auth.refreshSession()
    if (newSession) {
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newSession.access_token}`,
        },
      }
      return fetch(url, newOptions)
    }
    onUnauthorized?.()
  }
  return response
}
