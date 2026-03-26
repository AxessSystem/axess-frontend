import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const TABS = [
  { id: 'users', label: 'משתמשים' },
  { id: 'audit', label: 'Audit Log' },
]

const STATUS_COLORS = {
  active: {
    bg: 'rgba(22,163,74,0.15)',
    color: '#bbf7d0',
    label: 'Active',
  },
  inactive: {
    bg: 'rgba(239,68,68,0.15)',
    color: '#fecaca',
    label: 'Inactive',
  },
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState('users')
  const [actionFilter, setActionFilter] = useState('')
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : {}

  const usersQuery = useQuery({
    queryKey: ['admin-users', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/users`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Failed to load users')
        return r.json()
      }),
    enabled: !!session?.access_token,
  })

  const auditQuery = useQuery({
    queryKey: ['admin-audit-log', session?.access_token],
    queryFn: () =>
      fetch(`${API_BASE}/api/admin/audit-log`, { headers }).then((r) => {
        if (!r.ok) throw new Error('Failed to load audit log')
        return r.json()
      }),
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to toggle user status')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (e) => {
      alert(e.message || 'שגיאה בשינוי סטטוס משתמש')
    },
  })

  const users = usersQuery.data?.users || []
  const logs = auditQuery.data?.logs || []

  const filteredLogs = useMemo(() => {
    if (!actionFilter) return logs
    return logs.filter((log) => String(log.action || '').toLowerCase() === actionFilter.toLowerCase())
  }, [logs, actionFilter])

  const resetPasswordMutation = useMutation({
    mutationFn: async (user) => {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: user.email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link')
      }
      return data
    },
    onSuccess: () => {
      alert('קישור reset נשלח למייל המשתמש')
    },
    onError: (e) => {
      alert(e.message || 'שגיאה בשליחת reset password')
    },
  })

  const renderStatusBadge = (isActive) => {
    const key = isActive ? 'active' : 'inactive'
    const cfg = STATUS_COLORS[key]
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 999,
          fontSize: 11,
          background: cfg.bg,
          color: cfg.color,
        }}
      >
        {cfg.label}
      </span>
    )
  }

  const renderAdminBadge = (isAdmin) => {
    if (!isAdmin) return null
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 999,
          fontSize: 11,
          background: 'rgba(59,130,246,0.2)',
          color: '#bfdbfe',
          marginInlineStart: 6,
        }}
      >
        AXESS Admin
      </span>
    )
  }

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleString('he-IL')
    } catch {
      return String(value)
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 12px 24px' }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16 }}>משתמשי מערכת — AXESS</h1>
      <p style={{ color: 'var(--v2-gray-400)', marginBottom: 24, fontSize: 14 }}>
        ניהול משתמשי פלטפורמה (צוות AXESS) ו-Audit Log לפעולות ניהול.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid var(--glass-border)',
              background: tab === t.id ? 'var(--v2-primary)' : 'var(--v2-dark-2)',
              color: tab === t.id ? '#000' : '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: 'var(--v2-gray-300)' }}>כל המשתמשים המערכתיים של AXESS.</div>
              {usersQuery.isLoading && (
                <span style={{ fontSize: 12, color: 'var(--v2-gray-500)' }}>טוען משתמשים…</span>
              )}
            </div>

            <div
              style={{
                overflowX: 'auto',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--v2-dark-3)' }}>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      שם
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      מייל
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      עסק
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      תפקיד
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      סטטוס
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      Admin
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      תאריך הצטרפות
                    </th>
                    <th style={{ width: 120 }} />
                    <th style={{ width: 140, textAlign: 'right', paddingInlineEnd: 10, color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      Reset Password
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && !usersQuery.isLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: '12px 10px',
                          textAlign: 'center',
                          color: 'var(--v2-gray-500)',
                        }}
                      >
                        אין משתמשים להצגה.
                      </td>
                    </tr>
                  )}
                  {users.map((u) => {
                    const isActive = u.is_active !== false
                    const businessLabel = u.business_name ? `${u.business_name}` : '—'
                    const roleLabel = u.business_role || u.role || '—'
                    return (
                      <tr key={u.id} style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                        <td style={{ padding: '8px 10px', color: '#fff' }}>{u.full_name || '—'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>{u.email || '—'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>{businessLabel}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>{roleLabel}</td>
                        <td style={{ padding: '8px 10px' }}>{renderStatusBadge(isActive)}</td>
                        <td style={{ padding: '8px 10px' }}>{renderAdminBadge(u.is_axess_admin)}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-400)' }}>
                          {formatDate(u.created_at)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'left' }}>
                          <button
                            onClick={() => toggleActiveMutation.mutate(u.id)}
                            disabled={toggleActiveMutation.isLoading}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--glass-border)',
                              background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
                              color: '#fff',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {isActive ? 'השבת משתמש' : 'הפעל משתמש'}
                          </button>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'left' }}>
                          <button
                            onClick={() => resetPasswordMutation.mutate(u)}
                            disabled={resetPasswordMutation.isLoading}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--glass-border)',
                              background: 'var(--v2-dark-3)',
                              color: '#fff',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Reset Password
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

        {tab === 'audit' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--v2-gray-300)' }}>
                Audit Log של פעולות אדמין (עד 200 האחרונות).
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  <option value="">כל הפעולות</option>
                  <option value="add_credits">add_credits</option>
                  <option value="toggle_user_active">toggle_user_active</option>
                </select>
                <button
                  onClick={() => auditQuery.refetch()}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--v2-dark-3)',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  רענן
                </button>
              </div>
            </div>

            <div
              style={{
                overflowX: 'auto',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--v2-dark-3)' }}>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      תאריך
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      Admin
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      פעולה
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      סוג
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--v2-gray-300)', fontWeight: 500 }}>
                      פרטים
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 && !auditQuery.isLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '12px 10px',
                          textAlign: 'center',
                          color: 'var(--v2-gray-500)',
                        }}
                      >
                        אין רשומות Audit Log תואמות.
                      </td>
                    </tr>
                  )}
                  {filteredLogs.map((log) => {
                    const adminLabel = log.admin_name || log.admin_email || '—'
                    const metaText =
                      typeof log.metadata === 'object' && log.metadata !== null
                        ? JSON.stringify(log.metadata)
                        : log.metadata || ''
                    return (
                      <tr key={log.id} style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>
                          {formatDate(log.created_at)}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#fff' }}>{adminLabel}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>{log.action}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-300)' }}>{log.target_type}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--v2-gray-400)', maxWidth: 320 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              direction: 'ltr',
                            }}
                            title={metaText}
                          >
                            {metaText || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

