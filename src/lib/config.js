/**
 * Application configuration
 * Load from environment variables or use defaults
 */

export const config = {
  // App
  name: import.meta.env.VITE_APP_NAME || 'Nexo',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // URLs
  baseUrl: import.meta.env.VITE_TEST_BASE_URL || (
    typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}` 
      : 'http://localhost:5173'
  ),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  
  // Feature Flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    raschScoring: import.meta.env.VITE_ENABLE_RASCH_SCORING !== 'false',
  },
  
  // Timeouts
  sessionTimeoutMinutes: Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 1440, // 24 hours
  requestTimeoutMs: 30000,
  debounceMs: 300,
  
  // Storage
  storagePrefix: import.meta.env.VITE_STORAGE_PREFIX || 'nexo_',
  
  // Debug
  debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development',
  
  // Limits
  limits: {
    maxTestName: 200,
    maxDescription: 5000,
    maxQuestions: 1000,
    maxOptions: 100,
    maxParticipantFields: 20,
    maxSubmissionsPerTest: 10000,
  },

  // API Endpoints
  api: {
    auth: '/auth',
    tests: '/tests',
    submissions: '/submissions',
    users: '/users',
  }
}

/**
 * Validate configuration
 */
export const validateConfig = () => {
  const errors = []

  if (!config.name) errors.push('App name is required')
  if (!config.baseUrl) errors.push('Base URL is required')
  if (config.sessionTimeoutMinutes < 5) errors.push('Session timeout must be at least 5 minutes')

  if (errors.length > 0) {
    console.error('[Config Validation Errors]:', errors)
    if (config.debug) {
      console.warn('Configuration:', config)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Get storage key with prefix
 */
export const getStorageKey = (key) => {
  return `${config.storagePrefix}${key}`
}

/**
 * Log if debug mode is enabled
 */
export const debugLog = (...args) => {
  if (config.debug) {
    console.log('[Debug]', ...args)
  }
}

// Validate config on load
if (config.debug) {
  const validation = validateConfig()
  if (validation.valid) {
    console.log('[Config] Validation passed')
  }
}
