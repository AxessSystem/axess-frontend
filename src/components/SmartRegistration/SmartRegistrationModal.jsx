import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import PhoneStep from './steps/PhoneStep'
import OTPStep from './steps/OTPStep'
import FieldsStep from './steps/FieldsStep'
import ConfirmStep from './steps/ConfirmStep'
import SuccessStep from './steps/SuccessStep'

function storageKey(citySlug) {
  return `muni_resident_${citySlug}`
}

function normalizePhoneInput(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('972') && d.length >= 11) return `0${d.slice(3)}`
  if (d.startsWith('5') && d.length === 9) return `0${d}`
  return d
}

export default function SmartRegistrationModal({
  open,
  onClose,
  citySlug,
  event,
  ticketTypes = [],
  externalUrl,
  apiBase = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app',
  cssVars = {},
}) {
  const flow = externalUrl ? 'external' : ticketTypes.length > 0 ? 'checkout' : 'redirect'

  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [recipient, setRecipient] = useState(null)

  const [ticketTypeId, setTicketTypeId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customFields, setCustomFields] = useState({})
  const [idNumber, setIdNumber] = useState('')
  const [pricingTier, setPricingTier] = useState('resident')

  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState('')

  const [pendingApproval, setPendingApproval] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [lastTotalAmount, setLastTotalAmount] = useState(0)

  useEffect(() => {
    if (!open) return
    const f = externalUrl ? 'external' : ticketTypes.length > 0 ? 'checkout' : 'redirect'
    setStep(f === 'redirect' ? 'redirect' : 'phone')
    setCode('')
    setSessionId(null)
    setRecipient(null)
    setTicketTypeId(ticketTypes[0]?.id ?? '')
    setQuantity(1)
    setCustomFields({})
    setIdNumber('')
    setPricingTier('resident')
    setSendingOtp(false)
    setVerifying(false)
    setSubmitting(false)
    setStepError('')
    setPendingApproval(false)
    setPaymentDone(false)
    setSuccessMessage('')
    setFatalError('')
    setLastTotalAmount(0)
    try {
      const raw = sessionStorage.getItem(storageKey(citySlug))
      if (raw) {
        const r = JSON.parse(raw)
        if (r?.phone) setPhone(String(r.phone))
      } else {
        setPhone('')
      }
    } catch {
      setPhone('')
    }
  }, [open, citySlug, externalUrl, ticketTypes])

  const persistResident = (phoneNorm, extra = {}) => {
    try {
      sessionStorage.setItem(storageKey(citySlug), JSON.stringify({ phone: phoneNorm, verifiedAt: Date.now(), ...extra }))
    } catch {
      /* ignore */
    }
  }

  const sendOtp = async () => {
    const norm = normalizePhoneInput(phone)
    if (!/^05\d{8}$/.test(norm)) {
      setStepError('נא להזין מספר נייד ישראלי תקין (05XXXXXXXX)')
      return
    }
    setStepError('')
    setSendingOtp(true)
    try {
      const r = await fetch(`${apiBase}/api/portal/${encodeURIComponent(citySlug)}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (r.status === 429 && data.retry_after_sec) {
          throw new Error(`נא להמתין ${data.retry_after_sec} שניות לפני שליחה חוזרת`)
        }
        throw new Error(data.error || 'שליחת הקוד נכשלה')
      }
      setPhone(norm)
      if (data.dev_code) toast.success(`[פיתוח] קוד: ${data.dev_code}`)
      else toast.success(data.sms === false ? 'הקוד נוצר (SMS לא אומת)' : 'נשלח קוד אימות')
      setStep('otp')
      setCode('')
    } catch (e) {
      setStepError(e.message || 'שגיאה')
    } finally {
      setSendingOtp(false)
    }
  }

  const verifyOtp = async () => {
    const norm = normalizePhoneInput(phone)
    setStepError('')
    setVerifying(true)
    try {
      const r = await fetch(`${apiBase}/api/portal/${encodeURIComponent(citySlug)}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm, code: code.replace(/\D/g, '') }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'קוד שגוי או פג תוקף')
      setSessionId(data.session_id)
      setRecipient(data.recipient || null)
      persistResident(norm, { session_id: data.session_id })
      toast.success('המספר אומת')
      if (flow === 'external') setStep('confirm')
      else if (flow === 'checkout') setStep('fields')
    } catch (e) {
      setStepError(e.message || 'שגיאה')
    } finally {
      setVerifying(false)
    }
  }

  const validateFields = () => {
    if (!ticketTypeId) {
      toast.error('נא לבחור סוג כניסה')
      return false
    }
    const regFields = Array.isArray(event?.registration_fields) ? event.registration_fields : []
    for (const f of regFields) {
      if (f.required && !(customFields[f.id] || '').toString().trim()) {
        toast.error(`נא למלא: ${f.label}`)
        return false
      }
    }
    if (event?.requires_id && idNumber.replace(/\D/g, '').length !== 9) {
      toast.error('נא להזין תעודת זהות בת 9 ספרות')
      return false
    }
    return true
  }

  const fieldsNext = () => {
    if (!validateFields()) return
    setStep('confirm')
  }

  const mergeCustomFields = () => {
    const out = { ...customFields }
    if (event?.requires_id && idNumber) out.id_number = idNumber.replace(/\D/g, '')
    return out
  }

  const buyerDisplayName = () => {
    const fn = customFields.first_name || recipient?.first_name || ''
    const ln = customFields.last_name || recipient?.last_name || ''
    const composed = [fn, ln].filter(Boolean).join(' ').trim()
    return composed || 'לקוח'
  }

  const submitRegister = async () => {
    if (!sessionId || !event?.id) {
      setStepError('חסר סשן או אירוע')
      return
    }
    setStepError('')
    setSubmitting(true)
    try {
      const body = {
        session_id: sessionId,
        event_id: event.id,
        ticket_type_id: ticketTypeId,
        quantity,
        custom_fields: mergeCustomFields(),
        buyer_name: buyerDisplayName(),
      }
      if (event?.city_code) body.pricing_tier = pricingTier

      const r = await fetch(`${apiBase}/api/portal/${encodeURIComponent(citySlug)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (data.error === 'missing_required_field') throw new Error(`נא למלא: ${data.field_label || 'שדה חובה'}`)
        if (data.error === 'id_number_required') throw new Error(data.message || 'נדרשת תעודת זהות')
        throw new Error(data.error || data.message || 'ההרשמה נכשלה')
      }

      if (data.status === 'pending_approval') {
        setLastTotalAmount(Number(data.total_amount) || 0)
        setPendingApproval(true)
        setStep('success')
        return
      }

      const slug = event.slug || data.event_slug
      setLastTotalAmount(Number(data.total_amount) || 0)

      if (data.total_amount === 0 || data.client_secret === 'free_order') {
        const conf = await fetch(`${apiBase}/e/${encodeURIComponent(slug)}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id }),
        })
        const confData = await conf.json().catch(() => ({}))
        if (!conf.ok) throw new Error(confData.error || 'אישור הזמנה נכשל')
        setPaymentDone(true)
        setStep('success')
        toast.success('נרשמתם בהצלחה!')
        return
      }

      if (data.client_secret) {
        const { loadStripe } = await import('@stripe/stripe-js')
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK || '')
        if (!stripe) throw new Error('תשלום לא זמין (Stripe)')

        const name = buyerDisplayName()
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: { billing_details: { name, phone: normalizePhoneInput(phone) } },
        })
        if (error) throw new Error(error.message || 'תשלום נכשל')

        const conf = await fetch(`${apiBase}/e/${encodeURIComponent(slug)}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id, payment_intent_id: paymentIntent?.id }),
        })
        const confData = await conf.json().catch(() => ({}))
        if (!conf.ok) throw new Error(confData.error || 'אישור תשלום נכשל')
        setPaymentDone(true)
        setStep('success')
        toast.success('התשלום וההרשמה הושלמו')
        return
      }

      throw new Error('לא התקבל אמצעי תשלום')
    } catch (e) {
      setFatalError(e.message || 'שגיאה')
      setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

  const submitExternal = async () => {
    if (!externalUrl) return
    setStepError('')
    setSubmitting(true)
    try {
      const r = await fetch(`${apiBase}/api/portal/${encodeURIComponent(citySlug)}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          external_url: externalUrl,
          external_platform: 'portal',
          phone: normalizePhoneInput(phone),
          sub_account_id: event.sub_account_id || null,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'מעקב נכשל')
      if (data.redirect_url) window.location.href = data.redirect_url
      else throw new Error('לא התקבל קישור מעקב')
    } catch (e) {
      setStepError(e.message || 'שגיאה')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const title =
    flow === 'redirect' ? 'הרשמה לאירוע' : flow === 'external' ? 'הרשמה (אתר חיצוני)' : 'הרשמה ורכישה'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sr-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 0,
      }}
    >
      <div
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: '20px 20px 0 0',
          padding: 24,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          ...cssVars,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id="sr-modal-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="סגור" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 8 }}>
            <X size={28} />
          </button>
        </div>

        {flow === 'redirect' && (
          <div style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
            <p>ההרשמה והתשלום המאובטחים מתבצעים בדף ייעודי במערכת.</p>
            <Link
              to={`/e/${event.slug}`}
              className="muni-event-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', width: '100%', marginTop: 20 }}
              onClick={onClose}
            >
              פתח דף הרשמה
            </Link>
          </div>
        )}

        {flow !== 'redirect' && step === 'phone' && (
          <PhoneStep phone={phone} onPhoneChange={setPhone} onSubmit={sendOtp} sending={sendingOtp} error={stepError} />
        )}

        {flow !== 'redirect' && step === 'otp' && (
          <OTPStep
            phone={phone}
            code={code}
            onCodeChange={setCode}
            onVerify={verifyOtp}
            onBack={() => {
              setStep('phone')
              setStepError('')
              setCode('')
            }}
            verifying={verifying}
            error={stepError}
          />
        )}

        {flow === 'checkout' && step === 'fields' && (
          <FieldsStep
            event={event}
            ticketTypes={ticketTypes}
            ticketTypeId={ticketTypeId}
            quantity={quantity}
            onTicketChange={setTicketTypeId}
            onQuantityChange={setQuantity}
            customFields={customFields}
            onCustomFieldChange={(id, v) => setCustomFields((prev) => ({ ...prev, [id]: v }))}
            idNumber={idNumber}
            onIdNumberChange={setIdNumber}
            pricingTier={pricingTier}
            onPricingTierChange={setPricingTier}
            onNext={fieldsNext}
            disabled={false}
          />
        )}

        {flow === 'checkout' && step === 'confirm' && (
          <ConfirmStep
            externalMode={false}
            event={event}
            ticketTypes={ticketTypes}
            ticketTypeId={ticketTypeId}
            quantity={quantity}
            customFields={customFields}
            idNumber={idNumber}
            pricingTier={pricingTier}
            phone={phone}
            loading={submitting}
            error={stepError}
            onSubmit={submitRegister}
            onBack={() => {
              setStep('fields')
              setStepError('')
            }}
          />
        )}

        {flow === 'external' && step === 'confirm' && (
          <ConfirmStep
            externalMode
            event={event}
            ticketTypes={ticketTypes}
            ticketTypeId={ticketTypeId}
            quantity={quantity}
            customFields={customFields}
            idNumber={idNumber}
            pricingTier={pricingTier}
            phone={phone}
            loading={submitting}
            error={stepError}
            onSubmit={submitExternal}
            onBack={() => {
              setStep('otp')
              setStepError('')
            }}
          />
        )}

        {flow !== 'redirect' && step === 'success' && (
          <SuccessStep
            pendingApproval={pendingApproval}
            paymentDone={paymentDone}
            totalAmount={lastTotalAmount}
            eventSlug={event?.slug}
            citySlug={citySlug}
            message={successMessage}
            error={fatalError}
          />
        )}
      </div>
    </div>
  )
}
