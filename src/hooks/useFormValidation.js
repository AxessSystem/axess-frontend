import { useState, useCallback } from 'react'
import { getFieldError } from '@/utils/validation'

export default function useFormValidation() {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleBlur = useCallback((field, value, options = {}) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = getFieldError(field, value, options)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const handleChange = useCallback((field, value, options = {}) => {
    setErrors((prev) => {
      if (!prev[field] && !touched[field]) return prev
      return { ...prev, [field]: getFieldError(field, value, options) }
    })
  }, [touched])

  const validateAll = useCallback((fields) => {
    const newErrors = {}
    const newTouched = {}
    fields.forEach(({ field, value, ...opts }) => {
      newTouched[field] = true
      const error = getFieldError(field, value, opts)
      if (error) newErrors[field] = error
    })
    setTouched((prev) => ({ ...prev, ...newTouched }))
    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }, [])

  const isFieldValid = useCallback((field, value) => {
    return touched[field] && !errors[field] && value?.toString().trim().length > 0
  }, [touched, errors])

  const reset = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return { errors, touched, handleBlur, handleChange, validateAll, isFieldValid, reset }
}
