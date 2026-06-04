let refreshInFlight = null

export async function safeRefresh(supabase) {
  if (refreshInFlight) {
    console.log('[auth] refresh in flight — waiting')
    return await refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      const storageKey = Object.keys(localStorage).find(k =>
        k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (!storageKey) return null

      const stored = JSON.parse(localStorage.getItem(storageKey))
      const refreshToken = stored?.refresh_token
      if (!refreshToken) return null

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        console.warn(`[auth] refresh HTTP ${response.status}`)
        return null
      }

      const newSession = await response.json()
      if (!newSession?.access_token) return null

      const updated = {
        ...stored,
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (newSession.expires_in || 3600),
        expires_in: newSession.expires_in || 3600,
      }
      localStorage.setItem(storageKey, JSON.stringify(updated))
      console.log('[auth] refresh succeeded')
      return updated
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

export async function refreshIfNeeded(supabase) {
  try {
    const storageKey = Object.keys(localStorage).find(k =>
      k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (storageKey) {
      const stored = JSON.parse(localStorage.getItem(storageKey))
      const expiresAt = stored?.expires_at
      if (expiresAt && (expiresAt * 1000) < (Date.now() + 5 * 60 * 1000)) {
        console.log('[auth] refreshIfNeeded — token expiring, refreshing')
        return await safeRefresh(supabase)
      }
      if (stored?.access_token) return stored
    }
    const { data } = await supabase.auth.getSession()
    return data?.session || null
  } catch (e) {
    return await safeRefresh(supabase)
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
