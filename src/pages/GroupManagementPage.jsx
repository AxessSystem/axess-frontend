import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Users, Plus, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

export default function GroupManagementPage() {
  const { code } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!code) return
    fetch(`${API_BASE}/api/groups/${code.toUpperCase()}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('לא נמצא')))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [code])

  const checkinAll = async () => {
    if (!data?.event_slug) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/events/${data.event_slug}/groups/${code}/checkin-all`, { method: 'POST' })
      if (!res.ok) throw new Error('שגיאה')
      setData(prev => ({
        ...prev,
        participants: (prev?.participants || []).map(p => ({ ...p, attendance_status: 'arrived', arrived_at: new Date().toISOString() })),
      }))
      toast.success('כולם סומנו כהגיעו')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} style={{ color: 'var(--v2-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }
  if (!data) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <h1>הקבוצה לא נמצאה</h1>
        <Link to="/" style={{ marginTop: 16, color: 'var(--v2-primary)' }}>חזרה לדף הבית</Link>
      </div>
    )
  }

  const eventDate = data.date || data.doors_open
  const arrivedCount = (data.participants || []).filter(p => p.attendance_status === 'arrived').length

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{data.group_name}</h1>
        <div style={{ color: 'var(--v2-gray-400)', marginBottom: 8 }}>{data.event_title}</div>
        {eventDate && <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>{new Date(eventDate).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--v2-primary)' }}>קוד: {data.group_code}</div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => toast('פיצ׳ר ייפתח בקרוב')}
          >
            <Plus size={18} /> הוסף משתתף
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => toast('פיצ׳ר ייפתח בקרוב')}
          >
            <Send size={18} /> שלח תזכורת לכולם
          </button>
          <button
            onClick={checkinAll}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 12, cursor: actionLoading ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            <CheckCircle size={18} /> סמן כולם הגיעו
          </button>
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>משתתפים ({arrivedCount} הגיעו / {data.participants?.length || 0} סה״כ)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data.participants || []).map((p, i) => (
            <div
              key={p.id || i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: 'var(--v2-dark-3)',
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>{p.name || `משתתף ${i + 1}`}</span>
                {p.phone && <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}> — {p.phone}</span>}
                {p.parent_phone && <span style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>הורה: {p.parent_phone}</span>}
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: p.attendance_status === 'arrived' ? 'rgba(34,197,94,0.2)' : 'var(--v2-dark-2)',
                  color: p.attendance_status === 'arrived' ? '#22c55e' : 'var(--v2-gray-400)',
                }}
              >
                {p.attendance_status === 'arrived' ? 'הגיע' : 'נרשם'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
