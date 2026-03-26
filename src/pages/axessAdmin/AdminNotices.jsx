import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

export default function AdminNotices() {
  const { session } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all', expires_at: '' })
  const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : {}

  const { data: notices = [] } = useQuery({
    queryKey: ['axess-admin-notices', session?.access_token],
    queryFn: () => fetch(`${API_BASE}/api/axess-admin/notices`, { headers }).then(r => {
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    }),
    enabled: !!session?.access_token,
  })

  const createMut = useMutation({
    mutationFn: (body) => fetch(`${API_BASE}/api/axess-admin/notices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['axess-admin-notices'])
      setModalOpen(false)
      setForm({ title: '', message: '', type: 'info', target: 'all', expires_at: '' })
      toast.success('הודעה נוצרה')
    },
    onError: (e) => toast.error(e.message || 'שגיאה'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => fetch(`${API_BASE}/api/axess-admin/notices/${id}`, { method: 'DELETE', headers }),
    onSuccess: () => {
      qc.invalidateQueries(['axess-admin-notices'])
      toast.success('הודעה הוסרה')
    },
  })

  return (
    <div dir="rtl" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>הודעות מערכת</h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--v2-primary)',
            color: 'var(--v2-dark)',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={18} /> הודעה חדשה
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notices.map(n => (
          <div
            key={n.id}
            style={{
              background: 'var(--v2-dark-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{n.title}</div>
              <div style={{ color: 'var(--v2-gray-400)', fontSize: 14, marginTop: 4 }}>{n.message}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>סוג: {n.type}</span>
                <span style={{ fontSize: 12, color: 'var(--v2-gray-400)' }}>קהל: {n.target}</span>
              </div>
            </div>
            <button
              onClick={() => deleteMut.mutate(n.id)}
              style={{ background: 'none', border: 'none', color: 'var(--v2-gray-400)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--v2-dark-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 440,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 16 }}>הודעה חדשה</h3>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="כותרת"
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
            />
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="הודעה"
              rows={4}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff', resize: 'vertical' }}
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
            >
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="maintenance">maintenance</option>
            </select>
            <select
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
            >
              <option value="all">כולם</option>
              <option value="type:club">מועדונים</option>
              <option value="type:municipal">רשויות</option>
            </select>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              placeholder="תוקף"
              style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--v2-dark-3)', color: '#fff' }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>ביטול</button>
              <button
                onClick={() => createMut.mutate({ ...form, expires_at: form.expires_at || null })}
                style={{ padding: '10px 16px', background: 'var(--v2-primary)', color: 'var(--v2-dark)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
