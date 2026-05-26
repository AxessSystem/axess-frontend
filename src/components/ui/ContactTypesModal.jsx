import { useState, useEffect } from 'react'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'

export default function ContactTypesModal({ businessId, fetchWithAuth, onClose }) {
  const [types, setTypes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ label: '', emoji: '' })
  const [newForm, setNewForm] = useState({ label: '', emoji: '', value: '' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () =>
    fetchWithAuth(`/api/admin/contact-types?business_id=${businessId}`)
      .then(d => Array.isArray(d) && setTypes(d))
      .catch(() => {})

  useEffect(() => {
    console.log('ContactTypesModal businessId:', businessId)
    load()
  }, [])

  const startEdit = (t) => {
    setEditingId(t.id)
    setEditForm({ label: t.label, emoji: t.emoji || '' })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    await fetchWithAuth(`/api/admin/contact-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(editForm)
    }).catch(() => {})
    setEditingId(null)
    await load()
    setSaving(false)
  }

  const deleteType = async (id) => {
    await fetchWithAuth(`/api/admin/contact-types/${id}`, { method: 'DELETE' })
      .catch(() => {})
    await load()
  }

  const addNew = async () => {
    if (!newForm.label || !newForm.value) return
    setSaving(true)
    try {
      console.log('adding:', {
        label: newForm.label.trim(),
        emoji: newForm.emoji.trim() || null,
        value: newForm.value.toLowerCase().replace(/\s+/g, '_').trim(),
        business_id: businessId,
      })
      const result = await fetchWithAuth('/api/admin/contact-types', {
        method: 'POST',
        body: JSON.stringify({
          label: newForm.label.trim(),
          emoji: newForm.emoji.trim() || null,
          value: newForm.value.toLowerCase().replace(/\s+/g, '_').trim(),
          business_id: businessId,
        }),
      })
      if (result?.error) {
        alert(result.error)
        return
      }
      setNewForm({ label: '', emoji: '', value: '' })
      setAdding(false)
      await load()
    } catch (e) {
      console.error('addNew error:', e)
      alert(e.message || 'שגיאה בהוספה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card)', borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '460px', direction: 'rtl',
        maxHeight: '80vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>ניהול סוגי קשר</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {types.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            border: '1px solid var(--border)', marginBottom: '8px'
          }}>
            {editingId === t.id ? (
              <>
                <input
                  value={editForm.emoji}
                  onChange={e => setEditForm(p => ({ ...p, emoji: e.target.value }))}
                  placeholder="🎧"
                  style={{ width: '44px', textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', fontSize: '18px' }}
                />
                <input
                  value={editForm.label}
                  onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', direction: 'rtl' }}
                />
                <button type="button" onClick={() => saveEdit(t.id)} disabled={saving}
                  style={{ background: '#00C37A', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#fff' }}>
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => setEditingId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{t.emoji}</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{t.label}</span>
                {t.is_system && <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>מובנה</span>}
                <button type="button" onClick={() => startEdit(t)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <Pencil size={14} />
                </button>
                {!t.is_system && (
                  <button type="button" onClick={() => deleteType(t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div style={{ border: '1px solid #00C37A', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={newForm.emoji}
                onChange={e => setNewForm(p => ({ ...p, emoji: e.target.value }))}
                placeholder="🎯"
                style={{ width: '44px', textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', fontSize: '18px' }}
              />
              <input
                value={newForm.label}
                onChange={e => setNewForm(p => ({ ...p, label: e.target.value }))}
                placeholder="שם סוג הקשר"
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', direction: 'rtl' }}
              />
            </div>
            <input
              value={newForm.value}
              onChange={e => setNewForm(p => ({ ...p, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="מזהה (באנגלית, למשל: wedding_planner)"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', direction: 'ltr', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={addNew} disabled={saving || !newForm.label || !newForm.value}
                style={{ flex: 1, background: '#00C37A', border: 'none', borderRadius: '8px', padding: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                הוסף
              </button>
              <button type="button" onClick={() => setAdding(false)}
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            style={{
              width: '100%', marginTop: '8px', padding: '10px',
              border: '1px dashed var(--border)', borderRadius: '10px',
              background: 'none', color: '#00C37A', cursor: 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px'
            }}>
            <Plus size={16} /> הוסף סוג קשר חדש
          </button>
        )}
      </div>
    </div>
  )
}
