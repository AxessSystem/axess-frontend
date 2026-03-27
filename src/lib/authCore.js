export async function getValidSession(supabase) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  const isExpired = session.expires_at * 1000 < Date.now() + 30000;
  if (!isExpired) return session;

  return await safeRefresh(supabase);
}

export async function safeRefresh(supabase) {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('[auth] safeRefresh failed:', error.message);
      return null;
    }
    return data.session;
  } catch (e) {
    console.warn('[auth] safeRefresh exception:', e);
    return null;
  }
}
