/**
 * Custom error types
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, code, 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTH_ERROR') {
    super(message, code, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, code, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, code, 404)
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error', code = 'NETWORK_ERROR') {
    super(message, code, 0)
    this.name = 'NetworkError'
  }
}

/**
 * Error message helpers
 */
export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Noma\'lum xatolik yuz berdi'
}

export const getErrorCode = (error) => {
  if (error instanceof AppError) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}

/**
 * Error logger (prepare for backend logging)
 */
export const logError = (error, context = {}) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: getErrorMessage(error),
    code: getErrorCode(error),
    context,
    stack: error?.stack
  }

  // TODO: Send to backend logging service when available
  console.error('[ERROR]', errorData)
  
  return errorData
}

/**
 * Handle API response errors
 */
export const handleApiError = (error) => {
  if (error instanceof AppError) {
    return error
  }

  if (error?.response?.status) {
    const status = error.response.status
    const message = error.response.data?.message || 'API xatoligi'
    const code = error.response.data?.code || 'API_ERROR'

    if (status === 401) {
      return new AuthenticationError(message, code)
    }
    if (status === 403) {
      return new AuthorizationError(message, code)
    }
    if (status === 404) {
      return new NotFoundError(message, code)
    }
    if (status >= 400 && status < 500) {
      return new ValidationError(message, code)
    }
    
    return new AppError(message, code, status)
  }

  if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
    return new NetworkError('Tarmoq aloqasi xatosi')
  }

  return new AppError(getErrorMessage(error))
}
