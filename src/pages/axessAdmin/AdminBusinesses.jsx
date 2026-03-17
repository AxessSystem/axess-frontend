import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, MoreVertical, Eye, Edit, BarChart2, AlertTriangle, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

export default function AdminBusinesses() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

  const { data: businesses = [], refetch } = useQuery({
    queryKey: ['axess-admin-businesses', search, type, status, session?.access_token],
    queryFn: () => {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (type) q.set('type', type)
      if (status) q.set('status', status)
      return fetch(`${API_BASE}/api/axess-admin/businesses?${q}`, { headers }).then(r => {
        if (!r.ok) throw new Error('Unauthorized')
        return r.json()
      })
    },
    enabled: !!session?.access_token,
  })

  const handleImpersonate = (biz) => {
    if (!confirm(`להיכנס כ-${biz.name}?`)) return
    try {
      sessionStorage.setItem('axess_impersonate', biz.id)
      sessionStorage.setItem('axess_impersonate_name', biz.name || '')
      window.open('/dashboard', '_blank')
      toast.success(`מצב Impersonation — ${biz.name}`)
    } catch (e) {
      console.error('impersonate error', e)
      toast.error(e.message || 'שגיאה')
    }
  }

  return (
    <div dir="rtl" style={{ maxWidth: 1000 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 24 }}>ניהול עסקים</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--v2-gray-400)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם/טלפון"
            style={{
              width: '100%',
              padding: '10px 40px 10px 12px',
              background: 'var(--v2-dark-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
            }}
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ padding: '10px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        >
          <option value="">סוג עסק</option>
          <option value="club">מועדון</option>
          <option value="restaurant">מסעדה</option>
          <option value="municipal">רשות</option>
          <option value="general">כללי</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ padding: '10px 12px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        >
          <option value="">סטטוס</option>
          <option value="active">פעיל</option>
          <option value="trial">ניסיון</option>
          <option value="suspended">מושעה</option>
        </select>
      </div>

      <div style={{ background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>שם</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>סוג</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>תוכנית</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>חברים</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>אירועים</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>נרשם</th>
              <th style={{ textAlign: 'right', padding: 12, color: 'var(--v2-gray-400)', fontWeight: 500, fontSize: 13 }}>סטטוס</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {businesses.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: 12, color: '#fff', fontSize: 14 }}>{b.name || '—'}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ background: 'var(--v2-dark-3)', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: 'var(--v2-gray-400)' }}>{b.business_type || '—'}</span>
                </td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>—</td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.member_count ?? 0}</td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.event_count ?? 0}</td>
                <td style={{ padding: 12, color: 'var(--v2-gray-400)', fontSize: 13 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString('he-IL') : '—'}</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    background: b.status === 'active' ? 'rgba(0,195,122,0.2)' : b.status === 'suspended' ? 'rgba(220,38,38,0.2)' : 'var(--v2-dark-3)',
                    color: b.status === 'active' ? 'var(--v2-primary)' : b.status === 'suspended' ? '#ef4444' : 'var(--v2-gray-400)',
                  }}>
                    {b.status || '—'}
                  </span>
                </td>
                <td style={{ padding: 8, position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === b.id ? null : b.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen === b.id && (
                    <div style={{
                      position: 'absolute',
                      left: 8,
                      top: '100%',
                      background: 'var(--v2-dark-3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      padding: 4,
                      zIndex: 10,
                      minWidth: 160,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      <button onClick={() => { handleImpersonate(b); setMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                        <Eye size={14} /> כנס כ-{b.name}
                      </button>
                      <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                        <Edit size={14} /> ערוך פרטים
                      </button>
                      <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                        <BarChart2 size={14} /> סטטיסטיקות
                      </button>
                      <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                        <AlertTriangle size={14} /> השעה
                      </button>
                      <button onClick={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, borderRadius: 6 }}>
                        <Trash2 size={14} /> מחק
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
