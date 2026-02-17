// User and Authentication Types
export interface User {
  id: string
  email: string
  fullName?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  fullName: string
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

// Test Related Types
export interface Question {
  id: string
  type: 'multiple-choice' | 'short-answer' | 'essay'
  text: string
  options?: string[]
  correctAnswer?: string | string[]
  points: number
  order: number
}

export interface Test {
  id: string
  title: string
  description: string
  creatorId: string
  questions: Question[]
  duration: number // in minutes
  passScore: number // percentage
  isPublished: boolean
  createdAt: string
  updatedAt: string
  publicUrl?: string
}

export interface TestSession {
  id: string
  testId: string
  userId: string
  startTime: string
  endTime?: string
  answers: Record<string, string | string[]>
  isCompleted: boolean
  score?: number
  feedback?: string
}

export interface Submission {
  id: string
  testId: string
  userId: string
  sessionId: string
  answers: Record<string, string | string[]>
  score: number
  passed: boolean
  submittedAt: string
  feedback?: Record<string, string>
}

// Subscription and Plan Types
export interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  limits: PlanLimits
}

export interface PlanLimits {
  maxTests: number
  maxQuestions: number
  maxParticipants: number
  features: string[]
}

export interface Subscription {
  userId: string
  planId: string
  status: 'active' | 'canceled' | 'expired'
  startDate: string
  endDate: string
  autoRenew: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Form Validation Types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
}

// UI Component Props Types
export interface ButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}

export interface InputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number'
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export interface SelectProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

// Error Types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: Record<string, any>
}

export interface ErrorContext {
  error: AppError | null
  resetError: () => void
}

// Local Storage Types
export interface StorageData {
  key: string
  value: any
  expiresAt?: number
}

// Configuration Types
export interface AppConfig {
  apiUrl: string
  apiTimeout: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  features: {
    maintenanceMode: boolean
    testingMode: boolean
    errorTracking: boolean
  }
}

// Event Types
export interface TestCreatedEvent {
  type: 'test:created'
  testId: string
  createdBy: string
  timestamp: string
}

export interface SubmissionEvent {
  type: 'submission:created' | 'submission:graded'
  submissionId: string
  testId: string
  timestamp: string
  data: Submission
}

export type AppEvent = TestCreatedEvent | SubmissionEvent

// Utility Types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type AsyncFn<T> = () => Promise<T>
export type Callback<T> = (data: T) => void
export type ErrorCallback = (error: Error) => void

// Hook Types
export interface UseFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void> | void
  validate?: (values: T) => ValidationError[]
}

export interface UseFormReturn<T> extends FormState<T> {
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  resetForm: () => void
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
}
