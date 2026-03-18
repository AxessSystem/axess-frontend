import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

const TABS = [
  { id: 'pages', label: 'דפים פעילים', endpoint: '/api/admin/webview/pages' },
  { id: 'orders', label: 'הזמנות', endpoint: '/api/admin/webview/orders' },
  { id: 'analytics', label: 'Analytics', endpoint: '/api/admin/webview/analytics' },
]

function DataTable({ data, loading, error }) {
  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--v2-gray-300)', fontSize: 14 }}>
        טוען נתונים...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.4)',
          color: '#fecaca',
          fontSize: 14,
        }}
      >
        שגיאה בטעינת הנתונים. נסה שוב מאוחר יותר.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--v2-gray-400)', fontSize: 14 }}>
        אין נתונים להצגה.
      </div>
    )
  }

  const rows = Array.isArray(data) ? data : []
  const firstRow = rows[0] || {}
  const columns = Object.keys(firstRow)

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        background: 'var(--v2-dark-2)',
        overflow: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, direction: 'rtl' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
            {columns.map(col => (
              <th
                key={col}
                style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  borderBottom: '1px solid var(--glass-border)',
                  color: 'var(--v2-gray-300)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
              {columns.map(col => (
                <td
                  key={col}
                  style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: 'var(--v2-gray-200)',
                    maxWidth: 260,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                  title={row[col] != null ? String(row[col]) : ''}
                >
                  {row[col] != null ? String(row[col]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminWebviewPage() {
  const [activeTab, setActiveTab] = useState('pages')
  const [state, setState] = useState({
    pages: { data: [], loading: false, error: null },
    orders: { data: [], loading: false, error: null },
    analytics: { data: [], loading: false, error: null },
  })

  useEffect(() => {
    // Load initial tab on mount
    fetchTabData('pages')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function fetchTabData(tabId) {
    const tab = TABS.find(t => t.id === tabId)
    if (!tab) return

    // Avoid refetch if we already have data or currently loading
    if (state[tabId]?.loading || (state[tabId]?.data || []).length > 0) {
      return
    }

    setState(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], loading: true, error: null },
    }))

    fetch(`${API_BASE}${tab.endpoint}`, {
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'Request failed')
        }
        return res.json()
      })
      .then(json => {
        const data = Array.isArray(json) ? json : json?.data || []
        setState(prev => ({
          ...prev,
          [tabId]: { data, loading: false, error: null },
        }))
      })
      .catch(err => {
        console.error('Failed to load admin webview data', err)
        setState(prev => ({
          ...prev,
          [tabId]: { ...prev[tabId], loading: false, error: err.message || 'Error' },
        }))
      })
  }

  const current = state[activeTab] || state.pages

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Webview Admin</h1>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--v2-gray-400)' }}>
            ניהול נתוני Webview, הזמנות ו-Analytics.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 4,
          borderRadius: 999,
          background: 'var(--v2-dark-2)',
          border: '1px solid var(--glass-border)',
          width: 'fit-content',
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                fetchTabData(tab.id)
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 13,
                cursor: 'pointer',
                background: isActive ? 'var(--v2-primary)' : 'transparent',
                color: isActive ? '#020817' : 'var(--v2-gray-300)',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.15s ease, color 0.15s ease',
                minWidth: 80,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <DataTable data={current.data} loading={current.loading} error={current.error} />
    </div>
  )
}
