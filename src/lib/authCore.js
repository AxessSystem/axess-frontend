export async function getValidSession(supabase) {
  const sessionTimeout = new Promise((resolve) =>
    setTimeout(() => {
      console.warn('[auth] getValidSession timeout — returning null')
      resolve(null)
    }, 15000)
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
  try {
    const refreshPromise = supabase.auth.refreshSession()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('refresh timeout')), 8000)
    )
    const { data, error } = await Promise.race([refreshPromise, timeoutPromise])
    if (error || !data?.session) return null
    return data.session
  } catch (e) {
    console.warn('[auth] safeRefresh failed:', e.message)
    return null
  }
}
