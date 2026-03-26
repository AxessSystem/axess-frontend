import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

/* ── Generic fetch with retry + error handling ── */
async function apiFetch(path, options = {}, retries = 2) {
  const url = `${BASE}${path}`

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const authHeaders = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}

  // קבל businessId מ-sessionStorage או מה-session
  const impersonateId = sessionStorage.getItem('axess_impersonate')
  let businessId = null
  if (impersonateId) {
    try {
      businessId = JSON.parse(impersonateId)?.business?.id
    } catch {}
  }
  if (!businessId) {
    businessId = session?.user?.user_metadata?.business_id
  }

  const businessHeaders = businessId ? { 'X-Business-Id': businessId } : {}

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...businessHeaders,
      ...options.headers,
    },
    ...options,
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, config)

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || `HTTP ${res.status}`)
      }

      return await res.json()
    } catch (err) {
      const isLast = attempt === retries
      const isNetwork = err instanceof TypeError && err.message === 'Failed to fetch'

      if (isNetwork && !isLast) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      if (isLast) {
        console.error(`[API] ${path}:`, err.message)
        throw err
      }
    }
  }
}

/* ── API methods ── */
export const api = {
  /* Auth / Business */
  getBusiness: (phone) =>
    apiFetch(`/api/business/${encodeURIComponent(phone)}`),

  /* Campaigns */
  getCampaigns: (bizId) =>
    apiFetch(`/api/campaigns/${bizId}`),

  getCampaignStats: (id) =>
    apiFetch(`/api/admin/validators/${id}/stats`),

  createCampaign: (payload) =>
    apiFetch('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /* Recipients */
  getRecipients: (bizId) =>
    apiFetch(`/api/recipients/${bizId}`),

  uploadRecipients: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch('/api/sms/upload', {
      method: 'POST',
      headers: {},
      body: formData,
    })
  },

  /* Validators */
  getValidators: (campaignId) =>
    apiFetch(`/api/admin/validators/${campaignId}/list`),

  getValidatorBySlug: (slug) =>
    apiFetch(`/api/validators/${slug}`),

  redeemValidator: (slug, data) =>
    apiFetch(`/api/validators/${slug}/redeem`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /* Customer Profile (Audiences drawer) */
  getCustomerProfile: (masterRecipientId, businessId) =>
    apiFetch(`/api/admin/customer-profile/${masterRecipientId}${businessId ? `?business_id=${encodeURIComponent(businessId)}` : ''}`),

  patchRecipientTags: (id, { tags, business_id }) =>
    apiFetch(`/api/admin/recipients/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ tags, business_id }) }),

  patchBulkTags: ({ tag, recipient_ids, business_id }) =>
    apiFetch('/api/admin/recipients/bulk-tags', { method: 'PATCH', body: JSON.stringify({ tag, recipient_ids, business_id }) }),

  getEventsList: (businessId) =>
    apiFetch(`/api/admin/recipients/events-list?business_id=${encodeURIComponent(businessId)}`),

  /* Balance */
  getBalance: () =>
    apiFetch('/api/admin/balance'),

  /* SMS */
  sendCampaign: (payload) =>
    apiFetch('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

/* ── React Query helpers ── */
export const queryKeys = {
  business:   (phone)      => ['business', phone],
  campaigns:  (bizId)      => ['campaigns', bizId],
  recipients: (bizId)      => ['recipients', bizId],
  validators: (campaignId) => ['validators', campaignId],
  balance:    ()           => ['balance'],
}

/* ── Toast error wrapper ── */
export async function apiWithToast(fn, { successMsg, errorMsg } = {}) {
  try {
    const result = await fn()
    if (successMsg) toast.success(successMsg)
    return result
  } catch (err) {
    toast.error(errorMsg || err.message || 'שגיאה בשרת')
    throw err
  }
}
