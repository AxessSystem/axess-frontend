import { supabase } from './supabase'

let isRefreshing = false
let refreshPromise = null

export async function refreshSession() {
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => {
        if (error) throw error
        return data.session
      })
      .finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
  }
  return refreshPromise
}

export function forceLogout() {
  supabase.auth.signOut()
  localStorage.clear()
  sessionStorage.clear()
  window.location.href = '/login'
}
