import { useState, useEffect } from 'react'
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'

export default function QuickEditDrawer({
  recipient, businessId, fetchWithAuth, contactTypes,
  onClose, onSaved, onDeleted,
  onNavigate, currentIndex, total, hasPrev, hasNext,
}) {
  const [form, setForm] = useState({
    first_name: recipient?.first_name ||
      (recipient?.name ? recipient.name.split(' ')[0] : ''),
    last_name: recipient?.last_name ||
      (recipient?.name ? recipient.name.split(' ').slice(1).join(' ') : ''),
    phone: recipient?.phone || '',
    gender: recipient?.gender || '',
    birth_date: recipient?.birth_date || '',
    tags: recipient?.tags || [],
    contact_types: recipient?.contact_types || [],
    internal_notes: recipient?.internal_notes || '',
  })
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setForm({
      first_name: recipient?.first_name ||
        (recipient?.name ? recipient.name.split(' ')[0] : ''),
      last_name: recipient?.last_name ||
        (recipient?.name ? recipient.name.split(' ').slice(1).join(' ') : ''),
      phone: recipient?.phone || '',
      gender: recipient?.gender || '',
      birth_date: recipient?.birth_date || '',
      tags: recipient?.tags || [],
      contact_types: recipient?.contact_types || [],
      internal_notes: recipient?.internal_notes || '',
    })
    setShowDeleteConfirm(false)
    setSaveError('')
  }, [recipient?.id])

  const save = async () => {
    if (!recipient?.id) {
      setSaveError('חסר מזהה איש קשר')
      return
    }
    if (!businessId) {
      setSaveError('חסר מזהה עסק — נסה לרענן')
      return
    }

    console.log('[QuickEdit] saving:', { id: recipient.id, businessId, first_name: form.first_name })
    setSaving(true)
    setSaveError('')

    let profileOk = false

    try {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        await fetchWithAuth(`/api/admin/recipients/${recipient.id}/profile`, {
          method: 'PATCH',
          signal: controller.signal,
          body: JSON.stringify({
            business_id: businessId,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            gender: form.gender || null,
            birth_date: form.birth_date || null,
            contact_types: form.contact_types,
            internal_notes: form.internal_notes,
          }),
        })
        clearTimeout(timeout)
        profileOk = true
        console.log('[QuickEdit] profile saved ok')
      } catch (e) {
        console.error('[QuickEdit] profile error:', e.message)
        if (e.message.includes('פג תוקף') || e.message.includes('session')) {
          setSaveError('פג תוקף החיבור — נא לרענן את הדף (F5)')
        } else {
          setSaveError(e.name === 'AbortError' ? 'הבקשה נתקעה — נסה שוב' : 'שגיאה: ' + e.message)
        }
      }

      if (profileOk && form.tags) {
        try {
          const controller2 = new AbortController()
          const timeout2 = setTimeout(() => controller2.abort(), 10000)
          await fetchWithAuth(`/api/admin/recipients/${recipient.id}/tags`, {
            method: 'PATCH',
            signal: controller2.signal,
            body: JSON.stringify({ business_id: businessId, tags: form.tags }),
          })
          clearTimeout(timeout2)
        } catch (e) {
          console.error('[QuickEdit] tags error:', e.message)
        }
      }

      if (profileOk) {
        onSaved({ ...recipient, ...form })
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => setShowDeleteConfirm(true)

  const addTag = () => {
    const t = newTag.trim()
    if (t && !form.tags.includes(t)) {
      setForm(p => ({ ...p, tags: [...p.tags, t] }))
    }
    setNewTag('')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      <div style={{
        width: 'min(380px, 100vw)', background: 'var(--card)',
        height: '100%', direction: 'rtl',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <button
              type="button"
              onClick={() => onNavigate?.('prev')}
              disabled={!hasPrev}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px 10px',
                color: hasPrev ? 'var(--text)' : 'var(--text-secondary)',
                cursor: hasPrev ? 'pointer' : 'not-allowed',
                opacity: hasPrev ? 1 : 0.4,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronUp size={16} />
            </button>

            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              עריכה מהירה
              {currentIndex !== undefined && total !== undefined && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '8px' }}>
                  {currentIndex + 1}/{total}
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => onNavigate?.('next')}
              disabled={!hasNext}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px 10px',
                color: hasNext ? 'var(--text)' : 'var(--text-secondary)',
                cursor: hasNext ? 'pointer' : 'not-allowed',
                opacity: hasNext ? 1 : 0.4,
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['first_name', 'last_name'].map(field => (
              <input
                key={field}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder={field === 'first_name' ? 'שם פרטי' : 'שם משפחה'}
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', direction: 'rtl' }}
              />
            ))}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>טלפון</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="05X-XXXXXXX"
              type="tel"
              dir="ltr"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>מין</label>
              <CustomSelect
                value={form.gender}
                onChange={v => setForm(p => ({ ...p, gender: v }))}
                options={[
                  { value: '', label: 'לא צוין' },
                  { value: 'Male', label: '👨 זכר' },
                  { value: 'Female', label: '👩 נקבה' },
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>תאריך לידה</label>
              <input
                value={form.birth_date}
                onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))}
                type="date"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px' }}
              />
            </div>
          </div>

          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>סוגי קשר</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {contactTypes.map(type => {
              const selected = form.contact_types.includes(type.value)
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    contact_types: selected
                      ? p.contact_types.filter(t => t !== type.value)
                      : [...p.contact_types, type.value],
                  }))}
                  style={{
                    padding: '5px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${selected ? '#00C37A' : 'var(--border)'}`,
                    background: selected ? '#00C37A20' : 'transparent',
                    color: selected ? '#00C37A' : 'var(--text-secondary)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {type.emoji} {type.label}
                </button>
              )
            })}
          </div>

          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>תגיות</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {form.tags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="הוסף תגית..."
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px', direction: 'rtl' }}
            />
            <button
              type="button"
              onClick={addTag}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              +
            </button>
          </div>

          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>הערות פנימיות</label>
          <textarea
            value={form.internal_notes}
            onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))}
            placeholder="הערות..."
            rows={3}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', direction: 'rtl', marginBottom: '20px' }}
          />

          {saveError && (
            <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>
              {saveError}
            </p>
          )}

          {showDeleteConfirm && (
            <div style={{ marginBottom: '8px', padding: '12px', background: '#ef444420', borderRadius: '10px', border: '1px solid #ef4444' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text)', textAlign: 'center' }}>
                האם למחוק את {recipient?.first_name}? פעולה זו אינה הפיכה.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetchWithAuth(`/api/admin/recipients/${recipient.id}`, {
                        method: 'DELETE',
                        body: JSON.stringify({ business_id: businessId }),
                      })
                      onDeleted?.(recipient.id)
                      onClose()
                    } catch (e) {
                      console.error('delete error:', e)
                    }
                  }}
                  style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                >
                  כן, מחק
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex', gap: '8px',
          marginTop: 'auto'
        }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, background: '#00C37A', border: 'none',
              borderRadius: '10px', padding: '12px',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '12px 16px', borderRadius: '10px',
              border: '1px solid #ef4444', background: 'transparent',
              color: '#ef4444', cursor: 'pointer', fontSize: '14px',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
