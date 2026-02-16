/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
}

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_EXPORT: import.meta.env.VITE_ENABLE_EXPORT === 'true',
  DEBUG_MODE: import.meta.env.DEV,
}

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  TOKEN_KEY: 'nexo_auth_token',
  USER_KEY: 'nexo_user',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
}

/**
 * Subscription Plans
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    activeTests: 1,
    questionsPerTest: 50,
    submissionsPerTest: 100,
    manualReviewRecent: 20,
  },
  PRO: {
    name: 'Pro',
    activeTests: 'Unlimited',
    questionsPerTest: 'Unlimited',
    submissionsPerTest: 'Unlimited',
    manualReviewRecent: 'Unlimited',
  },
}

/**
 * Question Types
 */
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
}

/**
 * Test Types
 */
export const TEST_TYPES = {
  EXAM: 'exam',
  QUIZ: 'quiz',
  PRACTICE: 'practice',
}

/**
 * Scoring Types
 */
export const SCORING_TYPES = {
  CORRECT_INCORRECT: 'correct-incorrect',
  POINTS: 'points',
  RASCH: 'rasch',
}

/**
 * Submission Statuses
 */
export const SUBMISSION_STATUS = {
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
}

/**
 * Participant Field Types
 */
export const PARTICIPANT_FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'tel',
  TEXTAREA: 'textarea',
}

/**
 * Validation Rules
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_FULL_NAME_LENGTH: 2,
  MAX_FULL_NAME_LENGTH: 100,
  MAX_TEST_TITLE_LENGTH: 200,
  MAX_QUESTION_LENGTH: 5000,
}

/**
 * UI Constants
 */
export const UI = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1280,
  },
}

/**
 * Get config value
 */
export const getConfig = (key, defaultValue = null) => {
  const keys = key.split('.')
  let value = {
    API_CONFIG,
    FEATURES,
    AUTH_CONFIG,
    SUBSCRIPTION_PLANS,
    QUESTION_TYPES,
    TEST_TYPES,
    SCORING_TYPES,
    SUBMISSION_STATUS,
    PARTICIPANT_FIELD_TYPES,
    VALIDATION,
    UI,
  }

  for (const k of keys) {
    value = value[k]
    if (value === undefined) return defaultValue
  }

  return value
}

export default {
  API_CONFIG,
  FEATURES,
  AUTH_CONFIG,
  SUBSCRIPTION_PLANS,
  QUESTION_TYPES,
  TEST_TYPES,
  SCORING_TYPES,
  SUBMISSION_STATUS,
  PARTICIPANT_FIELD_TYPES,
  VALIDATION,
  UI,
  getConfig,
}
