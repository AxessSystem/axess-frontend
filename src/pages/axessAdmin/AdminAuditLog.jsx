import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function AdminAuditLog() {
  const { session } = useAuth()
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: logs = [] } = useQuery({
    queryKey: ['axess-admin-audit-log', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/axess-admin/audit-log`, { headers }).then(r => {
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    }),
    enabled: !!session?.access_token,
  })

  return (
    <div dir="rtl" style={{ maxWidth: 900 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 24 }}>Audit Log</h1>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>תאריך</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>אדמין</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>פעולה</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>עסק</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>פרטים</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{row.created_at ? new Date(row.created_at).toLocaleString('he-IL') : '—'}</td>
                <td style={{ padding: 12, color: '#fff', fontSize: 13 }}>{row.admin_user_id ? String(row.admin_user_id).slice(0, 8) + '…' : '—'}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ background: 'var(--v2-dark-3)', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>{row.action || '—'}</span>
                </td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{row.target_business_id ? String(row.target_business_id).slice(0, 8) + '…' : '—'}</td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 12 }}>{row.details && typeof row.details === 'object' ? JSON.stringify(row.details) : row.details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
