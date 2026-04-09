import { useState } from 'react'
import { validateIsraeliPhone, getFieldError } from '@/utils/validation'
import FormField from './FormField'

export default function FormPhoneInput({ value, onChange, required, onBlurSideEffect }) {
  const [touched, setTouched] = useState(false)
  const error = touched ? getFieldError('phone', value, { required }) : null
  const isValid = touched && !error && validateIsraeliPhone(value || '')

  return (
    <FormField
      type="tel"
      value={value || ''}
      onChange={(e) => onChange(e.target.value.replace(/[^\d\-\+\s]/g, ''))}
      onBlur={(e) => {
        setTouched(true)
        onBlurSideEffect?.(e.target.value.replace(/[^\d\-\+\s]/g, ''))
      }}
      placeholder={`טלפון נייד${required ? ' *' : ' (אופציונלי)'}`}
      error={error}
      isValid={isValid}
      required={required}
      inputMode="numeric"
    />
  )
}
