import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, AlertTriangle, CheckCircle2, ClipboardList, CircleHelp, CreditCard, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const typeIcon = {
  error: XCircle,
  action: ClipboardList,
  payment: CreditCard,
  performance: AlertTriangle,
  success: CheckCircle2,
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

export default function AdminAlertsPage() {
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
  const IconFallback = CircleHelp

  const markAllRead = async () => {
    await fetch(`${API_BASE}/api/admin/notifications/read-all`, {
      method: 'PATCH',
      headers,
    })
    refetch()
  }

  const handleRowClick = async (n) => {
    await fetch(`${API_BASE}/api/admin/notifications/${n.id}/read`, {
      method: 'PATCH',
      headers,
    })
    refetch()
    if (n.action_url) navigate(n.action_url)
  }

  return (
    <div dir="rtl" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>התראות</h1>
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
          const isUnread = !n.read_at
          const businessName = n.business_name || n.business?.name || ''
          const color = typeColor[n.type] || '#e5e7eb'
          const Icon = typeIcon[n.type] || IconFallback

          return (
            <button
              type="button"
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
                  borderRadius: 999,
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="#0b1220" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      fontWeight: isUnread ? 800 : 600,
                      fontSize: 15,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      flex: 1,
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
                        flexShrink: 0,
                      }}
                    >
                      {businessName}
                    </span>
                  )}

                  {isUnread && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#22c55e',
                        color: '#022c22',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      חדש
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--v2-gray-300)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatRelativeTime(n.created_at || n.inserted_at)}
                  </div>
                </div>
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

