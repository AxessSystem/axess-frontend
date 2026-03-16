import { useState, useEffect } from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

export default function Promoters() {
  const { businessId } = useAuth()
  const [promoters, setPromoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editPromoter, setEditPromoter] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/promoters?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPromoters(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [businessId])

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, name: name.trim(), phone: phone || null, email: email || null, instagram: instagram || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('יחצ"ן נוצר')
      setPromoters(prev => [data, ...prev])
      setAddOpen(false)
      setName('')
      setPhone('')
      setEmail('')
      setInstagram('')
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleUpdate = async () => {
    if (!editPromoter) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters/${editPromoter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone || null, email: email || null, instagram: instagram || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      toast.success('עודכן')
      setPromoters(prev => prev.map(p => p.id === editPromoter.id ? data : p))
      setEditPromoter(null)
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const handleDeactivate = async (p) => {
    if (!confirm('להשבית את היחצ"ן?')) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/promoters/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      toast.success('הושבת')
      setPromoters(prev => prev.map(x => x.id === p.id ? { ...x, status: 'inactive' } : x))
    } catch (e) { toast.error(e.message || 'שגיאה') }
  }

  const openEdit = (p) => {
    setEditPromoter(p)
    setName(p.name || '')
    setPhone(p.phone || '')
    setEmail(p.email || '')
    setInstagram(p.instagram || '')
  }

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>יחצ"נים</h1>
        <button
          onClick={() => { setAddOpen(true); setEditPromoter(null); setName(''); setPhone(''); setEmail(''); setInstagram('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          הוסף יחצ"ן חדש
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : promoters.length === 0 && !addOpen ? (
        <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>אין יחצ"נים</div>
          <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>הוסף יחצ"ן ראשון</div>
          <button onClick={() => setAddOpen(true)} style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            הוסף יחצ"ן
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {promoters.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                opacity: p.status === 'inactive' ? 0.6 : 1,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--v2-gray-400)' }}>
                  {p.phone && <span>{p.phone}</span>}
                  {p.instagram && <span>@{p.instagram.replace('@', '')}</span>}
                </div>
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  סה"כ מכירות: ₪{(p.total_sales || 0).toFixed(0)} | עמלה: ₪{(p.total_commission || 0).toFixed(0)}
                </div>
              </div>
              {p.status !== 'inactive' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    <Edit3 size={14} /> ערוך פרטים
                  </button>
                  <a href="/dashboard/events" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', background: 'var(--v2-dark-2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--v2-primary)', textDecoration: 'none', fontSize: 13 }}>
                    👁️ הסטוריית אירועים
                  </a>
                  <button onClick={() => handleDeactivate(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', background: 'transparent', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
                    <Trash2 size={14} /> השבת
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(addOpen || editPromoter) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => { setAddOpen(false); setEditPromoter(null) }}>
          <div style={{ background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()} dir="rtl">
            <h3 style={{ marginBottom: 20 }}>{editPromoter ? 'ערוך יחצ"ן' : 'יחצ"ן חדש'}</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="שם *" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="טלפון" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="מייל" style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="אינסטגרם" style={{ width: '100%', padding: 12, marginBottom: 24, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={editPromoter ? handleUpdate : handleCreate} disabled={!name.trim()} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: name.trim() ? 'var(--v2-primary)' : 'var(--v2-gray-600)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>{editPromoter ? 'שמור' : 'הוסף'}</button>
              <button onClick={() => { setAddOpen(false); setEditPromoter(null) }} style={{ padding: 14, borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', color: 'var(--v2-gray-400)', cursor: 'pointer', background: 'transparent' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
