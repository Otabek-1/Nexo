/**
 * API Service Layer
 * This provides a centralized place for all API calls.
 * Currently uses localStorage, but will be replaced with real backend calls.
 */

import { handleApiError, ValidationError } from './errors'
import { validateEmail, validatePassword, validateFullName } from './validators'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Make API request
 * TODO: Replace with real fetch calls when backend is ready
 */
const apiRequest = async (method, endpoint, data = null) => {
  try {
    // For now, this is a placeholder that shows how we'll structure API calls
    const url = `${API_BASE_URL}${endpoint}`
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here when available
        // 'Authorization': `Bearer ${getAuthToken()}`
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    // This will work when backend is ready
    // const response = await fetch(url, options)
    // if (!response.ok) throw new Error(`HTTP ${response.status}`)
    // return await response.json()

    // For now, throw error indicating backend is not ready
    throw new Error('Backend API not yet implemented. Using localStorage for demo.')
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Register user
   * @param {Object} userData - { fullName, email, password }
   */
  register: async (userData) => {
    const { fullName, email, password } = userData

    // Validate inputs
    const fullNameValidation = validateFullName(fullName)
    if (!fullNameValidation.valid) throw new ValidationError(fullNameValidation.error)

    const emailValidation = validateEmail(email)
    if (!emailValidation) throw new ValidationError('Email formati noto\'g\'ri')

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) throw new ValidationError(passwordValidation.error)

    // TODO: Replace with real API call
    // return apiRequest('POST', '/auth/register', userData)
    
    // Demo: simulate user creation
    return {
      id: String(Date.now()),
      fullName,
      email,
      role: 'creator',
      createdAt: new Date().toISOString()
    }
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const { email, password } = credentials

    const emailValidation = validateEmail(email)
    if (!emailValidation) throw new ValidationError('Email formati noto\'g\'ri')

    if (!password) throw new ValidationError('Parol majburiy')

    // TODO: Replace with real API call
    // return apiRequest('POST', '/auth/login', credentials)
    
    // Demo: simulate login
    return {
      id: String(Date.now()),
      email,
      role: 'creator',
      accessToken: `token_${Date.now()}`,
      expiresIn: 86400
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    // TODO: Replace with real API call
    // return apiRequest('POST', '/auth/logout')
    return { success: true }
  },

  /**
   * Verify session
   */
  verifySession: async (token) => {
    if (!token) throw new Error('Token not provided')
    // TODO: Replace with real API call
    // return apiRequest('GET', '/auth/verify', { token })
    return { valid: true }
  }
}

/**
 * Tests API
 */
export const testsApi = {
  /**
   * Create test
   */
  create: async (testData) => {
    // TODO: Replace with real API call
    // return apiRequest('POST', '/tests', testData)
    return { id: String(Date.now()), ...testData, createdAt: new Date().toISOString() }
  },

  /**
   * Get test by ID
   */
  getById: async (testId) => {
    if (!testId) throw new ValidationError('Test ID required')
    // TODO: Replace with real API call
    // return apiRequest('GET', `/tests/${testId}`)
    return null
  },

  /**
   * List creator's tests
   */
  list: async (filters = {}) => {
    // TODO: Replace with real API call
    // return apiRequest('GET', '/tests', filters)
    return []
  },

  /**
   * Update test
   */
  update: async (testId, data) => {
    if (!testId) throw new ValidationError('Test ID required')
    // TODO: Replace with real API call
    // return apiRequest('PATCH', `/tests/${testId}`, data)
    return { id: testId, ...data, updatedAt: new Date().toISOString() }
  },

  /**
   * Delete test
   */
  delete: async (testId) => {
    if (!testId) throw new ValidationError('Test ID required')
    // TODO: Replace with real API call
    // return apiRequest('DELETE', `/tests/${testId}`)
    return { success: true }
  }
}

/**
 * Submissions API
 */
export const submissionsApi = {
  /**
   * Submit test answers
   */
  submit: async (testId, submissionData) => {
    if (!testId) throw new ValidationError('Test ID required')
    // TODO: Replace with real API call
    // return apiRequest('POST', `/tests/${testId}/submissions`, submissionData)
    return { id: String(Date.now()), testId, ...submissionData, submittedAt: new Date().toISOString() }
  },

  /**
   * Get submissions for test
   */
  list: async (testId, filters = {}) => {
    if (!testId) throw new ValidationError('Test ID required')
    // TODO: Replace with real API call
    // return apiRequest('GET', `/tests/${testId}/submissions`, filters)
    return []
  },

  /**
   * Grade submission manually
   */
  grade: async (testId, submissionId, grades) => {
    if (!testId || !submissionId) throw new ValidationError('IDs required')
    // TODO: Replace with real API call
    // return apiRequest('PATCH', `/tests/${testId}/submissions/${submissionId}/grade`, grades)
    return { success: true }
  }
}

export default {
  authApi,
  testsApi,
  submissionsApi
}
