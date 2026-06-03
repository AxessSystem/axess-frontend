export async function getValidSession(supabase) {
  const sessionTimeout = new Promise((resolve) =>
    setTimeout(() => {
      console.warn('[auth] getValidSession timeout — returning null')
      resolve(null)
    }, 25000)
  )

  const sessionWork = async () => {
    try {
      // Safari detection:
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator?.userAgent || '');

      // Direct getSession without lock for Safari or as fallback:
      const directGetSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          return data?.session || null;
        } catch (e) {
          return null;
        }
      };

      if (isSafari) return directGetSession();

      // For Chrome/Firefox — race with timeout:
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      try {
        return await Promise.race([
          (async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) return null;
            const isExpired = data.session.expires_at * 1000 < Date.now();
            const isExpiringSoon = data.session.expires_at * 1000 < Date.now() + 60000;
            if (isExpired || isExpiringSoon) {
              console.log('[auth] token expired/expiring — refreshing immediately');
              return await safeRefresh(supabase);
            }
            return data.session;
          })(),
          timeout
        ]);
      } catch (e) {
        // LockManager timeout — fallback:
        return directGetSession();
      }
    } catch (e) {
      console.warn('[auth] getValidSession error:', e.message)
      return null
    }
  }

  return Promise.race([sessionWork(), sessionTimeout])
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
