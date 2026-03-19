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

function formatMoneyILS(v) {
  if (v == null || v === '') return '₪—'
  const num = Number(v)
  if (Number.isNaN(num)) return '₪—'
  return `₪${num.toLocaleString('he-IL')}`
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
  const [attributionRows, setAttributionRows] = useState([])
  const [fullProfile, setFullProfile] = useState(null)

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
    setAttributionRows([])
    setFullProfile(null)

    const load = async () => {
      try {
        const [profileRes, fullRes, ordersRes, attrRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/customer-profile/${recipientId}`, { headers }),
          fetch(`${API_BASE}/api/admin/recipients/${recipientId}/full-profile`, { headers }),
          fetch(`${API_BASE}/api/admin/webview/orders`, { headers }),
          fetch(`${API_BASE}/api/admin/recipients/${recipientId}/attribution`, { headers }),
        ])

        const profileJson = await profileRes.json().catch(() => ({}))
        if (!profileRes.ok) throw new Error(profileJson.message || profileJson.error || 'Failed to load profile')
        if (!cancelled) setProfile(profileJson)

        const fullJson = await fullRes.json().catch(() => ({}))
        if (!cancelled && fullRes.ok) {
          setFullProfile(fullJson)
          setOrders((fullJson?.orders || []).slice(0, 15))
        }

        if (!cancelled && !fullRes.ok) {
          const ordersJson = await ordersRes.json().catch(() => ({}))
          if (ordersRes.ok) {
            const filtered = (ordersJson?.orders || []).filter((o) => String(o.master_recipient_id) === String(recipientId))
            filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            setOrders(filtered.slice(0, 15))
          }
        }

        const attrJson = await attrRes.json().catch(() => ({}))
        if (!cancelled && attrRes.ok) setAttributionRows(attrJson?.attribution || [])
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

                {/* Customer 360 Summary */}
                {fullProfile && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 4 }}>LTV</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-primary)' }}>
                        {formatMoneyILS(fullProfile.ltv?.webview_ltv)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 4 }}>הזמנות</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{fullProfile.ltv?.webview_orders_count ?? fullProfile.orders?.length ?? 0}</div>
                    </div>
                    <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 4 }}>ביקורים</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{fullProfile.sessions?.length ?? 0}</div>
                    </div>
                    <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 4 }}>SMS</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{fullProfile.sms?.length ?? 0}</div>
                    </div>
                  </div>
                )}

                {/* Event history */}
                {fullProfile?.events?.length > 0 && (
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>היסטוריית אירועים</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                      {fullProfile.events.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{ev.event_title || 'אירוע'}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--v2-gray-400)' }}>
                            <span>{formatDate(ev.event_date)}</span>
                            <span>{ev.status || '—'}</span>
                            {ev.total_amount != null && <span>{formatMoneyILS(ev.total_amount)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Webview activity: sessions */}
                {fullProfile?.sessions?.length > 0 && (
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>פעילות Webview — ביקורים</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                      {fullProfile.sessions.slice(0, 15).map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.business_name || '—'}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                            <span>{formatDate(s.created_at)}</span>
                            {s.utm_source && <span>מקור: {s.utm_source}</span>}
                            {s.event_type && <span>פעולה: {s.event_type}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* SMS history from API (campaigns) */}
                {fullProfile?.sms?.length > 0 && (
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>SMS — קמפיינים</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                      {fullProfile.sms.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.campaign_name || 'קמפיין'}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--v2-gray-400)' }}>
                            <span>{formatDate(s.created_at)}</span>
                            <span>סטטוס: {s.status || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical data (business_data) */}
                {fullProfile?.bizData?.length > 0 && (
                  <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)', marginBottom: 10 }}>נתונים היסטוריים (ייבוא CSV)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 240, overflowY: 'auto' }}>
                      {fullProfile.bizData.map((br, idx) => (
                        <div
                          key={`${br.business_name}-${idx}`}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{br.business_name || 'עסק'}</div>
                          {br.business_type && <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginBottom: 6 }}>סוג: {br.business_type}</div>}
                          {Array.isArray(br.tags) && br.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              {br.tags.map((t) => (
                                <span key={`${t}`} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, background: 'rgba(0,195,122,0.15)', color: 'var(--v2-primary)' }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {br.business_data && typeof br.business_data === 'object' && Object.keys(br.business_data).length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>
                              {Object.entries(br.business_data).map(([k, v]) => (
                                <div key={k} style={{ marginBottom: 2 }}><span style={{ color: 'var(--v2-gray-500)' }}>{k}:</span> {String(v)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attribution */}
                <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <MapPin size={16} style={{ color: 'var(--v2-primary)' }} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-gray-400)' }}>מאיפה הגיע</div>
                  </div>

                  {attributionRows.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {attributionRows.map((a, idx) => (
                        <div
                          key={`${a.business_id || 'x'}-${idx}`}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          {a.business_name && (
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                              {a.business_name}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>
                              first_touch_source: <span style={{ color: '#fff' }}>{a.first_touch_source || '—'}</span> · {formatDate(a.first_touch_at)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>
                              last_touch_source: <span style={{ color: '#fff' }}>{a.last_touch_source || '—'}</span> · {formatDate(a.last_touch_at)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>
                              converted:{' '}
                              <span style={{ color: a.converted ? 'var(--v2-primary)' : '#ef4444', fontWeight: 900 }}>
                                {a.converted ? '✅' : '❌'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>
                              conversion_value:{' '}
                              <span style={{ color: '#fff', fontWeight: 800 }}>{formatMoneyILS(a.conversion_value)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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

