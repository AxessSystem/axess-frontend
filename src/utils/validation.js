// אימות טלפון ישראלי
export const validateIsraeliPhone = (phone) => {
  const clean = phone.replace(/\D/g, '')
  return /^0(5[0-9]|7[2-9])[0-9]{7}$/.test(clean)
}

// אימות ת"ז ישראלית (אלגוריתם לון)
export const validateIsraeliId = (id) => {
  const clean = id.replace(/\D/g, '')
  if (clean.length !== 9) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let d = Number(clean[i]) * ((i % 2) + 1)
    if (d > 9) d -= 9
    sum += d
  }
  return sum % 10 === 0
}

// אימות מייל
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// אימות תאריך לידה לפי גיל מינימלי
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

// אימות שם (לפחות 2 תווים, אותיות בלבד)
export const validateName = (name) => {
  return name?.trim().length >= 2
}
