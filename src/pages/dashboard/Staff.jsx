import { useState, useEffect } from 'react'
import { Edit3, Trash2, UserPlus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import Tooltip from '@/components/ui/Tooltip'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-backend.up.railway.app'

const ROLES = [
  { value: 'owner', label: 'בעלים', desc: 'גישה מלאה', emoji: '👑' },
  { value: 'manager', label: 'מנהל', desc: 'כמעט הכל', emoji: '🔧' },
  { value: 'event_manager', label: 'מנהל אירועים', desc: 'ניהול אירועים בלבד', emoji: '🎪' },
  { value: 'promoter_manager', label: 'מנהל יחצ"נים', desc: 'ניהול יחצ"נים בלבד', emoji: '📢' },
  { value: 'table_manager', label: 'מנהל שולחנות', desc: 'ניהול ישיבה', emoji: '🪑' },
  { value: 'door_staff', label: 'צוות כניסות', desc: 'סריקה בלבד', emoji: '🚪' },
  { value: 'bar_staff', label: 'צוות בר', desc: 'סריקה בלבד', emoji: '🍹' },
  { value: 'viewer', label: 'צופה', desc: 'דוחות בלבד', emoji: '👁️' },
]

export default function Staff() {
  const { session } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [name, setName] = useState('')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [role, setRole] = useState('viewer')
  const [eventAccess, setEventAccess] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const businessId = 'placeholder'

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json', 'X-Business-Id': businessId }
    if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`
    return h
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/staff?business_id=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setMembers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [businessId])

  const handleInvite = async () => {
    const email = emailOrPhone.includes('@') ? emailOrPhone : null
    const phone = !email && /[\d]/.test(emailOrPhone) ? emailOrPhone : null
    if (!email && !phone) {
      toast.error('הכנס מייל או טלפון')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/staff/invite`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          business_id: businessId,
          email,
          phone,
          role,
          event_access: eventAccess === 'all' ? [] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      toast.success('הזמנה נשלחה')
      setAddOpen(false)
      setName('')
      setEmailOrPhone('')
      setRole('viewer')
      setEventAccess('all')
      if (data.join_url) toast(`קישור: ${data.join_url}`, { duration: 5000 })
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editMember) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/staff/${editMember.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'שגיאה')
      toast.success('עודכן')
      setMembers(prev => prev.map(m => m.id === editMember.id ? { ...m, role } : m))
      setEditMember(null)
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (m) => {
    if (!confirm('להסיר את חבר הצוות?')) return
    try {
      const res = await fetch(`${API_BASE}/api/staff/${m.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || d.message || 'שגיאה')
      }
      toast.success('הוסר')
      setMembers(prev => prev.filter(x => x.id !== m.id))
    } catch (e) {
      toast.error(e.message || 'שגיאה')
    }
  }

  const roleLabel = (r) => ROLES.find(x => x.value === r)?.label || r
  const roleEmoji = (r) => ROLES.find(x => x.value === r)?.emoji || ''

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)', maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>צוות</h1>
        <button
          onClick={() => { setAddOpen(true); setEditMember(null); setRole('viewer'); setEventAccess('all'); setName(''); setEmailOrPhone('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          <UserPlus size={18} /> הוסף חבר צוות
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--v2-gray-400)' }}>טוען...</div>
      ) : members.length === 0 && !addOpen ? (
        <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center' }}>
          <Users size={40} style={{ color: 'var(--v2-gray-400)', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>אין חברי צוות</div>
          <div style={{ color: 'var(--v2-gray-400)', marginBottom: 24 }}>הוסף חבר צוות והזמן אותו</div>
          <button onClick={() => setAddOpen(true)} style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            הוסף חבר צוות
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,195,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {(m.name || m.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#fff' }}>{m.name || m.email || 'חבר צוות'}</div>
                <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{roleEmoji(m.role)} {roleLabel(m.role)} - {m.status === 'active' ? 'פעיל' : m.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditMember(m); setRole(m.role) }} style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--v2-gray-400)' }} title="שנה תפקיד"><Edit3 size={16} /></button>
                <button onClick={() => handleRemove(m)} style={{ padding: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', color: '#f87171' }} title="הסר"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !submitting && setAddOpen(false)}>
          <div dir="rtl" style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>הוסף חבר צוות</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">שם</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="שם (אופציונלי)" />
              </div>
              <div>
                <label className="label">מייל או טלפון</label>
                <input className="input" dir="ltr" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} placeholder="email@example.com או 05XXXXXXXX" />
              </div>
              <div>
                <label className="label">תפקיד</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.emoji} {r.label} - {r.desc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  גישה לאירועים
                  <Tooltip text="בחר אירועים ספציפיים אם ברצונך להגביל את הגישה של חבר הצוות לאירועים מסוימים בלבד" />
                </label>
                <select className="input" value={eventAccess} onChange={e => setEventAccess(e.target.value)}>
                  <option value="all">כל האירועים</option>
                  <option value="specific">אירועים ספציפיים</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setAddOpen(false)} disabled={submitting} style={{ padding: '10px 20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleInvite} disabled={submitting} className="btn-primary" style={{ padding: '10px 20px' }}>
                {submitting ? 'שולח...' : 'שלח הזמנה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => !submitting && setEditMember(null)}>
          <div dir="rtl" style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>שנה תפקיד</h3>
            <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ marginBottom: 16 }}>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.emoji} {r.label} - {r.desc}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditMember(null)} disabled={submitting} style={{ padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleUpdateRole} disabled={submitting} className="btn-primary" style={{ padding: '10px 20px' }}>שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
