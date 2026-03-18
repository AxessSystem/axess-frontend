import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Tag, Users2, Trash2, RefreshCw } from 'lucide-react'
import AdminRecipientDrawer from './AdminRecipientDrawer'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

function engagementBadgeColor(score) {
  const s = Number(score || 0)
  if (s >= 80) return { bg: 'rgba(16,185,129,0.16)', border: 'rgba(16,185,129,0.35)', fg: 'rgb(16,185,129)' }
  if (s >= 45) return { bg: 'rgba(59,130,246,0.16)', border: 'rgba(59,130,246,0.35)', fg: 'rgb(59,130,246)' }
  if (s > 0) return { bg: 'rgba(245,158,11,0.16)', border: 'rgba(245,158,11,0.35)', fg: 'rgb(245,158,11)' }
  return { bg: 'var(--v2-dark-3)', border: 'var(--glass-border)', fg: 'var(--v2-gray-400)' }
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('he-IL')
}

export default function AdminRecipientsPage() {
  const { session, isAxessAdmin } = useAuth()

  const [search, setSearch] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [tag, setTag] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [page, setPage] = useState(1)

  const [selectedRecipient, setSelectedRecipient] = useState(null)

  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}

  const pageSize = 50
  const offset = (page - 1) * pageSize

  const {
    data: businessesData,
  } = useQuery({
    queryKey: ['adminBusinessesForRecipients', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/admin/businesses`, { headers }).then((r) => r.json()),
    enabled: !!session?.access_token,
  })

  const businesses = businessesData?.businesses || []
  const businessTypes = useMemo(() => {
    const s = new Set(businesses.map((b) => b.business_type).filter(Boolean))
    return [...s]
  }, [businesses])

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (businessId) params.set('business_id', businessId)
    if (businessType) params.set('business_type', businessType)
    if (tag.trim()) params.set('tag', tag.trim())
    if (Number(minScore) > 0) params.set('min_score', String(minScore))
    params.set('limit', String(pageSize))
    params.set('offset', String(offset))
    return params.toString()
  }, [search, businessId, businessType, tag, minScore, offset])

  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    refetch,
  } = useQuery({
    queryKey: ['adminAllRecipients', session?.access_token, search, businessId, businessType, tag, minScore, page],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/all-recipients?${queryParams}`, { headers }).then((r) =>
        r.json()
      ),
    enabled: !!session?.access_token,
    keepPreviousData: true,
  })

  const recipients = recipientsData?.recipients || []
  const total = Number(recipientsData?.total || 0)

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  const resetFilters = () => {
    setSearch('')
    setBusinessId('')
    setBusinessType('')
    setTag('')
    setMinScore(0)
    setPage(1)
  }

  const deleteRecipient = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/all-recipients/${id}`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
      const json = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(json.error || json.message || `HTTP ${r.status}`)
      toast.success('הלקוח נמחק')
      if (selectedRecipient?.id === id) setSelectedRecipient(null)
      refetch()
    } catch (e) {
      toast.error(e.message || 'שגיאה במחיקה')
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 26, color: '#fff', marginBottom: 4 }}>לקוחות</h1>
          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>Super CRM — כל לקוחות המערכת</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--v2-gray-400)', fontSize: 13 }}>
            <Users2 size={16} /> {total} בסה״כ
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>חיפוש (שם/טלפון/מייל)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Search size={16} style={{ color: 'var(--v2-gray-400)' }} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="למשל: דניאל / 05... / mail@..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ flex: '0 0 220px', minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>עסק ספציפי</label>
            <select
              value={businessId}
              onChange={(e) => {
                setBusinessId(e.target.value)
                setPage(1)
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', fontSize: 13 }}
            >
              <option value="">הכל</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 0 220px', minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>סוג עסק</label>
            <select
              value={businessType}
              onChange={(e) => {
                setBusinessType(e.target.value)
                setPage(1)
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', fontSize: 13 }}
            >
              <option value="">הכל</option>
              {businessTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 0 220px', minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>תגית</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tag size={16} style={{ color: 'var(--v2-gray-400)' }} />
              <input
                value={tag}
                onChange={(e) => {
                  setTag(e.target.value)
                  setPage(1)
                }}
                placeholder="למשל: VIP / קנה_מwebview"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ flex: '0 0 300px', minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 6 }}>
              engagement score מינימלי: <span style={{ color: '#fff', fontWeight: 800 }}>{minScore}</span>
            </label>
            <input
              type="range"
              min={0}
              max={120}
              step={1}
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value))
                setPage(1)
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <button
              type="button"
              onClick={resetFilters}
              className="btn-ghost"
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: 'var(--v2-gray-300)',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <RefreshCw size={16} /> אפס פילטרים
            </button>
          </div>
        </div>
      </div>

      {/* Range + pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>
          מציג <span style={{ color: '#fff', fontWeight: 900 }}>{rangeStart}-{rangeEnd}</span> מתוך <span style={{ color: '#fff', fontWeight: 900 }}>{total}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: page <= 1 ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--v2-gray-300)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 800 }}
          >
            הקודם
          </button>
          <span style={{ fontSize: 13, color: 'var(--v2-gray-400)', fontWeight: 800 }}>
            {page}
          </span>
          <button
            type="button"
            disabled={rangeEnd >= total}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: rangeEnd >= total ? 'rgba(255,255,255,0.04)' : 'transparent', color: 'var(--v2-gray-300)', cursor: rangeEnd >= total ? 'not-allowed' : 'pointer', fontWeight: 800 }}
          >
            הבא
          </button>
        </div>
      </div>

      {/* Table */}
      {recipientsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : recipients.length === 0 ? (
        <div style={{ background: 'var(--v2-dark-2)', border: '1px dashed var(--glass-border)', borderRadius: 12, padding: 26, color: 'var(--v2-gray-400)', textAlign: 'center' }}>
          אין לקוחות שעומדים בתנאים
        </div>
      ) : (
        <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 220 }}>לקוח</th>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 220 }}>עסקים</th>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 220 }}>תגיות</th>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 150 }}>Engagement</th>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 90 }}>WA</th>
                  <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 600, fontSize: 13, minWidth: 130 }}>הצטרפות</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => {
                  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.wa_display_name || '—'
                  const score = r.engagement_score || 0
                  const badge = engagementBadgeColor(score)

                  const businesses = Array.isArray(r.businesses) ? r.businesses.filter(Boolean) : []
                  const tags = Array.isArray(r.all_tags) ? r.all_tags.filter(Boolean) : []

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecipient(r)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    >
                      <td style={{ padding: 12, color: '#fff', fontSize: 13 }}>
                        <div style={{ fontWeight: 900, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 2 }} dir="ltr">
                          {r.phone || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.email || '—'}
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {businesses.length ? (
                            businesses.map((b) => (
                              <span
                                key={b}
                                style={{
                                  fontSize: 11,
                                  padding: '3px 10px',
                                  borderRadius: 9999,
                                  background: 'rgba(59,130,246,0.12)',
                                  color: 'rgb(147,197,253)',
                                  border: '1px solid rgba(59,130,246,0.25)',
                                  marginRight: 6,
                                  marginBottom: 6,
                                }}
                              >
                                {b}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>—</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {tags.length ? (
                            tags.map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: 11,
                                  padding: '3px 10px',
                                  borderRadius: 9999,
                                  background: 'rgba(0,195,122,0.12)',
                                  color: 'var(--v2-primary)',
                                  border: '1px solid rgba(0,195,122,0.25)',
                                  marginRight: 6,
                                  marginBottom: 6,
                                }}
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>—</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        <span style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.fg, padding: '6px 12px', borderRadius: 999, display: 'inline-flex', fontWeight: 900, fontSize: 13 }}>
                          {Number(score).toLocaleString('he-IL')}
                        </span>
                      </td>

                      <td style={{ padding: 12, color: r.wa_first_seen ? 'var(--v2-primary)' : 'var(--v2-gray-400)', fontWeight: 900 }}>
                        {r.wa_first_seen ? '✅' : '—'}
                      </td>

                      <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>
                        {formatDate(r.created_at)}
                      </td>

                      <td style={{ padding: 8, textAlign: 'left' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isAxessAdmin) {
                              toast.error('נדרשת הרשאת Admin')
                              return
                            }
                            const ok = window.confirm(`למחוק את הלקוח "${name}"?`)
                            if (!ok) return
                            deleteRecipient(r.id)
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                          title="מחק"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminRecipientDrawer
        open={!!selectedRecipient}
        recipient={selectedRecipient}
        onClose={() => setSelectedRecipient(null)}
        onDelete={async (id) => deleteRecipient(id)}
      />
    </div>
  )
}

