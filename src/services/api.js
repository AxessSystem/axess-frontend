import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

/* ── Generic fetch with retry + error handling ── */
async function apiFetch(path, options = {}, retries = 2) {
  const url = `${BASE}${path}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

  patchRecipientTags: (id, action, tag) =>
    apiFetch(`/api/admin/recipients/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ action, tag }) }),

  patchBulkTags: (tag, recipient_ids) =>
    apiFetch('/api/admin/recipients/bulk-tags', { method: 'PATCH', body: JSON.stringify({ tag, recipient_ids }) }),

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
