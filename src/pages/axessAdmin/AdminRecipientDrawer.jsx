import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, X, Clock, MapPin } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

function initialsFromName(firstName, lastName) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('he-IL')
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 60) return 'לפני רגע'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `לפני ${diffMin} ד׳`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `לפני ${diffH} ש׳`
  const diffD = Math.round(diffH / 24)
  return `לפני ${diffD} ימים`
}

function engagementBadgeColor(score) {
  const s = Number(score || 0)
  if (s >= 80) return { bg: 'rgba(16,185,129,0.16)', border: 'rgba(16,185,129,0.35)', fg: 'rgb(16,185,129)' }
  if (s >= 45) return { bg: 'rgba(59,130,246,0.16)', border: 'rgba(59,130,246,0.35)', fg: 'rgb(59,130,246)' }
  if (s > 0) return { bg: 'rgba(245,158,11,0.16)', border: 'rgba(245,158,11,0.35)', fg: 'rgb(245,158,11)' }
  return { bg: 'var(--v2-dark-3)', border: 'var(--glass-border)', fg: 'var(--v2-gray-400)' }
}

function extractAttribution(profile) {
  // We don't have a dedicated attribution endpoint for platform admin here,
  // so we try to surface relevant fields that may exist in mr.custom_data.
  const c = profile?.custom_data || {}
  const candidates = {
    first_touch_source: c.first_touch_source,
    first_touch_medium: c.first_touch_medium,
    first_touch_campaign: c.first_touch_campaign,
    last_touch_source: c.last_touch_source,
    last_touch_medium: c.last_touch_medium,
    last_touch_campaign: c.last_touch_campaign,
    utm_source: c.utm_source,
    utm_medium: c.utm_medium,
    utm_campaign: c.utm_campaign,
  }

  return Object.entries(candidates)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => ({ key: k, value: v }))
}

const EVENT_LABELS = {
  sms_sent: '📱 SMS נשלח',
  sms_delivered: '✅ SMS נמסר',
  link_clicked: '🔗 לחץ על לינק',
  validator_redeemed: '🎟️ מימש ולידטור',
  sms_replied: '💬 הגיב ל-SMS',
  checkin: '📍 צ׳ק-אין',
}

