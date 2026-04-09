import { useState } from 'react'
import DateTimePicker from './DateTimePicker'
import { getFieldError } from '@/utils/validation'

export default function FormDatePicker({ value, onChange, required, minAge, placeholder, submitError }) {
  const [touched, setTouched] = useState(false)
  const internalErr = touched ? getFieldError('birth_date', value, { required, minAge }) : null
  const error = submitError || internalErr
  const isValid = touched && !internalErr && !submitError && value

  return (
    <div style={{ marginBottom: 12, width: '100%', boxSizing: 'border-box' }}>
      <DateTimePicker
        value={value || ''}
        onChange={(val) => {
          onChange(val)
          setTouched(true)
        }}
        dateOnly={true}
        placeholder={placeholder || `תאריך לידה${required ? ' *' : ' (אופציונלי)'}`}
      />
      {error && (
        <p style={{ margin: '4px 4px 0', fontSize: 12, lineHeight: 1.4, color: '#ff4444', textAlign: 'right' }}>
          {error}
        </p>
      )}
      {isValid && (
        <p style={{ margin: '4px 4px 0', fontSize: 12, color: '#00C37A', textAlign: 'right' }}>
          ✓ תאריך תקין
        </p>
      )}
    </div>
  )
}
