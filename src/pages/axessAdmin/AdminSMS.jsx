import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function AdminSMS() {
  const { session } = useAuth()
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data } = useQuery({
    queryKey: ['axess-admin-sms-stats', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/axess-admin/sms-stats`, { headers }).then(r => {
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    }),
    enabled: !!session?.access_token,
  })

  const byDay = data?.by_day || []
  const topBiz = data?.top_businesses || []
  const errors = data?.errors_7d ?? 0

  return (
    <div dir="rtl" style={{ maxWidth: 900 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 24 }}>ניהול SMS</h1>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>שליחות לפי יום</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <XAxis dataKey="day" stroke="var(--v2-gray-400)" fontSize={11} />
              <YAxis stroke="var(--v2-gray-400)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
              <Bar dataKey="sent" fill="var(--v2-primary)" radius={[4, 4, 0, 0]} name="נשלחו" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>Top 10 עסקים לפי שימוש</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 10, color: 'var(--v2-gray-400)', fontWeight: 500 }}>שם</th>
              <th style={{ textAlign: 'right', padding: 10, color: 'var(--v2-gray-400)', fontWeight: 500 }}>נשלחו</th>
            </tr>
          </thead>
          <tbody>
            {topBiz.map((b, i) => (
              <tr key={b.id || i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: 10, color: '#fff' }}>{b.name || '—'}</td>
                <td style={{ padding: 10, color: 'var(--v2-gray-400)' }}>{b.total?.toLocaleString?.() ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>שגיאות 7 ימים אחרונים</h3>
        <p style={{ fontSize: 24, fontWeight: 800, color: errors > 0 ? '#ef4444' : 'var(--v2-primary)' }}>{errors}</p>
      </div>
    </div>
  )
}
