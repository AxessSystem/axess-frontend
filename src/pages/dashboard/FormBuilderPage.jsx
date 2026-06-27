import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api'
import CustomSelect from '@/components/ui/CustomSelect'
import ConfirmModal from '@/components/ui/ConfirmModal'
import DynamicRegistrationForm from '@/components/DynamicRegistrationForm'
import {
  CONDITION_OPERATORS,
  FIELD_TYPES,
  fieldTypeLabel,
  normalizeField,
  normalizeFieldOptions,
  normalizeFields,
} from '@/lib/formSchema'

const TYPE_OPTIONS = Object.values(FIELD_TYPES).map((t) => ({
  value: t,
  label: fieldTypeLabel(t),
}))

function emptyField() {
  return {
    id: `custom_${Date.now()}`,
    type: FIELD_TYPES.text,
    label: '',
    required: false,
    conditions: [],
    conditions_operator: 'AND',
  }
}

function FieldEditorModal({ open, field, allFields, onSave, onClose }) {
  const [draft, setDraft] = useState(field || emptyField())

  useEffect(() => {
    setDraft(field ? { ...field, conditions: field.conditions || [] } : emptyField())
  }, [field, open])

  if (!open) return null

  const otherFields = allFields.filter((f) => f.id !== draft.id && f.type !== FIELD_TYPES.section_header)

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  const optionsList = normalizeFieldOptions(draft.options).filter((o) => o.value != null || o.group)

  const updateOption = (idx, patch) => {
    const list = [...optionsList]
    list[idx] = { ...list[idx], ...patch }
    set('options', list)
  }

  const addOption = () => {
    set('options', [...optionsList, { value: '', label: '' }])
  }

  const addGroup = () => {
    set('options', [...optionsList, { group: 'קבוצה חדשה' }])
  }

  const removeOption = (idx) => {
    set('options', optionsList.filter((_, i) => i !== idx))
  }

  const addCondition = () => {
    set('conditions', [
      ...(draft.conditions || []),
      { field: otherFields[0]?.id || '', operator: 'equals', value: '' },
    ])
  }

  const updateCondition = (idx, patch) => {
    set(
      'conditions',
      (draft.conditions || []).map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    )
  }

  const removeCondition = (idx) => {
    set('conditions', (draft.conditions || []).filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!draft.label?.trim()) {
      toast.error('יש להזין label')
      return
    }
    const cleaned = {
      ...draft,
      label: draft.label.trim(),
      options:
        draft.type === FIELD_TYPES.select || draft.type === FIELD_TYPES.multiselect
          ? optionsList.filter((o) => o.group || (o.value && o.label))
          : undefined,
    }
    onSave(cleaned)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        dir="rtl"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--v2-dark-3)',
          border: '1px solid var(--v2-gray-200)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#fff' }}>
          {field ? 'עריכת שדה' : 'שדה חדש'}
        </h2>

        <label style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 6 }}>Label *</label>
        <input
          value={draft.label}
          onChange={(e) => set('label', e.target.value)}
          style={{
            width: '100%',
            minHeight: 40,
            marginBottom: 12,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--v2-gray-200)',
            background: 'var(--v2-dark-2)',
            color: '#fff',
          }}
        />

        <label style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 6 }}>סוג שדה</label>
        <CustomSelect
          value={draft.type}
          onChange={(v) => set('type', v)}
          options={TYPE_OPTIONS}
          style={{ width: '100%', marginBottom: 12, minHeight: 40 }}
        />

        {draft.type !== FIELD_TYPES.section_header && (
          <>
            <label style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 6 }}>Placeholder</label>
            <input
              value={draft.placeholder || ''}
              onChange={(e) => set('placeholder', e.target.value)}
              style={{
                width: '100%',
                minHeight: 40,
                marginBottom: 12,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid var(--v2-gray-200)',
                background: 'var(--v2-dark-2)',
                color: '#fff',
              }}
            />
          </>
        )}

        {draft.type !== FIELD_TYPES.section_header && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#fff', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={Boolean(draft.required)}
              onChange={(e) => set('required', e.target.checked)}
            />
            חובה
          </label>
        )}

        <label style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 6 }}>Tooltip</label>
        <textarea
          value={draft.tooltip || ''}
          onChange={(e) => set('tooltip', e.target.value)}
          rows={2}
          style={{
            width: '100%',
            marginBottom: 12,
            padding: 8,
            borderRadius: 8,
            border: '1px solid var(--v2-gray-200)',
            background: 'var(--v2-dark-2)',
            color: '#fff',
          }}
        />

        {draft.type === FIELD_TYPES.textarea && (
          <>
            <label style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 6 }}>Max chars</label>
            <input
              type="number"
              value={draft.max_chars || ''}
              onChange={(e) => set('max_chars', e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                minHeight: 40,
                marginBottom: 12,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid var(--v2-gray-200)',
                background: 'var(--v2-dark-2)',
                color: '#fff',
              }}
            />
          </>
        )}

        {(draft.type === FIELD_TYPES.select || draft.type === FIELD_TYPES.multiselect) && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Options</p>
            {optionsList.map((opt, idx) => (
              opt.group != null && opt.value == null ? (
                <div key={`g-${idx}`} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={opt.group}
                    onChange={(e) => updateOption(idx, { group: e.target.value })}
                    placeholder="כותרת קבוצה"
                    style={{ flex: 1, height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'var(--v2-dark-2)', color: '#fff' }}
                  />
                  <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div key={`o-${idx}`} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={opt.value || ''}
                    onChange={(e) => updateOption(idx, { value: e.target.value })}
                    placeholder="value"
                    style={{ flex: 1, height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'var(--v2-dark-2)', color: '#fff' }}
                  />
                  <input
                    value={opt.label || ''}
                    onChange={(e) => updateOption(idx, { label: e.target.value })}
                    placeholder="label"
                    style={{ flex: 1, height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'var(--v2-dark-2)', color: '#fff' }}
                  />
                  <input
                    value={opt.group || ''}
                    onChange={(e) => updateOption(idx, { group: e.target.value || undefined })}
                    placeholder="group"
                    style={{ flex: 1, height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'var(--v2-dark-2)', color: '#fff' }}
                  />
                  <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={addOption} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#00C37A', color: '#000', cursor: 'pointer', fontSize: 12 }}>
                + הוסף אפשרות
              </button>
              <button type="button" onClick={addGroup} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                + הוסף כותרת קבוצה
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--v2-gray-200)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#fff' }}>הצג שדה זה רק אם:</p>
          {(draft.conditions || []).map((cond, idx) => {
            const src = otherFields.find((f) => f.id === cond.field)
            const srcOpts = normalizeFieldOptions(src?.options)
            return (
              <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <CustomSelect
                  value={cond.field}
                  onChange={(v) => updateCondition(idx, { field: v, value: '' })}
                  options={otherFields.map((f) => ({ value: f.id, label: f.label }))}
                  placeholder="שדה"
                  style={{ minWidth: 120, minHeight: 36 }}
                />
                <CustomSelect
                  value={cond.operator}
                  onChange={(v) => updateCondition(idx, { operator: v })}
                  options={CONDITION_OPERATORS}
                  style={{ minWidth: 100, minHeight: 36 }}
                />
                {cond.operator !== 'not_empty' && (
                  srcOpts.length > 0 ? (
                    <CustomSelect
                      value={cond.value}
                      onChange={(v) => updateCondition(idx, { value: v })}
                      options={srcOpts.filter((o) => o.value != null)}
                      placeholder="ערך"
                      style={{ minWidth: 120, minHeight: 36 }}
                    />
                  ) : (
                    <input
                      value={cond.value ?? ''}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      placeholder="ערך"
                      style={{ flex: 1, minWidth: 100, height: 36, padding: '0 8px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'var(--v2-dark-2)', color: '#fff' }}
                    />
                  )
                )}
                <button type="button" onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          <button type="button" onClick={addCondition} disabled={!otherFields.length} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--v2-gray-200)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
            + הוסף תנאי
          </button>
          {(draft.conditions || []).length >= 2 && (
            <div style={{ marginTop: 10 }}>
              <CustomSelect
                value={draft.conditions_operator || 'AND'}
                onChange={(v) => set('conditions_operator', v)}
                options={[
                  { value: 'AND', label: 'כל התנאים (AND)' },
                  { value: 'OR', label: 'לפחות אחד (OR)' },
                ]}
                style={{ width: '100%', minHeight: 36 }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleSave} style={{ flex: 1, height: 42, borderRadius: 8, border: 'none', background: '#00C37A', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            שמור
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid var(--v2-gray-200)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FormBuilderPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [eventTitle, setEventTitle] = useState('')
  const [fields, setFields] = useState([])
  const [previewValues, setPreviewValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [deleteIndex, setDeleteIndex] = useState(null)

  useEffect(() => {
    fetchWithAuth(`/api/admin/events/${eventId}`)
      .then((data) => {
        setFields(normalizeFields(data.registration_fields))
        setEventTitle(data.title || '')
      })
      .catch(() => toast.error('שגיאה בטעינת האירוע'))
      .finally(() => setLoading(false))
  }, [eventId])

  const editingField = useMemo(() => {
    if (editingIndex == null) return null
    return fields[editingIndex] || null
  }, [editingIndex, fields])

  const moveField = (idx, dir) => {
    const next = idx + dir
    if (next < 0 || next >= fields.length) return
    setFields((prev) => {
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  const handleSaveField = (field) => {
    if (editingIndex == null) {
      setFields((prev) => [...prev, field])
    } else {
      setFields((prev) => prev.map((f, i) => (i === editingIndex ? field : f)))
    }
    setEditorOpen(false)
    setEditingIndex(null)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ registration_fields: fields }),
        _raw: true,
      })
      if (res.ok) toast.success('השינויים נשמרו ✓')
      else toast.error('שגיאה בשמירה')
    } catch {
      toast.error('שגיאה בחיבור לשרת')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v2-gray-400)' }}>
        טוען...
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ padding: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--v2-gray-200)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
          ← חזור לאירוע
        </button>
        <h1 style={{ flex: 1, margin: 0, fontSize: 20, color: '#fff' }}>
          Form Builder — {eventTitle}
        </h1>
        <button type="button" onClick={handleSaveAll} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: saving ? 'var(--v2-gray-600)' : '#00C37A', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', maxWidth: '40%', minWidth: 280 }}>
          <h2 style={{ fontSize: 16, color: '#fff', margin: '0 0 12px' }}>שדות</h2>
          {fields.map((field, idx) => (
            <div
              key={field.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                marginBottom: 8,
                background: 'var(--v2-dark-3)',
                border: '1px solid var(--v2-gray-200)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ color: 'var(--v2-gray-400)', fontSize: 16 }} title="גרירה">⠿</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{field.label}</div>
                <div style={{ fontSize: 11, color: 'var(--v2-gray-400)' }}>{fieldTypeLabel(field.type)}</div>
              </div>
              <button type="button" onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: idx === 0 ? 0.3 : 1 }}>
                <ArrowUp size={16} />
              </button>
              <button type="button" onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: idx === fields.length - 1 ? 0.3 : 1 }}>
                <ArrowDown size={16} />
              </button>
              <button type="button" onClick={() => { setEditingIndex(idx); setEditorOpen(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
                <Pencil size={16} />
              </button>
              {!field.system && (
                <button type="button" onClick={() => setDeleteIndex(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => { setEditingIndex(null); setEditorOpen(true) }}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '12px',
              borderRadius: 8,
              border: '1px dashed var(--v2-gray-200)',
              background: 'transparent',
              color: '#00C37A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} /> הוסף שדה
          </button>
        </div>

        <div
          style={{
            flex: '1 1 400px',
            minWidth: 280,
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--v2-gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 16, color: '#fff', margin: '0 0 16px' }}>תצוגה מקדימה</h2>
          <DynamicRegistrationForm
            fields={fields}
            values={previewValues}
            onChange={(id, val) => setPreviewValues((p) => ({ ...p, [id]: val }))}
          />
        </div>
      </div>

      <FieldEditorModal
        open={editorOpen}
        field={editingField}
        allFields={fields}
        onSave={handleSaveField}
        onClose={() => { setEditorOpen(false); setEditingIndex(null) }}
      />

      <ConfirmModal
        open={deleteIndex != null}
        title="מחיקת שדה"
        message="למחוק את השדה?"
        danger
        onConfirm={() => {
          setFields((prev) => prev.filter((_, i) => i !== deleteIndex))
          setDeleteIndex(null)
        }}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  )
}
