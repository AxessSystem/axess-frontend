export async function getValidSession(supabase) {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      // אין session — נסה refresh
      return await safeRefresh(supabase);
    }

    const isExpired = data.session.expires_at * 1000 < Date.now() + 30000;
    if (isExpired) {
      // פג — נסה refresh
      return await safeRefresh(supabase);
    }

    return data.session;
  } catch (e) {
    console.error('[authCore] getValidSession error:', e);
    return null;
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
