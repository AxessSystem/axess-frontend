// תעודת זהות — לון עם padding
export const validateIsraeliId = (id) => {
  const clean = String(id).replace(/\D/g, '').padStart(9, '0')
  if (clean.length !== 9 || isNaN(clean)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let step = Number(clean[i]) * ((i % 2) + 1)
    sum += step > 9 ? step - 9 : step
  }
  return sum % 10 === 0
}

export const validateIsraeliPhone = (phone) => {
  const clean = String(phone || '').replace(/\D/g, '')
  return /^0(5[0-9]|7[2-9])[0-9]{7}$/.test(clean)
}

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateName = (name) => {
  return name?.trim().length >= 2 && !/[0-9]/.test(name)
}

export const validateInstagram = (username) => {
  if (!username) return true
  const clean = username.replace('@', '')
  return /^[a-zA-Z0-9._]{1,30}$/.test(clean)
}

export const validateBirthDate = (birthDate, minAge) => {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  const today = new Date()
  const age =
    today.getFullYear()
    - birth.getFullYear()
    - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
  return age >= (minAge || 0)
}

export const getFieldError = (field, value, options = {}) => {
  switch (field) {
    case 'first_name':
    case 'last_name':
      if (!value?.trim()) return 'שדה חובה'
      if (!validateName(value)) return 'שם לא תקין — לפחות 2 תווים, ללא מספרים'
      return null
    case 'phone':
      if (!value?.trim()) return 'שדה חובה'
      if (!validateIsraeliPhone(value)) return 'מספר טלפון לא תקין (דוגמה: 050-1234567)'
      return null
    case 'email':
      if (options.required && !value?.trim()) return 'שדה חובה'
      if (value && !validateEmail(value)) return 'כתובת מייל לא תקינה'
      return null
    case 'id_number':
      if (!value?.trim()) return 'שדה חובה'
      if (!validateIsraeliId(value)) return 'מספר ת״ז לא תקין'
      return null
    case 'instagram':
      if (options.required && !value?.trim()) return 'שדה חובה'
      if (value && !validateInstagram(value)) return 'שם משתמש לא תקין (אותיות, מספרים, נקודה, קו תחתי, עד 30 תווים)'
      return null
    case 'birth_date':
      if (options.required && !value) return 'שדה חובה'
      if (value && options.minAge && !validateBirthDate(value, options.minAge))
        return `גיל מינימלי לאירוע זה הוא ${options.minAge}`
      return null
    default:
      if (options.required && !value?.toString().trim()) return 'שדה חובה'
      return null
  }
}
