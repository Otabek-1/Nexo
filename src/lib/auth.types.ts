import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types'

/**
 * Authentication service interface
 */
export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(data: RegisterData): Promise<AuthResponse>
  logout(): void
  getCurrentUser(): User | null
  isAuthenticated(): boolean
  validateEmail(email: string): boolean
  validatePassword(password: string): { valid: boolean; message: string }
}

/**
 * Session data structure
 */
export interface SessionData {
  user: User
  token: string
  expiresAt: number
}

/**
 * Auth state context
 */
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
}

/**
 * Form validation errors
 */
export interface FormValidationErrors {
  email?: string
  password?: string
  fullName?: string
  confirmPassword?: string
}

/**
 * Storage keys for auth data
 */
export enum StorageKeys {
  USER = 'nexo_user_v1',
  SESSION = 'nexo_session_v1',
  AUTH_TOKEN = 'nexo_auth_token_v1',
}

/**
 * Auth error codes
 */
export enum AuthErrorCode {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error for auth operations
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
