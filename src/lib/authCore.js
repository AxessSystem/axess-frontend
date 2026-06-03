export async function getValidSession(supabase) {
  try {
    let isExpiredInStorage = false
    try {
      const storageKey = Object.keys(localStorage).find(k =>
        k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (storageKey) {
        const stored = JSON.parse(localStorage.getItem(storageKey))
        const expiresAt = stored?.expires_at
        if (expiresAt) {
          isExpiredInStorage = (expiresAt * 1000) < (Date.now() + 60000)
        }
      }
    } catch (e) {}

    if (isExpiredInStorage) {
      console.log('[auth] token expired in storage — refreshing immediately')
      return await safeRefresh(supabase)
    }

    const { data, error } = await supabase.auth.getSession()
    if (error || !data?.session) return null
    return data.session
  } catch (e) {
    console.warn('[auth] getValidSession error:', e.message)
    return null
  }
}

export async function safeRefresh(supabase) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[auth] safeRefresh attempt ${attempt}`)

      let refreshToken = null
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (storageKey) {
          const stored = JSON.parse(localStorage.getItem(storageKey))
          refreshToken = stored?.refresh_token
        }
      } catch (e) {
        console.warn('[auth] failed to read localStorage:', e.message)
      }

      if (!refreshToken) {
        console.warn('[auth] no refresh token in localStorage')
        return null
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

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
        const errBody = await response.json().catch(() => ({}))
        console.warn(`[auth] refresh HTTP ${response.status}:`, errBody)
        if (attempt === 2) return null
        await new Promise(r => setTimeout(r, 2000))
        continue
      }

      const newSession = await response.json()

      if (!newSession?.access_token) {
        console.warn('[auth] refresh returned no access_token')
        return null
      }

      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (storageKey) {
          const existing = JSON.parse(localStorage.getItem(storageKey))
          const updated = {
            ...existing,
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (newSession.expires_in || 3600),
            expires_in: newSession.expires_in || 3600,
          }
          localStorage.setItem(storageKey, JSON.stringify(updated))
          console.log('[auth] localStorage updated with new tokens')
        }
      } catch (e) {
        console.warn('[auth] failed to update localStorage:', e.message)
      }

      console.log(`[auth] safeRefresh succeeded on attempt ${attempt}`)
      return newSession
    } catch (e) {
      console.warn(`[auth] safeRefresh attempt ${attempt} error:`, e.message)
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}
