/**
 * Email validation
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Password validation
 * - At least 6 characters
 * - At least one letter
 * - At least one number
 */
export const validatePassword = (password) => {
  if (password.length < 6) return { valid: false, error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' }
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Parol kamida bitta harfni o\'z ichiga olishi kerak' }
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Parol kamida bitta raqamni o\'z ichiga olishi kerak' }
  return { valid: true }
}

/**
 * Full name validation
 */
export const validateFullName = (name) => {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { valid: false, error: 'Ism kamida 2 ta harfdan iborat bo\'lishi kerak' }
  if (trimmed.length > 100) return { valid: false, error: 'Ism 100 ta harfdan ko\'p bo\'la olmaydi' }
  return { valid: true }
}

/**
 * Phone validation (basic)
 */
export const validatePhone = (phone) => {
  const trimmed = phone.trim()
  if (!trimmed) return { valid: true } // Optional field
  if (!/^\+?[0-9\s-()]{7,}$/.test(trimmed)) return { valid: false, error: 'Telefon raqamini to\'g\'ri kiriting' }
  return { valid: true }
}

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate test data
 */
export const validateTestData = (testData) => {
  const { title, startTime, endTime, duration } = testData
  
  if (!title?.trim()) {
    return { valid: false, error: 'Imtihon nomi majburiy' }
  }
  
  if (!startTime || !endTime) {
    return { valid: false, error: 'Boshlanish va tugash vaqti majburiy' }
  }

  const startMs = new Date(startTime).getTime()
  const endMs = new Date(endTime).getTime()
  
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return { valid: false, error: 'Vaqt formati noto\'g\'ri' }
  }
  
  if (endMs <= startMs) {
    return { valid: false, error: 'Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak' }
  }

  const durationNum = Number(duration)
  if (!Number.isFinite(durationNum) || durationNum < 1) {
    return { valid: false, error: 'Imtihon davomiyligisi 1 daqiqadan kam bo\'la olmaydi' }
  }

  const availableMinutes = Math.floor((endMs - startMs) / (1000 * 60))
  if (durationNum > availableMinutes) {
    return { valid: false, error: 'Imtihon davomiyligisi vaqt oralig\'idan ko\'p' }
  }

  return { valid: true }
}

/**
 * Validate question
 */
export const validateQuestion = (question) => {
  if (!question.content?.trim()) {
    return { valid: false, error: 'Savol matni bo\'sh bo\'la olmaydi' }
  }

  if (question.type === 'multiple-choice') {
    const cleanedOptions = question.options.map(opt => String(opt || '').trim()).filter(Boolean)
    if (cleanedOptions.length < 2) {
      return { valid: false, error: 'Ko\'p variantli savolda kamida 2 ta variant bo\'lishi kerak' }
    }
    const answerIndex = Number(question.correctAnswer)
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= cleanedOptions.length) {
      return { valid: false, error: 'Togri javobni tanlang' }
    }
  }

  if (question.type === 'true-false') {
    if (!['true', 'false'].includes(String(question.correctAnswer))) {
      return { valid: false, error: 'True/False savol uchun togri javobni tanlang' }
    }
  }

  if (question.type === 'essay' || question.type === 'short-answer') {
    const points = Number(question.points)
    if (!Number.isFinite(points) || points < 1) {
      return { valid: false, error: 'Ball 1 dan kam bo\'la olmaydi' }
    }
  }

  return { valid: true }
}
