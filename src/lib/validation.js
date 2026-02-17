/**
 * Common validation utilities for form inputs and data
 * Provides comprehensive validation for all common input types
 */

import { AppError, ERROR_CATEGORY, ERROR_SEVERITY } from './errorHandler'

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

/**
 * Create a form validator with custom rules
 */
export const createFormValidator = (rules) => {
  return (data) => {
    const errors = {}

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = data[field]

      // If multiple rules provided for field
      if (Array.isArray(fieldRules)) {
        for (const rule of fieldRules) {
          const result = rule(value, field)
          if (!result.valid) {
            errors[field] = result.message
            break // Stop at first error for this field
          }
        }
      } else if (typeof fieldRules === 'function') {
        const result = fieldRules(value, field)
        if (!result.valid) {
          errors[field] = result.message
        }
      }
    })

    const isValid = Object.keys(errors).length === 0
    return { valid: isValid, errors, hasErrors: !isValid }
  }
}

/**
 * Common validation rules that can be composed
 */
export const rules = {
  required: (fieldName = 'Field') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { valid: false, message: `${fieldName} majburiy` }
    }
    return { valid: true }
  },

  email: (fieldName = 'Email') => (value) => {
    const result = validators.email(value)
    if (!result.valid) {
      return { valid: false, message: result.message }
    }
    return { valid: true }
  },

  minLength: (min, fieldName = 'Field') => (value) => {
    const result = validators.minLength(value, min, fieldName)
    if (!result.valid) {
      return { valid: false, message: result.message }
    }
    return { valid: true }
  },

  maxLength: (max, fieldName = 'Field') => (value) => {
    const result = validators.maxLength(value, max, fieldName)
    if (!result.valid) {
      return { valid: false, message: result.message }
    }
    return { valid: true }
  },

  pattern: (pattern, fieldName = 'Field') => (value) => {
    if (!pattern.test(String(value || ''))) {
      return { valid: false, message: `${fieldName} noto'g'ri format` }
    }
    return { valid: true }
  },

  custom: (validator, errorMessage) => (value) => {
    try {
      const result = validator(value)
      return result ? { valid: true } : { valid: false, message: errorMessage }
    } catch (error) {
      return { valid: false, message: errorMessage || 'Tekshiruv xatosi' }
    }
  },
}

/**
 * Async form validator for server-side checks
 */
export const createAsyncFormValidator = (rules) => {
  return async (data) => {
    const errors = {}

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field]

      if (Array.isArray(fieldRules)) {
        for (const rule of fieldRules) {
          const result = await Promise.resolve(rule(value, field))
          if (!result.valid) {
            errors[field] = result.message
            break
          }
        }
      } else if (typeof fieldRules === 'function') {
        const result = await Promise.resolve(fieldRules(value, field))
        if (!result.valid) {
          errors[field] = result.message
        }
      }
    }

    return { valid: Object.keys(errors).length === 0, errors }
  }
}

/**
 * Debounced validation for real-time field validation
 */
export const createDebouncedValidator = (validator, delayMs = 300) => {
  let timeoutId

  return (value) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const result = validator(value)
        resolve(result)
      }, delayMs)
    })
  }
}
