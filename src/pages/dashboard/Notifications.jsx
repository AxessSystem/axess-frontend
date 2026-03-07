import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, Calendar, CheckCircle, Wallet, Bell,
  CheckCheck, Filter, Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

const TYPE_ICONS = {
  sms_incoming: MessageSquare,
  pending_approval: Calendar,
  vip_booking: CheckCircle,
  low_balance: Wallet,
}

function useAuthHeaders() {
  const { session, businessId } = useAuth()
  return useCallback(() => {
    const h = { 'Content-Type': 'application/json', 'X-Business-Id': businessId || '' }
    if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`
    return h
  }, [session?.access_token, businessId])
}

function groupByDate(items) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups = { today: [], yesterday: [], older: [] }
  for (const item of items) {
    const d = new Date(item.created_at).toDateString()
    if (d === today) groups.today.push(item)
    else if (d === yesterday) groups.yesterday.push(item)
    else groups.older.push(item)
  }
  return groups
}

function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'עכשיו'
  if (diff < 3600000) return `לפני ${Math.floor(diff / 60000)} דק׳`
  if (diff < 86400000) return `לפני ${Math.floor(diff / 3600000)} שעות`
  if (diff < 604800000) return `לפני ${Math.floor(diff / 86400000)} ימים`
  return d.toLocaleDateString('he-IL')
}

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread | urgent
  const [markingAll, setMarkingAll] = useState(false)
  const { session, businessId } = useAuth()
  const navigate = useNavigate()
  const headers = useAuthHeaders()

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token || !businessId) return
    const r = await fetch(`${API_BASE}/api/notifications`, {
      headers: headers(),
    })
    const data = await r.json().catch(() => [])
    setItems(Array.isArray(data) ? data : [])
  }, [session?.access_token, businessId, headers])

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  const handleMarkRead = async (id) => {
    await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: headers(),
    })
    setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const handleReadAll = async () => {
    setMarkingAll(true)
    await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: headers(),
    })
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  const handleClick = (n) => {
    if (!n.is_read) handleMarkRead(n.id)
    const url = n.action_url || '/dashboard'
    if (url.startsWith('http')) window.location.href = url
    else navigate(url)
  }

  let filtered = items
  if (filter === 'unread') filtered = items.filter(n => !n.is_read)
  if (filter === 'urgent') filtered = items.filter(n => n.priority === 'urgent')

  const groups = groupByDate(filtered)

  return (
    <div dir="rtl" className="notifications-page" style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 767px) {
          .notifications-page .notif-header {
            flex-direction: column;
            align-items: flex-end;
            gap: 12px;
          }
          .notifications-page .notif-header-row2 {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            justify-content: space-between;
          }
          .notifications-page .notif-mark-all {
            padding: 4px 8px !important;
            font-size: 12px !important;
            background: transparent !important;
            border: none !important;
            color: var(--v2-gray-500) !important;
          }
        }
      `}</style>
      <div className="notif-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
          התראות
        </h1>
        <div className="notif-header-row2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--v2-dark-2)', borderRadius: 8, padding: 2 }}>
            {['all', 'unread', 'urgent'].map(k => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: '6px 12px',
                  fontSize: 13,
                  background: filter === k ? 'var(--v2-primary)' : 'transparent',
                  color: filter === k ? 'var(--v2-dark)' : 'var(--v2-gray-400)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {k === 'all' ? 'הכל' : k === 'unread' ? 'לא נקרא' : 'דחוף'}
              </button>
            ))}
          </div>
          <button
            className="notif-mark-all"
            onClick={handleReadAll}
            disabled={markingAll || !items.some(n => !n.is_read)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: 'var(--v2-gray-400)',
              fontSize: 13,
              cursor: markingAll ? 'not-allowed' : 'pointer',
            }}
          >
            {markingAll ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCheck size={14} />}
            סמן הכל כנקרא
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={32} style={{ color: 'var(--v2-primary)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--v2-dark-2)',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          color: 'var(--v2-gray-400)',
        }}>
          <Bell size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <div>אין התראות</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.today.length > 0 && (
            <section>
              <h3 style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>היום</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {groups.today.map(n => (
                  <NotificationRow key={n.id} n={n} onClick={() => handleClick(n)} />
                ))}
              </div>
            </section>
          )}
          {groups.yesterday.length > 0 && (
            <section>
              <h3 style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>אתמול</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {groups.yesterday.map(n => (
                  <NotificationRow key={n.id} n={n} onClick={() => handleClick(n)} />
                ))}
              </div>
            </section>
          )}
          {groups.older.length > 0 && (
            <section>
              <h3 style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 8 }}>קודם</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {groups.older.map(n => (
                  <NotificationRow key={n.id} n={n} onClick={() => handleClick(n)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationRow({ n, onClick }) {
  const Icon = TYPE_ICONS[n.type] || Bell
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        background: 'var(--v2-dark-2)',
        border: '1px solid var(--glass-border)',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'right',
        width: '100%',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--v2-dark-2)')}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: n.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : 'rgba(0,195,122,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: n.priority === 'urgent' ? '#ef4444' : 'var(--v2-primary)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{n.title}</span>
          {!n.is_read && (
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#3B82F6',
              flexShrink: 0,
            }} />
          )}
        </div>
        {n.body && (
          <div style={{ fontSize: 13, color: 'var(--v2-gray-400)', lineHeight: 1.4 }}>{n.body}</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--v2-gray-500)', marginTop: 4 }}>
          {formatRelative(n.created_at)}
        </div>
      </div>
    </button>
  )
}
