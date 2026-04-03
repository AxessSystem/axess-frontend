export async function getValidSession(supabase) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('getValidSession timeout 8s')), 8000)
  );

  const logic = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        return await safeRefresh(supabase);
      }

      const isExpired = data.session.expires_at * 1000 < Date.now() + 30000;
      if (isExpired) {
        return await safeRefresh(supabase);
      }

      return data.session;
    } catch (e) {
      console.error('[authCore] getValidSession error:', e);
      return null;
    }
  };

  try {
    return await Promise.race([logic(), timeout]);
  } catch (e) {
    console.warn('[authCore] getValidSession timeout:', e.message);
    // fallback — נסה getSession ישירות בלי lock:
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  }
}

export async function safeRefresh(supabase) {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session) {
      console.warn('[authCore] safeRefresh failed:', error?.message);
      return null;
    }
    return data.session;
  } catch (e) {
    console.warn('[authCore] safeRefresh exception:', e);
    return null;
  }
}
