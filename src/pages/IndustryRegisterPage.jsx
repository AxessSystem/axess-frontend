import { useEffect, useMemo, useState } from 'react'
import StepIndicator from '@/components/ui/StepIndicator'
import DynamicRegistrationForm from '@/components/DynamicRegistrationForm'
import {
  buildIndustryWizardSteps,
  buildInitialFormValues,
  getFieldsForWizardStep,
  getVisibleFields,
  normalizeField,
  normalizeFieldOptions,
  normalizeFields,
  validateRequiredFields,
} from '@/lib/formSchema'
import { validateIsraeliPhone } from '@/utils/validation'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'
const INDUSTRY_EVENT_SLUG = 'industry-il-2027'

function labelOfField(field, value) {
  const f = normalizeField(field)
  if (f.type === 'multiselect' && Array.isArray(value)) {
    const opts = normalizeFieldOptions(f.options)
    return value.map((v) => opts.find((o) => o.value === v)?.label || v).join(', ') || '—'
  }
  if (f.type === 'select') {
    const opts = normalizeFieldOptions(f.options)
    return opts.find((o) => o.value === value)?.label || value || '—'
  }
  if (f.type === 'checkbox' || f.type === 'toggle') return value ? 'כן' : 'לא'
  return value != null && String(value).trim() !== '' ? String(value) : '—'
}

export default function IndustryRegisterPage() {
  const [registrationFields, setRegistrationFields] = useState([])
  const [categories, setCategories] = useState({ l1: [], l2: {} })
  const [formValues, setFormValues] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [eventTitle, setEventTitle] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/e/${INDUSTRY_EVENT_SLUG}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('event')))),
      fetch(`${API_BASE}/api/industry/categories`).then((r) => (r.ok ? r.json() : { l1: [], l2: {} })),
    ])
      .then(([event, cats]) => {
        const fields = normalizeFields(event.registration_fields || [])
        setRegistrationFields(fields)
        setEventTitle(event.title || '')
        setCategories({ l1: cats.l1 || [], l2: cats.l2 || {} })
        setFormValues(buildInitialFormValues(fields))
      })
      .catch(() => setLoadError('שגיאה בטעינת טופס ההרשמה'))
      .finally(() => setLoading(false))
  }, [])

  const wizardSteps = useMemo(
    () => buildIndustryWizardSteps(registrationFields, formValues),
    [registrationFields, formValues],
  )

  const stepMeta = wizardSteps[currentStep - 1]
  const stepKey = stepMeta?.key || 'identification'

  const stepFields = useMemo(() => {
    if (stepKey === 'confirm') return []
    return getFieldsForWizardStep(registrationFields, stepKey)
  }, [registrationFields, stepKey])

  useEffect(() => {
    if (currentStep > wizardSteps.length) setCurrentStep(wizardSteps.length)
  }, [wizardSteps.length, currentStep])

  const handleChange = (id, val) => {
    setFormValues((prev) => ({ ...prev, [id]: val }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const validateCurrentStep = () => {
    const e = { ...validateRequiredFields(stepFields, formValues) }
    if (stepKey === 'identification' && formValues.phone && !validateIsraeliPhone(formValues.phone)) {
      e.phone = 'מספר טלפון לא תקין'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildPayload = () => {
    const payload = { ...formValues }
    if (payload.phone) payload.phone = String(payload.phone).replace(/\D/g, '')
    if (payload.first_name) payload.first_name = String(payload.first_name).trim()
    if (payload.last_name) payload.last_name = payload.last_name ? String(payload.last_name).trim() : null

    const interests = payload.employment_interests || payload.employment_interest
    if (Array.isArray(interests)) {
      payload.employment_interests = interests
      if (interests.includes('seeking_work')) {
        payload.employment_interest = 'כן — מחפש עבודה / פרויקטים'
      } else if (interests.includes('hiring')) {
        payload.employment_interest = 'כן — מגייס'
      }
    }

    return payload
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${API_BASE}/api/industry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה בהרשמה')
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'שגיאה בהרשמה, נסו שוב')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => {
    if (stepKey !== 'confirm' && !validateCurrentStep()) return
    if (stepKey === 'confirm') {
      handleSubmit()
      return
    }
    setCurrentStep((s) => Math.min(s + 1, wizardSteps.length))
  }

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const wantsBooth = Array.isArray(formValues.supplier_goals)
    ? formValues.supplier_goals.includes('wants_booth')
    : false

  const summaryFields = useMemo(
    () => getVisibleFields(registrationFields, formValues).filter((f) => f.type !== 'section_header'),
    [registrationFields, formValues],
  )

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v2-gray-400)' }}>
        טוען...
      </div>
    )
  }

  if (loadError) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', padding: 16 }}>
        {loadError}
      </div>
    )
  }

  if (success) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', fontFamily: "'DM Sans', sans-serif", padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'var(--v2-dark-3)', border: '1px solid var(--v2-gray-200)', borderRadius: 'var(--radius-md)', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>ברוך הבא לרשת!</h1>
          <p style={{ fontSize: 16, color: 'var(--v2-gray-400)', lineHeight: 1.7, margin: 0 }}>
            הפרופיל שלך נוצר. נעדכן אותך כשיהיו חיבורים רלוונטיים.
          </p>
          {wantsBooth && (
            <p style={{ fontSize: 15, color: 'var(--v2-primary)', marginTop: 16, lineHeight: 1.6 }}>
              קיבלנו את הבקשה שלך לביתן — נציג יצור איתך קשר בקרוב.
            </p>
          )}
        </div>
      </div>
    )
  }

  const stepLabels = wizardSteps.map((s) => s.label)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--v2-dark)', fontFamily: "'DM Sans', sans-serif", padding: '16px 16px 32px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <StepIndicator steps={stepLabels} currentStep={currentStep} />
        </div>

        <div style={{ background: 'var(--v2-dark-3)', border: '1px solid var(--v2-gray-200)', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-md)' }}>
          {stepKey === 'identification' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>
                {eventTitle || 'תעשיית האירועים של ישראל — מתכנסת למקום אחד'}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--v2-gray-400)', margin: '0 0 24px', lineHeight: 1.6 }}>
                ספקים. מזמינים. אמנים. מקומות. מפיקים. יחד — בפעם הראשונה.
              </p>
            </>
          )}

          {stepKey !== 'confirm' ? (
            <DynamicRegistrationForm
              fields={stepFields}
              values={formValues}
              onChange={handleChange}
              errors={errors}
              categories={categories}
            />
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>אישור ושליחה</h2>
              {summaryFields.map((f) => {
                const val = labelOfField(f, formValues[f.id])
                if (val === '—') return null
                return (
                  <div key={f.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{val}</div>
                  </div>
                )
              })}
              {submitError && (
                <p style={{ color: '#EF4444', fontSize: 14, marginTop: 16, textAlign: 'center' }}>{submitError}</p>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goPrev}
                style={{ flex: 1, height: 52, background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
              >
                הקודם
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={submitting && stepKey === 'confirm'}
              style={{
                flex: 1,
                height: 52,
                background: submitting && stepKey === 'confirm' ? 'var(--v2-gray-600)' : '#00C37A',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 16,
                fontWeight: 700,
                cursor: submitting && stepKey === 'confirm' ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-glow-green)',
              }}
            >
              {stepKey === 'confirm' ? (submitting ? 'שולח...' : 'סיים הרשמה') : 'המשך'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
