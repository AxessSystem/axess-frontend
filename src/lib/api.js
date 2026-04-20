import { supabase } from '@/lib/supabase'
import { getValidSession, safeRefresh } from '@/lib/authCore'

let _cachedBusinessId = null
let _cachedUserId = null

const BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export async function fetchWithAuth(url, options = {}, retries = 2) {
  // Resolve full URL if path only (starts with /)
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`

  let session = await getValidSession(supabase)

  const impersonateRaw = sessionStorage.getItem('axess_impersonate')
  let businessId = null
  if (impersonateRaw) {
    try { businessId = JSON.parse(impersonateRaw)?.business?.id } catch {}
  }
  if (!businessId && session?.user?.id) {
    if (_cachedUserId === session.user.id && _cachedBusinessId) {
      businessId = _cachedBusinessId
    } else {
      try {
        const { data: members } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .limit(1)
        if (members?.length) {
          businessId = members[0].business_id
          _cachedBusinessId = businessId
          _cachedUserId = session.user.id
        }
      } catch {}
    }
  }
  if (!businessId) {
    console.warn('[fetchWithAuth] proceeding without businessId')
  }

  const buildConfig = (sess) => ({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sess?.access_token
        ? { Authorization: `Bearer ${sess.access_token}` }
        : {}),
      ...(businessId ? { 'X-Business-Id': businessId } : {}),
      ...options.headers,
    },
  })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(fullUrl, buildConfig(session))

      if (res.status === 401 && attempt === 0) {
        session = await safeRefresh(supabase)
        if (session?.access_token) continue
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || `HTTP ${res.status}`)
      }

      // Return raw Response if caller expects it (non-JSON mode)
      if (options._raw) return res

      return await res.json()

    } catch (err) {
      const isLast = attempt === retries
      const isNetwork =
        err instanceof TypeError && err.message === 'Failed to fetch'
      if (isNetwork && !isLast) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      if (isLast) {
        console.error(`[fetchWithAuth] ${url}:`, err.message)
        throw err
      }
    }
  }
}
