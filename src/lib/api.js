/**
 * Comprehensive API Client
 * Handles HTTP requests, retries, interceptors, and error handling
 */

import { envConfig } from './envConfig'
import { AppError, ERROR_CATEGORY, handleError } from './errorHandler'

/**
 * API client configuration
 */
class APIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || envConfig.getApiConfig().baseURL
    this.timeout = options.timeout || envConfig.getApiConfig().timeout
    this.retryAttempts = options.retryAttempts || envConfig.getApiConfig().retryAttempts
    this.retryDelay = options.retryDelay || 1000

    this.requestInterceptors = []
    this.responseInterceptors = []
    this.errorInterceptors = []

    this.headers = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    }
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor)
    }
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor)
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor)
    }
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor) {
    this.errorInterceptors.push(interceptor)
    return () => {
      this.errorInterceptors = this.errorInterceptors.filter((i) => i !== interceptor)
    }
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let result = config
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response) {
    let result = response
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * Apply error interceptors
   */
  async applyErrorInterceptors(error) {
    let result = error
    for (const interceptor of this.errorInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * Build full URL
   */
  buildURL(path) {
    if (path.startsWith('http')) return path
    return `${this.baseURL}${path}`
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(fn, attempts = this.retryAttempts) {
    let lastError
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (i < attempts - 1) {
          const delay = this.retryDelay * Math.pow(2, i)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }

  /**
   * Make HTTP request
   */
  async request(method, path, options = {}) {
    const url = this.buildURL(path)
    const config = {
      method,
      headers: { ...this.headers, ...options.headers },
      timeout: options.timeout || this.timeout,
      ...options,
    }

    // Apply request interceptors
    const finalConfig = await this.applyRequestInterceptors(config)

    // Make request with retry
    const makeRequest = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout)

      try {
        const response = await fetch(url, {
          ...finalConfig,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Check if response is ok
        if (!response.ok) {
          throw this.createError(response.status, await response.text())
        }

        let data
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        const finalResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data,
        }

        // Apply response interceptors
        return this.applyResponseInterceptors(finalResponse)
      } catch (error) {
        clearTimeout(timeoutId)

        if (error.name === 'AbortError') {
          throw new AppError('Request timeout', ERROR_CATEGORY.NETWORK, {
            severity: 'medium',
            userMessage: 'Request timed out. Please try again.',
          })
        }

        throw error
      }
    }

    try {
      // Retry only for network errors, not for 4xx/5xx
      if (options.retry !== false) {
        return await this.retryWithBackoff(makeRequest)
      } else {
        return await makeRequest()
      }
    } catch (error) {
      // Apply error interceptors
      const finalError = await this.applyErrorInterceptors(error)
      throw finalError
    }
  }

  /**
   * Create error from response
   */
  createError(status, message) {
    const statusCode = status
    let category = ERROR_CATEGORY.SERVER_ERROR
    let userMessage = 'An error occurred'

    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401) {
        category = ERROR_CATEGORY.AUTHENTICATION
        userMessage = 'Authentication required. Please log in.'
      } else if (statusCode === 403) {
        category = ERROR_CATEGORY.AUTHORIZATION
        userMessage = 'You do not have permission for this action.'
      } else if (statusCode === 404) {
        category = ERROR_CATEGORY.NOT_FOUND
        userMessage = 'The requested resource was not found.'
      } else if (statusCode === 409) {
        category = ERROR_CATEGORY.CONFLICT
        userMessage = 'There was a conflict with your request.'
      } else {
        category = ERROR_CATEGORY.VALIDATION
        userMessage = 'Invalid request. Please check your input.'
      }
    } else if (statusCode >= 500) {
      userMessage = 'Server error. Please try again later.'
    }

    return new AppError(message || `HTTP ${statusCode}`, category, {
      code: `HTTP_${statusCode}`,
      statusCode,
      userMessage,
    })
  }

  /**
   * GET request
   */
  get(path, options = {}) {
    return this.request('GET', path, options)
  }

  /**
   * POST request
   */
  post(path, data = null, options = {}) {
    return this.request('POST', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  put(path, data = null, options = {}) {
    return this.request('PUT', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  patch(path, data = null, options = {}) {
    return this.request('PATCH', path, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  delete(path, options = {}) {
    return this.request('DELETE', path, options)
  }

  /**
   * Set authorization token
   */
  setAuthToken(token) {
    if (token) {
      this.headers.Authorization = `Bearer ${token}`
    } else {
      delete this.headers.Authorization
    }
  }

  /**
   * Set custom header
   */
  setHeader(key, value) {
    this.headers[key] = value
  }
}

/**
 * Create global API instance
 */
export const apiClient = new APIClient()

/**
 * Add default error handling interceptor
 */
apiClient.addErrorInterceptor((error) => {
  handleError(error, { context: { source: 'api-client' } })
  return error
})

/**
 * Add default response logging in development
 */
if (import.meta.env.DEV) {
  apiClient.addResponseInterceptor((response) => {
    console.debug('[API]', response.status, response.data)
    return response
  })
}

/**
 * Service layer for API endpoints
 */
export const createService = (basePath) => {
  return {
    async list(params = {}) {
      const response = await apiClient.get(basePath, { params })
      return response.data
    },

    async get(id) {
      const response = await apiClient.get(`${basePath}/${id}`)
      return response.data
    },

    async create(data) {
      const response = await apiClient.post(basePath, data)
      return response.data
    },

    async update(id, data) {
      const response = await apiClient.put(`${basePath}/${id}`, data)
      return response.data
    },

    async patch(id, data) {
      const response = await apiClient.patch(`${basePath}/${id}`, data)
      return response.data
    },

    async delete(id) {
      const response = await apiClient.delete(`${basePath}/${id}`)
      return response.data
    },
  }
}

/**
 * Test service example
 */
export const testsService = createService('/api/tests')

/**
 * Users service example
 */
export const usersService = createService('/api/users')

/**
 * Submissions service example
 */
export const submissionsService = createService('/api/submissions')
