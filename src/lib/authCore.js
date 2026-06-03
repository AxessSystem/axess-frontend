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
            const isExpired = data.session.expires_at * 1000 < Date.now() + 30000;
            if (isExpired) return await safeRefresh(supabase);
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

      const { data: sessionData } = await supabase.auth.getSession()
      const refreshToken = sessionData?.session?.refresh_token

      if (!refreshToken) {
        console.warn('[auth] no refresh token in storage')
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
        console.warn(`[auth] refresh HTTP ${response.status}`)
        if (attempt === 2) return null
        await new Promise(r => setTimeout(r, 2000))
        continue
      }

      const newSession = await response.json()

      if (!newSession?.access_token) {
        console.warn('[auth] refresh returned no access_token')
        return null
      }

      await supabase.auth.setSession({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
      })

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
