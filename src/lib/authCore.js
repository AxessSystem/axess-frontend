let refreshInFlight = null

export async function safeRefresh(supabase) {
  if (refreshInFlight) {
    console.log('[auth] refresh in flight — waiting')
    return await refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      const { data, error } = await Promise.race([
        supabase.auth.refreshSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('refresh timeout')), 10000)),
      ])
      if (error || !data?.session) return null
      console.log('[auth] refresh succeeded')
      return data.session
    } catch (e) {
      console.warn('[auth] refresh failed:', e.message)
      return null
    }
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function getValidSession(supabase) {
  try {
    try {
      const storageKey = Object.keys(localStorage).find(k =>
        k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (storageKey) {
        const stored = JSON.parse(localStorage.getItem(storageKey))
        const expiresAt = stored?.expires_at
        if (expiresAt && (expiresAt * 1000) < (Date.now() + 60000)) {
          console.log('[auth] token expiring — refreshing')
          return await safeRefresh(supabase)
        }
      }
    } catch (e) {}

    const { data, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 8000)),
    ])

    if (error || !data?.session) return null
    return data.session
  } catch (e) {
    console.warn('[auth] getValidSession:', e.message)
    return await safeRefresh(supabase)
  }
}