export default function AdminRecipientDrawer({ open, onClose, recipient, onDelete }) {
  const { session, isAxessAdmin } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])

  const headers = useMemo(() => {
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }, [session?.access_token])

  const recipientId = recipient?.id

  useEffect(() => {
    if (!open || !recipientId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setProfile(null)
    setOrders([])

    const load = async () => {
      try {
        const profileRes = await fetch(`${API_BASE}/api/admin/customer-profile/${recipientId}`, { headers })
        const profileJson = await profileRes.json().catch(() => ({}))
        if (!profileRes.ok) throw new Error(profileJson.message || profileJson.error || 'Failed to load profile')
        if (!cancelled) setProfile(profileJson)

        const ordersRes = await fetch(`${API_BASE}/api/admin/webview/orders`, { headers })
        const ordersJson = await ordersRes.json().catch(() => ({}))
        if (!ordersRes.ok) throw new Error(ordersJson.message || ordersJson.error || 'Failed to load orders')
        const filtered = (ordersJson?.orders || []).filter((o) => String(o.master_recipient_id) === String(recipientId))
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        if (!cancelled) setOrders(filtered.slice(0, 15))
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, recipientId, headers])

  const fullName = [recipient?.first_name, recipient?.last_name].filter(Boolean).join(' ') || '—'
  const score = recipient?.engagement_score ?? profile?.counters?.engagement_score ?? 0
  const badge = engagementBadgeColor(score)
  const attrList = extractAttribution(profile)
  const attributionSubtitle = profile?.counters?.last_active ? `פעילות אחרונה: ${formatDate(profile.counters.last_active)}` : null

  const timeline = profile?.timeline || []

  const smsHistory = timeline.filter((t) => {
    const type = t?.event_type || t?.type || ''
    return String(type).startsWith('sms')
  })

  const engagementHistory = timeline

  const businessChips = recipient?.businesses || []
  const allTags = recipient?.all_tags || []

  const waSeen = !!recipient?.wa_first_seen

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'stretch',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(460px, 100vw)',
            background: 'var(--v2-dark-2)',
            borderRight: '1px solid var(--glass-border)',
            overflowY: 'auto',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, color: '#ffffff' }}>כרטיס לקוח</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {loading && <div style={{ textAlign: 'center', color: 'var(--v2-gray-400)', padding: 40 }}>טוען...</div>}
            {error && <div style={{ textAlign: 'center', color: '#EF4444', padding: 40 }}>{error}</div>}

            {!loading && !error && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(0,195,122,0.15)',
                      border: '1px solid rgba(0,195,122,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--v2-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {initialsFromName(recipient?.first_name, recipient?.last_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{fullName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--v2-gray-400)', marginBottom: 4 }}>
                      <Phone size={14} /> <span dir="ltr">{recipient?.phone || '—'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', wordBreak: 'break-all' }}>
                      {recipient?.email ? `✉️ ${recipient.email}` : '✉️ —'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.fg,
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        <Clock size={14} />
                        Engagement: {Number(score || 0).toLocaleString('he-IL')}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: waSeen ? 'var(--v2-primary)' : 'var(--v2-gray-400)' }}>
                        {waSeen ? '✅ WA: נצפה' : '— WA'}
                      </span>
                      {recipient?.wa_display_name && (
                        <span style={{ fontSize: 12, color: 'var(--v2-gray-300)' }}>WA שם: {recipient.wa_display_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Businesses + tags */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>עסקים ותגיות</div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>עסקים</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {businessChips.length ? (
                        businessChips.map((b) => (
                          <span
                            key={b}
                            style={{
                              fontSize: 11,
                              padding: '3px 10px',
                              borderRadius: 9999,
                              background: 'rgba(59,130,246,0.12)',
                              color: 'rgb(147,197,253)',
                              border: '1px solid rgba(59,130,246,0.25)',
                            }}
                          >
                            {b}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין עסקים</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>תגיות (מכל עסק)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {allTags.length ? (
                        allTags.map((t) => (
                          <span
                            key={`${t}`}
                            style={{
                              fontSize: 11,
                              padding: '3px 10px',
                              borderRadius: 9999,
                              background: 'rgba(0,195,122,0.12)',
                              color: 'var(--v2-primary)',
                              border: '1px solid rgba(0,195,122,0.25)',
                            }}
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין תגיות</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)' }}>היסטוריית הזמנות</div>
                  </div>
                  {orders.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 210, overflowY: 'auto' }}>
                      {orders.map((o) => (
                        <div
                          key={o.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {o.order_type || 'order'} · {o.business_name || '—'}
                            </div>
                            <span style={{ fontSize: 11, color: o.status === 'paid' ? 'var(--v2-primary)' : 'var(--v2-gray-400)' }}>
                              {o.status || '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                            <span>{o.order_number ? `#${o.order_number}` : `#${o.id}`}</span>
                            <span>{o.total_amount != null ? `₪${Number(o.total_amount).toFixed(2)}` : ''}</span>
                            <span>{formatDate(o.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין הזמנות</div>
                  )}
                </div>

                {/* Engagement / SMS timeline */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>היסטוריה</div>

                  {engagementHistory.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 210, overflowY: 'auto' }}>
                      {engagementHistory.slice(0, 20).map((item, i) => (
                        <div key={`${item.created_at || i}-${i}`} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i === engagementHistory.length - 1 ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              marginTop: 5,
                              flexShrink: 0,
                              background:
                                item.event_type === 'validator_redeemed'
                                  ? 'var(--v2-primary)'
                                  : item.event_type === 'link_clicked'
                                    ? '#3b82f6'
                                    : item.event_type === 'checkin'
                                      ? '#10b981'
                                      : item.event_type?.startsWith('sms')
                                        ? '#0ea5e9'
                                        : '#94a3b8',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                              {EVENT_LABELS[item.event_type] || item.event_type || '—'}
                            </div>
                            {item.note && <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{item.note}</div>}
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-500)' }}>{formatRelativeTime(item.created_at || item.date)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין היסטוריה</div>
                  )}
                </div>

                {/* SMS History */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>
                    היסטוריית SMS
                  </div>
                  {smsHistory.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 170, overflowY: 'auto' }}>
                      {smsHistory.slice(0, 12).map((item, i) => (
                        <div key={`${item.created_at || i}-${i}`} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              marginTop: 5,
                              flexShrink: 0,
                              background: 'var(--v2-primary)',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                              {EVENT_LABELS[item.event_type] || item.event_type || 'SMS'}
                            </div>
                            {item.note && <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>{item.note}</div>}
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-500)' }}>
                              {formatRelativeTime(item.created_at || item.date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין נתוני SMS</div>
                  )}
                </div>

                {/* Attribution */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <MapPin size={16} style={{ color: 'var(--v2-primary)' }} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)' }}>מאיפה הגיע</div>
                  </div>

                  {attrList.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {attrList.map((a) => (
                        <div key={a.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>{a.key}</div>
                          <div style={{ fontSize: 12, color: '#fff', wordBreak: 'break-word', textAlign: 'left' }}>{String(a.value)}</div>
                        </div>
                      ))}
                      {attributionSubtitle && <div style={{ fontSize: 12, color: 'var(--v2-gray-500)', marginTop: 6 }}>{attributionSubtitle}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>אין נתוני attribution זמינים</div>
                  )}
                </div>

                {/* Delete */}
                {isAxessAdmin && (
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                      onClick={async () => {
                        if (!recipientId) return
                        const ok = window.confirm(`למחוק את הלקוח "${fullName}"?`)
                        if (!ok) return
                        try {
                          await onDelete?.(recipientId)
                        } catch (e) {
                          toast.error(e.message || 'שגיאה במחיקה')
                        }
                      }}
                    >
                      מחק לקוח
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

