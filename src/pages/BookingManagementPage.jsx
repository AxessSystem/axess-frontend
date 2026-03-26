import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export default function BookingManagementPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [addingGuest, setAddingGuest] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/admin/table-bookings/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(b => setBooking(b))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false))
  }, [id])

  const addGuest = async () => {
    if (!newPhone.trim()) { toast.error('הזן נייד'); return }
    setAddingGuest(true)
    try {
      const res = await fetch(`${API_BASE}/t/slug/${booking.event_slug || 'event'}/book/${id}/add-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone.trim(), name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('האורח נוסף — SMS נשלח')
      setNewPhone(''); setNewName('')
      setBooking(prev => prev ? { ...prev, guests: [...(prev.guests || []), { id: data.guest_id, phone: newPhone, name: newName, payment_status: 'pending' }] } : null)
    } catch (err) { toast.error(err.message || 'שגיאה') }
    finally { setAddingGuest(false) }
  }

  const removeGuest = async (guestId) => {
    if (!confirm('להסיר את האורח?')) return
    try {
      const res = await fetch(`${API_BASE}/t/slug/${booking.event_slug || 'event'}/book/${id}/guests/${guestId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      toast.success('האורח הוסר')
      setBooking(prev => prev ? { ...prev, guests: (prev.guests || []).filter(g => g.id !== guestId) } : null)
    } catch (err) { toast.error(err.message) }
  }

  const paid = (booking?.guests || []).filter(g => g.payment_status === 'paid').reduce((s, g) => s + Number(g.payment_amount || 0), 0)
  const pending = (booking?.guests || []).filter(g => g.payment_status !== 'paid').reduce((s, g) => s + Number(g.payment_amount || 0), 0)
  const hostName = booking?.buyer_info ? `${booking.buyer_info.first_name || ''} ${booking.buyer_info.last_name || ''}`.trim() : ''

  if (loading) return <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C37A' }}>טוען...</div>
  if (!booking) return <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0a', padding: 24, color: '#ef4444' }}>הזמנה לא נמצאה</div>

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0a', padding: 24 }}>
      <h1 style={{ color: '#fff', fontSize: 24, marginBottom: 8 }}>שולחן {booking.table_number}</h1>
      <p style={{ color: 'var(--v2-gray-400)' }}>Host: {hostName || booking.host_phone}</p>

      <h2 style={{ color: '#fff', fontSize: 18, marginTop: 24, marginBottom: 12 }}>אורחים</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(booking.guests || []).map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <div>
              <span style={{ color: '#fff' }}>👤 {g.name || g.phone}</span>
              <span style={{ color: 'var(--v2-gray-400)', marginRight: 8 }}>{g.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: g.payment_status === 'paid' ? '#00C37A' : g.payment_status === 'waived' ? '#3b82f6' : 'var(--v2-gray-400)' }}>
                {g.payment_status === 'paid' ? '✅ שולם' : g.payment_status === 'waived' ? '🎟️ נכנס' : '⏳ ממתין לתשלום'}
              </span>
              <button onClick={() => removeGuest(g.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={14} /> הסר</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
        <h3 style={{ color: '#fff', fontSize: 14, marginBottom: 12 }}>+ הוסף אורח</h3>
        <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="נייד" style={{ width: '100%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        <button onClick={addGuest} disabled={addingGuest} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#00C37A', color: '#0a0a0a', border: 'none', borderRadius: 8, cursor: addingGuest ? 'wait' : 'pointer', fontWeight: 600 }}><UserPlus size={18} /> הוסף ושלח SMS</button>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
        <div style={{ color: '#fff' }}>שולם: ₪{paid.toFixed(0)}</div>
        <div style={{ color: 'var(--v2-gray-400)' }}>ממתין: ₪{pending.toFixed(0)}</div>
      </div>
    </div>
  )
}
