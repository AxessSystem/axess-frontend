import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const typeIcon = {
  error: '❌',
  action: '📋',
  payment: '💳',
  performance: '⚠️',
  success: '✅',
}

const typeColor = {
  error: '#fecaca',
  action: '#bfdbfe',
  payment: '#bbf7d0',
  performance: '#fef08a',
  success: '#bbf7d0',
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

export default function AdminNotices() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : {}

  const { data, refetch } = useQuery({
    queryKey: ['adminNotifications', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/admin/notifications`, { headers }).then(r => r.json()),
    enabled: !!session?.access_token,
  })

  const notifications = data?.notifications || []

  const markAllRead = () =>
    fetch(`${API_BASE}/api/admin/notifications/read-all`, {
      method: 'PATCH',
      headers,
    }).then(() => refetch())

  const handleRowClick = (n) => {
    fetch(`${API_BASE}/api/admin/notifications/${n.id}/read`, {
      method: 'PATCH',
      headers,
    }).then(() => {
      refetch()
      if (n.action_url) {
        navigate(n.action_url)
      }
    })
  }

  return (
    <div dir="rtl" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>התראות אדמין</h1>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            style={{
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: '#fff',
              padding: '8px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            סמן הכל כנקרא
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map((n) => {
          const color = typeColor[n.type] || '#e5e7eb'
          const icon = typeIcon[n.type] || 'ℹ️'
          const isUnread = !n.read_at
          const businessName = n.business_name || n.business?.name || ''

          return (
            <button
              key={n.id}
              onClick={() => handleRowClick(n)}
              style={{
                width: '100%',
                textAlign: 'right',
                background: isUnread ? 'rgba(15,23,42,0.85)' : 'var(--v2-dark-2)',
                border: isUnread ? '1px solid rgba(96,165,250,0.6)' : '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '999px',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      fontWeight: isUnread ? 700 : 500,
                      fontSize: 15,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {n.title}
                  </div>
                  {businessName && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(148,163,184,0.2)',
                        color: 'var(--v2-gray-200)',
                      }}
                    >
                      {businessName}
                    </span>
                  )}
                  {isUnread && (
                    <span
                      style={{
                        marginRight: 'auto',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#22c55e',
                        color: '#022c22',
                        fontWeight: 700,
                      }}
                    >
                      חדש
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--v2-gray-300)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {n.message}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--v2-gray-400)', marginInlineStart: 8 }}>
                {formatRelativeTime(n.created_at || n.inserted_at)}
              </div>
            </button>
          )
        })}

        {notifications.length === 0 && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px dashed var(--glass-border)',
              background: 'rgba(15,23,42,0.6)',
              color: 'var(--v2-gray-300)',
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            אין כרגע התראות במערכת.
          </div>
        )}
      </div>
    </div>
  )
}
