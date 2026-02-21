/**
 * Application-wide constants
 */

// App Information
export const APP_NAME = 'Nexo'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Test & Olimpiada Platformasi'

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_LOGIN: '/auth?tab=login',
  AUTH_REGISTER: '/auth?tab=register',
  DASHBOARD: '/dashboard',
  CREATE_TEST: '/create-test',
  EDIT_TEST: (id) => `/edit-test/${id}`,
  TEST_SESSION: (id) => `/test/${id}`,
  TEST_REVIEW: (id) => `/test/${id}/review`,
  TEST_RESULTS: (id) => `/test/${id}/results`,
  PLANS: '/plans'
}

// Question types
export const QUESTION_TYPES = {
  SHORT_ANSWER: 'short-answer',
  TWO_PART_WRITTEN: 'two-part-written',
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  ESSAY: 'essay'
}

// Scoring types
export const SCORING_TYPES = {
  CORRECT_INCORRECT: 'correct-incorrect',
  RASCH: 'rasch',
  POINTS: 'points'
}

// Test types
export const TEST_TYPES = {
  EXAM: 'exam',
  QUIZ: 'quiz',
  OLYMPIAD: 'olympiad'
}

// Submission statuses
export const SUBMISSION_STATUS = {
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress'
}

// Field types for participant data
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'tel',
  TEXTAREA: 'textarea'
}

// Limits and constraints
export const LIMITS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_TEST_NAME_LENGTH: 3,
  MAX_TEST_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_QUESTIONS: 1,
  MIN_OPTIONS: 2,
  MIN_DURATION: 1,
  MAX_DURATION: 480, // 8 hours
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours in ms
}

// API status codes and messages
export const API = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized'
}

// Localized messages
export const MESSAGES = {
  CONFIRM_DELETE_TEST: 'Rostdan ham bu imtihonni ochirmoqchimisiz? Barcha submissionlar ham ochiriladi.',
  CONFIRM_LOGOUT: 'Rostdan ham chiqishni xohlaysizmi?',
  DELETE_SUCCESS: 'Muvaffaqiyatli o\'chirildi',
  SAVE_SUCCESS: 'Muvaffaqiyatli saqlandi',
  ERROR_GENERIC: 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
  LOADING: 'Kutilmoqda...',
  COPY_SUCCESS: 'Link nusxalandi'
}

// Color classes (Tailwind)
export const COLORS = {
  PRIMARY: 'blue',
  SUCCESS: 'emerald',
  WARNING: 'amber',
  ERROR: 'red',
  NEUTRAL: 'slate'
}

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}

// Time formatting
export const TIME_FORMAT = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  TIME: 'HH:mm:ss'
}
