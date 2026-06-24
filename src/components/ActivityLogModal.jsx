import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomSelect from '@/components/ui/CustomSelect'
import { fetchWithAuth } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const ACCENT = '#00C37A'

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'meeting', label: 'פגישה' },
  { value: 'call', label: 'שיחה' },
  { value: 'note', label: 'הערה' },
  { value: 'email', label: 'אימייל' },
  { value: 'document_sent', label: 'מסמך שנשלח' },
  { value: 'document_received', label: 'מסמך שהתקבל' },
  { value: 'task', label: 'משימה' },
]

const DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'יצאנו' },
  { value: 'inbound', label: 'נכנס' },
]

const DOC_TYPE_OPTIONS = [
  { value: 'quote', label: 'הצעת מחיר' },
  { value: 'contract', label: 'חוזה' },
  { value: 'presentation', label: 'מצגת' },
  { value: 'invoice', label: 'חשבונית' },
  { value: 'meeting_summary', label: 'סיכום פגישה' },
  { value: 'other', label: 'אחר' },
]

const OUTCOME_OPTIONS = [
  { value: 'completed', label: 'הושלם' },
  { value: 'no_answer', label: 'לא ענה' },
  { value: 'scheduled_followup', label: 'נקבעה המשך' },
  { value: 'cancelled', label: 'בוטל' },
  { value: 'signed', label: 'נחתם' },
  { value: 'rejected', label: 'נדחה' },
]

const SHOW_DIRECTION = new Set(['call', 'email', 'document_sent', 'document_received'])
const SHOW_DOC = new Set(['document_sent', 'document_received'])
const SHOW_DURATION = new Set(['meeting', 'call'])

