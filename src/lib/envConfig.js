/**
 * Environment Configuration Manager
 * Handles all environment variables with validation and type safety
 */

/**
 * Environment validation schemas
 */
const envSchema = {
  // App settings
  VITE_APP_NAME: { type: 'string', default: 'Nexo', required: false },
  VITE_APP_VERSION: { type: 'string', default: '1.0.0', required: false },
  VITE_APP_ENV: { type: 'string', default: 'development', required: false },

  // API Configuration
  VITE_API_URL: { type: 'string', default: 'http://localhost:3001/api', required: false },
  VITE_API_TIMEOUT: { type: 'number', default: 30000, required: false },
  VITE_API_RETRY_ATTEMPTS: { type: 'number', default: 3, required: false },

  // Test Configuration
  VITE_TEST_BASE_URL: { type: 'string', default: 'https://nexo-test.netlify.app', required: false },
  VITE_TEST_SESSION_TIMEOUT: { type: 'number', default: 3600000, required: false }, // 1 hour

  // Logging
  VITE_LOG_LEVEL: { type: 'string', default: 'info', required: false },
  VITE_ENABLE_CONSOLE_LOGS: { type: 'boolean', default: true, required: false },
  VITE_ENABLE_ERROR_TRACKING: { type: 'boolean', default: false, required: false },

  // Feature Flags
  VITE_FEATURE_MAINTENANCE_MODE: { type: 'boolean', default: false, required: false },
  VITE_FEATURE_TESTING_MODE: { type: 'boolean', default: false, required: false },
  VITE_FEATURE_DARK_MODE: { type: 'boolean', default: false, required: false },

  // Storage
  VITE_STORAGE_PREFIX: { type: 'string', default: 'nexo_', required: false },
  VITE_STORAGE_QUOTA_WARNING: { type: 'number', default: 0.8, required: false },

  // Security
  VITE_ENABLE_HTTPS: { type: 'boolean', default: true, required: false },
  VITE_ENABLE_CSP: { type: 'boolean', default: true, required: false },
}

/**
 * Parse environment variable value
 */
const parseEnvValue = (value, type) => {
  if (value === undefined || value === null) return undefined

  switch (type) {
    case 'number':
      return Number(value)
    case 'boolean':
      return value === 'true' || value === '1' || value === true
    case 'string':
    default:
      return String(value)
  }
}

/**
 * Validate environment configuration
 */
const validateEnvConfig = () => {
  const errors = []
  const warnings = []

  for (const [key, schema] of Object.entries(envSchema)) {
    const value = import.meta.env[key]

    if (value === undefined && schema.required) {
      errors.push(`Environment variable ${key} is required but not set`)
    }

    if (value !== undefined && schema.type) {
      try {
        const parsed = parseEnvValue(value, schema.type)
        if (typeof parsed !== schema.type) {
          warnings.push(`Environment variable ${key} has wrong type, using default`)
        }
      } catch (err) {
        warnings.push(`Failed to parse ${key}: ${err.message}`)
      }
    }
  }

  return { errors, warnings }
}

/**
 * Environment configuration class
 */
class EnvConfig {
  constructor() {
    this.cache = {}
    this.validate()
  }

  validate() {
    const { errors, warnings } = validateEnvConfig()

    if (warnings.length > 0 && import.meta.env.DEV) {
      console.warn('[EnvConfig] Warnings:', warnings)
    }

    if (errors.length > 0) {
      console.error('[EnvConfig] Errors:', errors)
      throw new Error(`Environment configuration errors: ${errors.join(', ')}`)
    }
  }

  get(key, defaultValue = null) {
    if (this.cache.hasOwnProperty(key)) {
      return this.cache[key]
    }

    const schema = envSchema[key]
    if (!schema) {
      console.warn(`[EnvConfig] Unknown environment variable: ${key}`)
      return defaultValue
    }

    const envValue = import.meta.env[key]
    const value = envValue !== undefined ? parseEnvValue(envValue, schema.type) : schema.default

    this.cache[key] = value
    return value
  }

  getAll() {
    const config = {}
    for (const key of Object.keys(envSchema)) {
      config[key] = this.get(key)
    }
    return config
  }

  isDevelopment() {
    return this.get('VITE_APP_ENV') === 'development'
  }

  isProduction() {
    return this.get('VITE_APP_ENV') === 'production'
  }

  isStaging() {
    return this.get('VITE_APP_ENV') === 'staging'
  }

  isTesting() {
    return this.get('VITE_APP_ENV') === 'testing'
  }

  isMaintenance() {
    return this.get('VITE_FEATURE_MAINTENANCE_MODE')
  }

  isTestingMode() {
    return this.get('VITE_FEATURE_TESTING_MODE')
  }

  getLogLevel() {
    return this.get('VITE_LOG_LEVEL')
  }

  shouldEnableLogs() {
    return this.get('VITE_ENABLE_CONSOLE_LOGS')
  }

  shouldTrackErrors() {
    return this.get('VITE_ENABLE_ERROR_TRACKING')
  }

  getApiConfig() {
    return {
      baseURL: this.get('VITE_API_URL'),
      timeout: this.get('VITE_API_TIMEOUT'),
      retryAttempts: this.get('VITE_API_RETRY_ATTEMPTS'),
    }
  }

  getTestConfig() {
    return {
      baseURL: this.get('VITE_TEST_BASE_URL'),
      sessionTimeout: this.get('VITE_TEST_SESSION_TIMEOUT'),
    }
  }

  getStorageConfig() {
    return {
      prefix: this.get('VITE_STORAGE_PREFIX'),
      quotaWarning: this.get('VITE_STORAGE_QUOTA_WARNING'),
    }
  }

  getSecurityConfig() {
    return {
      enableHttps: this.get('VITE_ENABLE_HTTPS'),
      enableCSP: this.get('VITE_ENABLE_CSP'),
    }
  }
}

export const envConfig = new EnvConfig()

/**
 * Log configuration in development
 */
if (import.meta.env.DEV) {
  console.debug('[EnvConfig] Configuration loaded:', envConfig.getAll())
}
