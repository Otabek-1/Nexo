/**
 * Common validation utilities for form inputs and data
 */

export const validators = {
  // Email validation
  email: (value) => {
    const email = String(value || '').trim()
    if (!email) return { valid: false, message: 'Email maydoni majburiy' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Noto\'g\'ri email formati' }
    }
    return { valid: true }
  },

  // Required text field
  required: (value, fieldName = 'Maydoni') => {
    const text = String(value || '').trim()
    if (!text) return { valid: false, message: `${fieldName} majburiy` }
    return { valid: true }
  },

  // Min length
  minLength: (value, min, fieldName = 'Maydoni') => {
    const text = String(value || '')
    if (text.length < min) {
      return { valid: false, message: `${fieldName} kamida ${min} ta belgidan iborat bo'lishi kerak` }
    }
    return { valid: true }
  },

  // Max length
  maxLength: (value, max, fieldName = 'Maydoni') => {
    const text = String(value || '')
    if (text.length > max) {
      return { valid: false, message: `${fieldName} ${max} ta belgidan ko'p bo'lmasligi kerak` }
    }
    return { valid: true }
  },

  // Number range
  numberRange: (value, min, max, fieldName = 'Raqam') => {
    const num = Number(value)
    if (!Number.isFinite(num)) {
      return { valid: false, message: `${fieldName} raqam bo'lishi kerak` }
    }
    if (num < min || num > max) {
      return { valid: false, message: `${fieldName} ${min} dan ${max} gacha bo'lishi kerak` }
    }
    return { valid: true }
  },

  // URL validation
  url: (value) => {
    try {
      new URL(String(value))
      return { valid: true }
    } catch {
      return { valid: false, message: 'Noto\'g\'ri URL' }
    }
  },

  // Date validation
  futureDate: (value) => {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Noto\'g\'ri sana formati' }
    }
    if (date <= new Date()) {
      return { valid: false, message: 'Sana bugundan keyingi bo\'lishi kerak' }
    }
    return { valid: true }
  },

  // Phone number (basic)
  phone: (value) => {
    const phone = String(value || '').replace(/\D/g, '')
    if (phone.length < 9) {
      return { valid: false, message: 'Noto\'g\'ri telefon raqami' }
    }
    return { valid: true }
  }
}

// Compose multiple validators
export const compose = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.valid) return result
    }
    return { valid: true }
  }
}

// Sanitize string input
export const sanitizeInput = (input) => {
  return String(input || '')
    .trim()
    .substring(0, 10000) // Prevent extremely long inputs
    .replace(/[<>]/g, '') // Remove angle brackets
}

// Escape HTML special characters
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text || '').replace(/[&<>"']/g, char => map[char])
}

// Validate test data
export const validateTestData = (data) => {
  const errors = {}

  if (!data.title || !data.title.trim()) {
    errors.title = 'Test nomi majburiy'
  }

  const startTime = new Date(data.startTime).getTime()
  const endTime = new Date(data.endTime).getTime()

  if (!Number.isFinite(startTime)) {
    errors.startTime = 'Noto\'g\'ri boshlanish vaqti'
  }

  if (!Number.isFinite(endTime)) {
    errors.endTime = 'Noto\'g\'ri tugash vaqti'
  }

  if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime <= startTime) {
    errors.endTime = 'Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak'
  }

  const duration = Number(data.duration)
  if (!Number.isFinite(duration) || duration < 1) {
    errors.duration = 'Test vaqti 1 daqiqadan kam bo\'lmasligi kerak'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