export default function ActivityLogModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  projectId,
  projectContactId,
  editItem,
  onSaved,
}) {
  const { businessId } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    activity_type: 'note',
    direction: 'outbound',
    related_document_type: '',
    duration_minutes: '',
    outcome: '',
    follow_up_date: '',
    note: '',
    attachments: [],
  })

  useEffect(() => {
    if (!isOpen) return
    if (editItem) {
      setForm({
        activity_type: editItem.activity_type || 'note',
        direction: editItem.direction || 'outbound',
        related_document_type: editItem.related_document_type || '',
        duration_minutes: editItem.duration_minutes != null ? String(editItem.duration_minutes) : '',
        outcome: editItem.outcome || '',
        follow_up_date: editItem.follow_up_date ? String(editItem.follow_up_date).slice(0, 10) : '',
        note: editItem.note || '',
        attachments: Array.isArray(editItem.attachments) ? editItem.attachments.map((a) => ({ type: 'link', label: a.label || '', url: a.url || '' })) : [],
      })
      return
    }
    setForm({
      activity_type: 'note',
      direction: 'outbound',
      related_document_type: '',
      duration_minutes: '',
      outcome: '',
      follow_up_date: '',
      note: '',
      attachments: [],
    })
  }, [isOpen, recipientId, editItem])

  if (!isOpen) return null

  const addAttachment = () => {
    setForm((f) => ({
      ...f,
      attachments: [...f.attachments, { type: 'link', label: '', url: '' }],
    }))
  }

  const updateAttachment = (idx, key, val) => {
    setForm((f) => {
      const attachments = [...f.attachments]
      attachments[idx] = { ...attachments[idx], [key]: val }
      return { ...f, attachments }
    })
  }

  const removeAttachment = (idx) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.filter((_, i) => i !== idx),
    }))
  }

  const handleSave = async () => {
    if (!recipientId || !businessId) return
    if (!form.activity_type) {
      toast.error('יש לבחור סוג פעילות')
      return
    }
    setSaving(true)
    try {
      const attachments = form.attachments
        .filter((a) => a.url?.trim())
        .map((a) => ({
          type: 'link',
          label: a.label || a.url,
          url: a.url.trim(),
        }))

      const payload = {
        master_recipient_id: recipientId,
        business_id: businessId,
        project_id: projectId || undefined,
        project_contact_id: projectContactId || undefined,
        activity_type: form.activity_type,
        direction: form.direction,
        note: form.note || undefined,
        related_document_type: form.related_document_type || undefined,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        outcome: form.outcome || undefined,
        follow_up_date: form.follow_up_date || undefined,
        attachments,
      }

      const data = editItem?.id
        ? await fetchWithAuth(`/api/audiences/activity/${editItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await fetchWithAuth('/api/audiences/activity', {
            method: 'POST',
            body: JSON.stringify(payload),
          })
      if (data?.error) throw new Error(data.error)
      toast.success(editItem?.id ? 'הפעילות עודכנה' : 'הפעילות נשמרה')
      onSaved?.(data.item || data)
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--glass-border, var(--border))',
    background: 'var(--bg, var(--v2-dark-3))',
    color: 'var(--text, #fff)',
    fontSize: 14,
    boxSizing: 'border-box',
  }

  const labelStyle = { fontSize: 12, color: 'var(--text-secondary, var(--v2-gray-400))', marginBottom: 6, display: 'block' }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card, var(--v2-dark-2))',
          borderTop: '1px solid var(--glass-border)',
          borderRadius: '16px 16px 0 0',
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text, #fff)' }}>
            {editItem?.id ? 'עריכת פעילות' : 'תיעוד פעילות'}{recipientName ? ` — ${recipientName}` : ''}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-gray-400)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>סוג פעילות *</label>
            <CustomSelect
              options={ACTIVITY_TYPE_OPTIONS}
              value={form.activity_type}
              onChange={(v) => setForm((f) => ({ ...f, activity_type: v }))}
              style={inputStyle}
            />
          </div>

          {SHOW_DIRECTION.has(form.activity_type) && (
            <div>
              <label style={labelStyle}>כיוון</label>
              <CustomSelect
                options={DIRECTION_OPTIONS}
                value={form.direction}
                onChange={(v) => setForm((f) => ({ ...f, direction: v }))}
                style={inputStyle}
              />
            </div>
          )}

          {SHOW_DOC.has(form.activity_type) && (
            <div>
              <label style={labelStyle}>סוג מסמך</label>
              <CustomSelect
                options={DOC_TYPE_OPTIONS}
                value={form.related_document_type}
                onChange={(v) => setForm((f) => ({ ...f, related_document_type: v }))}
                placeholder="בחר..."
                style={inputStyle}
              />
            </div>
          )}

          {SHOW_DURATION.has(form.activity_type) && (
            <div>
              <label style={labelStyle}>משך (דקות)</label>
              <input
                type="number"
                min={0}
                className="form-input input"
                style={inputStyle}
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>תוצאה</label>
            <CustomSelect
              options={OUTCOME_OPTIONS}
              value={form.outcome}
              onChange={(v) => setForm((f) => ({ ...f, outcome: v }))}
              placeholder="לא נבחר"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>תאריך המשך</label>
            <input
              type="date"
              className="form-input input"
              style={inputStyle}
              value={form.follow_up_date}
              onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>הערות</label>
            <textarea
              className="form-input input"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>קישורים מצורפים</label>
              <button
                type="button"
                onClick={addAttachment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${ACCENT}`,
                  background: 'transparent',
                  color: ACCENT,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={14} /> הוסף קישור
              </button>
            </div>
            {form.attachments.map((att, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  placeholder="תיאור"
                  className="form-input input"
                  style={{ ...inputStyle, flex: 1 }}
                  value={att.label}
                  onChange={(e) => updateAttachment(idx, 'label', e.target.value)}
                />
                <input
                  placeholder="URL"
                  className="form-input input"
                  style={{ ...inputStyle, flex: 2 }}
                  dir="ltr"
                  value={att.url}
                  onChange={(e) => updateAttachment(idx, 'url', e.target.value)}
                />
                <button type="button" onClick={() => removeAttachment(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            style={{
              marginTop: 8,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: ACCENT,
              color: '#000',
              fontWeight: 700,
              fontSize: 15,
              cursor: saving ? 'wait' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  )
}
