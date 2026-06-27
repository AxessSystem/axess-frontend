export const FIELD_TYPES = {
  text: 'text',
  textarea: 'textarea',
  tel: 'tel',
  email: 'email',
  number: 'number',
  date: 'date',
  select: 'select',
  multiselect: 'multiselect',
  checkbox: 'checkbox',
  toggle: 'toggle',
  section_header: 'section_header',
}

export const CONDITION_OPERATORS = [
  { value: 'equals', label: 'שווה ל' },
  { value: 'contains', label: 'מכיל' },
  { value: 'not_equals', label: 'לא שווה ל' },
  { value: 'not_empty', label: 'לא ריק' },
]

const ROLE_MAP = {
  'ספק / נותן שירות בתעשיית האירועים': ['supplier'],
  'מזמין מקצועי (חברה / ארגון / מוסד)': ['buyer_corporate'],
  'מפיק — גם ספק וגם מזמין': ['supplier', 'buyer_corporate'],
  'מתכנן/ת אירוע פרטי': ['buyer_private'],
  'מתעניין/ת — המסיבה והאירוע': ['party'],
}

const SUPPLIER_ROLE_VALUES = new Set([
  'ספק / נותן שירות בתעשיית האירועים',
  'מפיק — גם ספק וגם מזמין',
])

const BUYER_CORP_ROLE_VALUES = new Set([
  'מזמין מקצועי (חברה / ארגון / מוסד)',
  'מפיק — גם ספק וגם מזמין',
])

const BUYER_PRIVATE_ROLE_VALUES = new Set(['מתכנן/ת אירוע פרטי'])

export function getMappedRoles(hebrewRoles) {
  const roles = new Set()
  for (const r of hebrewRoles || []) {
    for (const mapped of ROLE_MAP[r] || []) roles.add(mapped)
  }
  return [...roles]
}

export function normalizeFieldOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((opt) => {
    if (typeof opt === 'string') return { value: opt, label: opt }
    if (opt?.group) return { group: opt.group }
    return {
      value: opt.value ?? opt.label ?? '',
      label: opt.label ?? opt.value ?? '',
      group: opt.group,
    }
  })
}

export function normalizeField(field) {
  if (!field || typeof field !== 'object') return field
  return {
    ...field,
    options: field.options ? normalizeFieldOptions(field.options) : undefined,
  }
}

export function normalizeFields(fields) {
  return (Array.isArray(fields) ? fields : []).map(normalizeField)
}

export function evaluateConditions(field, formValues) {
  if (!field.conditions || field.conditions.length === 0) return true

  const op = field.conditions_operator || 'AND'
  const results = field.conditions.map((condition) => {
    const val = formValues[condition.field]
    switch (condition.operator) {
      case 'equals':
        return val === condition.value
      case 'not_equals':
        return val !== condition.value
      case 'contains':
        return Array.isArray(val)
          ? val.includes(condition.value)
          : String(val || '').includes(condition.value)
      case 'not_empty':
        return Array.isArray(val) ? val.length > 0 : Boolean(val)
      default:
        return true
    }
  })

  return op === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

export function getVisibleFields(fields, formValues) {
  return (fields || []).filter((f) => evaluateConditions(f, formValues))
}

export function inferWizardStep(field) {
  const conds = field.conditions || []
  const roleConds = conds.filter(
    (c) => c.field === 'participant_roles' && c.operator === 'contains',
  )
  if (!roleConds.length) return 'identification'

  const values = roleConds.map((c) => c.value)
  if (values.some((v) => SUPPLIER_ROLE_VALUES.has(v))) return 'supplier'
  if (values.some((v) => BUYER_CORP_ROLE_VALUES.has(v))) return 'buyer_corporate'
  if (values.some((v) => BUYER_PRIVATE_ROLE_VALUES.has(v))) return 'buyer_private'
  return 'identification'
}

export function groupFieldsByWizardStep(fields) {
  const groups = {
    identification: [],
    supplier: [],
    buyer_corporate: [],
    buyer_private: [],
  }
  for (const raw of fields || []) {
    const f = normalizeField(raw)
    if (f.type === FIELD_TYPES.section_header) {
      const step = inferWizardStep(f)
      groups[step].push(f)
      continue
    }
    groups[inferWizardStep(f)].push(f)
  }
  return groups
}

export function buildIndustryWizardSteps(fields, formValues) {
  const grouped = groupFieldsByWizardStep(fields)
  const roles = getMappedRoles(formValues.participant_roles || [])
  const steps = [{ key: 'identification', label: 'זיהוי' }]

  if (roles.includes('supplier') && grouped.supplier.length > 0) {
    steps.push({ key: 'supplier', label: 'פרטי ספק' })
  }
  if (roles.includes('buyer_corporate') && grouped.buyer_corporate.length > 0) {
    steps.push({ key: 'buyer_corporate', label: 'פרטי מזמין' })
  }
  if (roles.includes('buyer_private') && grouped.buyer_private.length > 0) {
    steps.push({ key: 'buyer_private', label: 'אירוע פרטי' })
  }
  steps.push({ key: 'confirm', label: 'אישור' })
  return steps
}

export function getFieldsForWizardStep(fields, stepKey) {
  if (stepKey === 'confirm') return []
  const grouped = groupFieldsByWizardStep(fields)
  return grouped[stepKey] || []
}

export function buildInitialFormValues(fields) {
  const values = {}
  for (const raw of fields || []) {
    const f = normalizeField(raw)
    if (f.default !== undefined) values[f.id] = f.default
    else if (f.type === FIELD_TYPES.multiselect) values[f.id] = []
    else if (f.type === FIELD_TYPES.checkbox || f.type === FIELD_TYPES.toggle) values[f.id] = false
    else values[f.id] = ''
  }
  return values
}

export function validateRequiredFields(fields, formValues) {
  const errors = {}
  const visible = getVisibleFields(fields, formValues)
  for (const f of visible) {
    if (f.type === FIELD_TYPES.section_header) continue
    if (!f.required) continue
    const val = formValues[f.id]
    if (f.type === FIELD_TYPES.multiselect) {
      if (!Array.isArray(val) || val.length === 0) errors[f.id] = 'שדה חובה'
    } else if (f.type === FIELD_TYPES.checkbox || f.type === FIELD_TYPES.toggle) {
      if (!val) errors[f.id] = 'שדה חובה'
    } else if (val === undefined || val === null || String(val).trim() === '') {
      errors[f.id] = 'שדה חובה'
    }
  }
  return errors
}

export function fieldTypeLabel(type) {
  const labels = {
    text: 'טקסט',
    textarea: 'טקסט ארוך',
    tel: 'טלפון',
    email: 'מייל',
    number: 'מספר',
    date: 'תאריך',
    select: 'בחירה',
    multiselect: 'בחירה מרובה',
    checkbox: 'תיבת סימון',
    toggle: 'מתג',
    section_header: 'כותרת סקשן',
  }
  return labels[type] || type
}
