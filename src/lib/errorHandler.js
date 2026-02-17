/**
 * Error Handler Module
 * Provides centralized error handling, logging, and user-friendly messages
 */

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

/**
 * Error categories
 */
export const ERROR_CATEGORY = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  SERVER_ERROR: 'server_error',
  NETWORK: 'network',
  STORAGE: 'storage',
  UNKNOWN: 'unknown',
}

/**
 * Custom App Error class
 */
export class AppError extends Error {
  constructor(message, category = ERROR_CATEGORY.UNKNOWN, options = {}) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.severity = options.severity || ERROR_SEVERITY.MEDIUM
    this.code = options.code
    this.details = options.details || {}
    this.timestamp = new Date().toISOString()
    this.userMessage = options.userMessage || message
    this.isUserFacing = options.isUserFacing !== false
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      userMessage: this.userMessage,
    }
  }
}

/**
 * Error logger
 */
class ErrorLogger {
  logs = []
  maxLogs = 100

  log(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error instanceof AppError ? error.toJSON() : { message: String(error) },
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    }

    this.logs.push(logEntry)

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Always log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorLogger]', logEntry)
    }

    return logEntry
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const errorLogger = new ErrorLogger()

/**
 * Error recovery strategies
 */
export const recoverError = (error) => {
  if (error.category === ERROR_CATEGORY.NETWORK) {
    return {
      action: 'retry',
      delay: 2000,
      maxAttempts: 3,
    }
  }

  if (error.category === ERROR_CATEGORY.AUTHENTICATION) {
    return {
      action: 'redirect',
      target: '/auth',
    }
  }

  if (error.category === ERROR_CATEGORY.STORAGE) {
    return {
      action: 'fallback',
      fallbackStrategy: 'memory',
    }
  }

  return {
    action: 'show_message',
  }
}

/**
 * User-friendly error messages in Uzbek and English
 */
export const ERROR_MESSAGES = {
  VALIDATION: {
    UZ: 'Ma\'lumotlar noto\'g\'ri. Iltimos, qayta tekshirib ko\'ring.',
    EN: 'Invalid data. Please check and try again.',
  },
  AUTHENTICATION: {
    UZ: 'Kirishda xatolik. Elektron pochtangiz va parolni tekshiring.',
    EN: 'Authentication failed. Please check your email and password.',
  },
  AUTHORIZATION: {
    UZ: 'Sizda bu amalni bajarishga ruxsat yo\'q.',
    EN: 'You do not have permission to perform this action.',
  },
  NOT_FOUND: {
    UZ: 'Talab qilingan resurs topilmadi.',
    EN: 'The requested resource was not found.',
  },
  CONFLICT: {
    UZ: 'Ma\'lumot mos kelmadi. Iltimos, qayta urinib ko\'ring.',
    EN: 'Data conflict. Please try again.',
  },
  SERVER_ERROR: {
    UZ: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.',
    EN: 'Server error. Please try again later.',
  },
  NETWORK: {
    UZ: 'Tarmoq aloqasi yo\'q. Internetni tekshiring.',
    EN: 'Network connection lost. Please check your internet.',
  },
  STORAGE: {
    UZ: 'Saqlash xatosi. Brauzer xotirasi to\'lgan bo\'lishi mumkin.',
    EN: 'Storage error. Browser storage might be full.',
  },
  UNKNOWN: {
    UZ: 'Noma\'lum xatolik yuz berdi.',
    EN: 'An unknown error occurred.',
  },
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error, language = 'UZ') => {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage
  }

  const messageKey = error.category || ERROR_CATEGORY.UNKNOWN
  const messages = ERROR_MESSAGES[messageKey.toUpperCase()] || ERROR_MESSAGES.UNKNOWN

  return messages[language] || messages.EN
}

/**
 * Validate and normalize error
 */
export const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ERROR_CATEGORY.UNKNOWN,
      {
        severity: ERROR_SEVERITY.MEDIUM,
        userMessage: 'Something went wrong. Please try again.',
      }
    )
  }

  if (typeof error === 'string') {
    return new AppError(
      error,
      ERROR_CATEGORY.UNKNOWN,
      {
        severity: ERROR_SEVERITY.MEDIUM,
      }
    )
  }

  return new AppError(
    'An unexpected error occurred',
    ERROR_CATEGORY.UNKNOWN,
    {
      severity: ERROR_SEVERITY.HIGH,
      details: error,
    }
  )
}

/**
 * Error handler hook for React components
 */
export const handleError = (error, options = {}) => {
  const normalized = normalizeError(error)

  errorLogger.log(normalized, options.context)

  const recovery = recoverError(normalized)
  const userMessage = getUserFriendlyMessage(normalized, options.language || 'UZ')

  return {
    error: normalized,
    recovery,
    userMessage,
    isUserFacing: normalized.isUserFacing,
  }
}

/**
 * Async error wrapper
 */
export const withErrorHandling = (asyncFn, defaultValue = null) => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      handleError(error, { context: { function: asyncFn.name, args } })
      return defaultValue
    }
  }
}

/**
 * Validation error helper
 */
export const createValidationError = (fields) => {
  return new AppError(
    'Validation failed',
    ERROR_CATEGORY.VALIDATION,
    {
      severity: ERROR_SEVERITY.LOW,
      details: { fields },
      userMessage: 'Please check the highlighted fields and try again.',
    }
  )
}
