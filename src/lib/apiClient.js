import { supabase } from '@/lib/supabase'
import { getValidSession, safeRefresh } from '@/lib/authCore'

let isRetrying = false

export async function apiFetch(url, options = {}) {
  let session = await getValidSession(supabase)

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: session?.access_token
        ? `Bearer ${session.access_token}`
        : undefined,
    },
  })

  if (response.status !== 401) return response

  if (isRetrying) {
    throw new Error('Unauthorized (after retry)')
  }

  isRetrying = true

  try {
    session = await safeRefresh(supabase)

    if (!session) {
      throw new Error('Session expired')
    }

    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    return response
  } finally {
    isRetrying = false
  }
}
