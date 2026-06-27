import CustomSelect from '@/components/ui/CustomSelect'
import FormPhoneInput from '@/components/ui/FormPhoneInput'
import MultiSelect from '@/components/ui/MultiSelect'
import InfoTooltip from '@/components/ui/InfoTooltip'
import {
  FIELD_TYPES,
  getVisibleFields,
  normalizeField,
  normalizeFieldOptions,
} from '@/lib/formSchema'

const inputStyle = {
  width: '100%',
  minHeight: 48,
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--v2-dark-2)',
  border: '1px solid var(--v2-gray-200)',
  color: '#fff',
  fontSize: 16,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

function FieldLabel({ label, required, tooltip }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
        {label}
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </span>
      {tooltip && <InfoTooltip text={tooltip} />}
    </div>
  )
}

function optionsForField(field, categories, values) {
  if (field.id === 'category_l1' && categories?.l1?.length) {
    return categories.l1.map((c) => ({ value: c.key, label: c.label_he }))
  }
  if (field.id === 'category_l2' && categories?.l2) {
    const l1Keys = Array.isArray(values.category_l1)
      ? values.category_l1
      : values.category_l1
      ? [values.category_l1]
      : []
    const merged = []
    const seen = new Set()
    for (const l1 of l1Keys) {
      for (const c of categories.l2[l1] || []) {
        if (!seen.has(c.key)) {
          seen.add(c.key)
          merged.push({ value: c.key, label: c.label_he })
        }
      }
    }
    if (merged.length) return merged
  }
  return normalizeFieldOptions(field.options)
}

function buildGroupedOptions(options) {
  const normalized = normalizeFieldOptions(options)
  const hasGroups = normalized.some((o) => o.group)
  if (!hasGroups) return normalized
  const result = []
  let lastGroup = null
  for (const opt of normalized) {
    if (opt.group && opt.group !== lastGroup) {
      result.push({ group: opt.group })
      lastGroup = opt.group
    }
    if (opt.value != null) {
      result.push(opt)
    }
  }
  return result
}

export default function DynamicRegistrationForm({
  fields = [],
  values = {},
  onChange,
  errors = {},
  categories,
}) {
  const visible = getVisibleFields(fields, values)

  return (
    <div dir="rtl">
      {visible.map((raw) => {
        const field = normalizeField(raw)
        const { id, type, label, placeholder, required, tooltip, max_chars: maxChars } = field
        const err = errors[id]
        const opts = buildGroupedOptions(optionsForField(field, categories, values))

        if (type === FIELD_TYPES.section_header) {
          return (
            <div
              key={id}
              style={{
                marginBottom: 20,
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid var(--v2-gray-200)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--v2-primary)',
                }}
              >
                {label}
              </h3>
            </div>
          )
        }

        return (
          <div key={id} style={{ marginBottom: 20 }}>
            <FieldLabel label={label} required={required} tooltip={tooltip} />

            {type === FIELD_TYPES.tel && (
              <FormPhoneInput
                value={values[id] || ''}
                onChange={(v) => onChange(id, v)}
                required={required}
              />
            )}

            {(type === FIELD_TYPES.text
              || type === FIELD_TYPES.email
              || type === FIELD_TYPES.number
              || type === FIELD_TYPES.date) && (
              <input
                type={type === FIELD_TYPES.text ? 'text' : type}
                value={values[id] ?? ''}
                onChange={(e) => onChange(id, e.target.value)}
                placeholder={placeholder || ''}
                style={inputStyle}
              />
            )}

            {type === FIELD_TYPES.textarea && (
              <>
                <textarea
                  value={values[id] ?? ''}
                  onChange={(e) => onChange(id, e.target.value)}
                  placeholder={placeholder || ''}
                  maxLength={maxChars || undefined}
                  rows={4}
                  style={{
                    ...inputStyle,
                    minHeight: 100,
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
                {maxChars && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--v2-gray-400)',
                      textAlign: 'left',
                      marginTop: 4,
                    }}
                  >
                    {(values[id] || '').length}/{maxChars}
                  </div>
                )}
              </>
            )}

            {type === FIELD_TYPES.select && (
              <CustomSelect
                value={values[id] ?? ''}
                onChange={(v) => onChange(id, v)}
                options={opts.filter((o) => o.value != null)}
                placeholder={placeholder || 'בחר...'}
                style={{ width: '100%', minHeight: 48, borderRadius: 'var(--radius-sm)' }}
              />
            )}

            {type === FIELD_TYPES.multiselect && (
              <MultiSelect
                options={opts}
                value={Array.isArray(values[id]) ? values[id] : []}
                onChange={(v) => onChange(id, v)}
              />
            )}

            {(type === FIELD_TYPES.checkbox || type === FIELD_TYPES.toggle) && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(values[id])}
                  onChange={(e) => onChange(id, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#00C37A' }}
                />
                {placeholder || label}
              </label>
            )}

            {err && (
              <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                {err}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
