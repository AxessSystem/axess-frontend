import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Trophy, Sparkles, GraduationCap, HeartHandshake, Building, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin

const DEPT_ICONS = {
  youth: Users,
  sport: Trophy,
  culture: Sparkles,
  school: GraduationCap,
  community: HeartHandshake,
  municipality: Building,
}
const DEPT_LABELS = {
  youth: 'נוער',
  sport: 'ספורט',
  culture: 'תרבות',
  school: 'בית ספר',
  community: 'קהילה',
  municipality: 'עירייה',
}

export default function SubAccounts() {
  const { businessId } = useAuth()
  const [subAccounts, setSubAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ department_name: '', department_type: 'youth', admin_phone: '', admin_email: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!businessId) return
    fetch(`${API_BASE}/api/admin/sub-accounts?parent_business_id=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setSubAccounts)
      .catch(() => setSubAccounts([]))
      .finally(() => setLoading(false))
  }, [businessId])

  const handleCreate = async () => {
    if (!form.department_name.trim()) {
      toast.error('הזן שם מחלקה')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/sub-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_business_id: businessId,
          department_name: form.department_name.trim(),
          department_type: form.department_type,
          admin_phone: form.admin_phone.trim() || undefined,
          admin_email: form.admin_email.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה')
      setSubAccounts(prev => [data, ...prev])
      setModalOpen(false)
      setForm({ department_name: '', department_type: 'youth', admin_phone: '', admin_email: '' })
      toast.success('המחלקה נוספה')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את המחלקה?')) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/sub-accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה')
      setSubAccounts(prev => prev.filter(s => s.id !== id))
      toast.success('נמחק')
    } catch (err) {
      toast.error(err.message || 'שגיאה')
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--v2-gray-400)' }}>טוען...</div>
  }

  return (
    <div dir="rtl" style={{ padding: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800 }}>מחלקות</h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          <Plus size={18} /> הוסף מחלקה
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {subAccounts.map(sa => {
          const Icon = DEPT_ICONS[sa.department_type] || Building
          return (
            <div
              key={sa.id}
              style={{
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,195,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} style={{ color: 'var(--v2-primary)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{sa.department_name || sa.business_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--v2-gray-400)' }}>{DEPT_LABELS[sa.department_type] || sa.department_type || 'מחלקה'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`${FRONTEND_URL}/dashboard`}
                  style={{ flex: 1, padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', borderRadius: 8, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
                >
                  כנס לדשבורד
                </a>
                <button
                  onClick={() => handleDelete(sa.id)}
                  style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  מחק
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => !submitting && setModalOpen(false)}>
          <div style={{ background: 'var(--v2-dark-2)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()} dir="rtl">
            <h3 style={{ marginBottom: 20 }}>הוסף מחלקה</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>שם המחלקה *</label>
              <input value={form.department_name} onChange={e => setForm(f => ({ ...f, department_name: e.target.value }))} placeholder="מחלקת נוער" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>סוג</label>
              <select value={form.department_type} onChange={e => setForm(f => ({ ...f, department_type: e.target.value }))} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}>
                {Object.entries(DEPT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>הזמן מנהל (נייד)</label>
              <input type="tel" value={form.admin_phone} onChange={e => setForm(f => ({ ...f, admin_phone: e.target.value }))} placeholder="05XXXXXXXX" dir="ltr" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--v2-gray-400)' }}>הזמן מנהל (אימייל)</label>
              <input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} placeholder="email@example.com" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => !submitting && setModalOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-dark-3)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleCreate} disabled={submitting || !form.department_name.trim()} style={{ flex: 1, padding: 14, borderRadius: 'var(--radius-full)', background: 'var(--v2-primary)', color: 'var(--v2-dark)', fontWeight: 700, border: 'none', cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'שולח...' : 'הוסף'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
