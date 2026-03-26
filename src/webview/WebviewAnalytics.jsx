import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'

const cardStyle = {
  background: 'var(--v2-dark-3)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
}
const sectionH2 = {
  fontFamily: "'Bricolage Grotesque','Outfit',sans-serif",
  fontWeight: 700,
  fontSize: 17,
  color: '#ffffff',
  marginBottom: 16,
}

export default function WebviewAnalyticsTab({ businessId, authHeaders }) {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

  useEffect(() => {
    if (!businessId || !authHeaders) return
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/w/analytics-by-business`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error('שגיאה בטעינה')
        return r.json()
      })
      .then((data) => setStats(data.stats || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [businessId, authHeaders])

  if (loading) {
    return (
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--v2-gray-400)' }}>
        <BarChart3 size={24} />
        <span>טוען אנליטיקס…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, color: '#fecaca' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={sectionH2}>
        <BarChart3 size={20} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
        Analytics Webview
      </h2>
      <p style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginBottom: 8 }}>
        ביצועי מקורות התעבורה לפי UTM
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>מקור</th>
              <th style={{ textAlign: 'right', padding: 12 }}>ביקורים</th>
              <th style={{ textAlign: 'right', padding: 12 }}>המרות</th>
              <th style={{ textAlign: 'right', padding: 12 }}>הכנסה</th>
              <th style={{ textAlign: 'right', padding: 12 }}>המרה%</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--v2-gray-400)' }}>
                  אין עדיין נתונים
                </td>
              </tr>
            ) : (
              stats.map((row, idx) => {
                const convPct =
                  (row.sessions || 0) > 0
                    ? Math.round(((row.conversions || 0) / row.sessions) * 100)
                    : 0
                const sourceLabel = [row.utm_source, row.utm_medium, row.utm_campaign]
                  .filter(Boolean)
                  .join(' / ')
                  .replace(/\(ללא\)/g, '—') || '—'
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--glass-border)',
                    }}
                  >
                    <td style={{ padding: 12 }}>{sourceLabel}</td>
                    <td style={{ padding: 12 }}>{row.sessions || 0}</td>
                    <td style={{ padding: 12 }}>{row.conversions || 0}</td>
                    <td style={{ padding: 12 }}>
                      ₪{Number(row.revenue || 0).toLocaleString('he-IL')}
                    </td>
                    <td style={{ padding: 12 }}>{convPct}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
