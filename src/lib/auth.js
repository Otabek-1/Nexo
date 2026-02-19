import { apiRequest } from './api'

const AUTH_USER_KEY = 'nexo_auth_user_v1'
const AUTH_SESSION_KEY = 'nexo_auth_session_v1'
const AUTH_TOKEN_KEY = 'nexo_auth_token_v1'
const AUTH_REFRESH_KEY = 'nexo_auth_refresh_token_v1'

const clearLocalAuth = () => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)
}

const saveAuthSession = (authResponse) => {
  const now = Date.now()
  const expiresInSec = Number(authResponse?.tokens?.expires_in || 900)
  const session = {
    userId: authResponse.user.id,
    email: authResponse.user.email,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + expiresInSec * 1000).toISOString()
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authResponse.user))
  localStorage.setItem(AUTH_TOKEN_KEY, authResponse.tokens.access_token)
  localStorage.setItem(AUTH_REFRESH_KEY, authResponse.tokens.refresh_token)
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(String(email).toLowerCase())
}

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Parol kamida 6 ta belgi bo\'lishi kerak' }
  }
  return { valid: true }
}

export const registerUser = async (email, password, fullName = '') => {
  const normalizedEmail = String(email).trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Noto\'g\'ri email formati' }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message }
  }

  const normalizedName = String(fullName || '').trim()
  const fallbackName = normalizedEmail.split('@')[0] || 'User'
  const safeName = normalizedName.length >= 3 ? normalizedName : fallbackName

  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        email: normalizedEmail,
        password,
        full_name: safeName
      }
    })
    saveAuthSession(response)
    return {
      success: true,
      message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz',
      user: { email: response.user.email }
    }
  } catch (error) {
    return { success: false, message: error.message || 'Ro\'yxatdan o\'tishda xatolik' }
  }
}

export const authenticateUser = async (email, password) => {
  const normalizedEmail = String(email).trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Noto\'g\'ri email formati' }
  }

  if (!password) {
    return { success: false, message: 'Parol kiritilmagan' }
  }

  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: normalizedEmail, password }
    })
    saveAuthSession(response)
    return {
      success: true,
      message: 'Muvaffaqiyatli kirish',
      user: { email: response.user.email }
    }
  } catch (error) {
    return { success: false, message: error.message || 'Kirish amalga oshmadi' }
  }
}

export const getCurrentSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null

    const session = JSON.parse(raw)
    const expiresAt = new Date(session.expiresAt).getTime()
    const now = Date.now()

    if (now > expiresAt) {
      clearLocalAuth()
      return null
    }

    return session
  } catch {
    return null
  }
}

export const isAuthenticated = () => Boolean(getCurrentSession() && localStorage.getItem(AUTH_TOKEN_KEY))

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const refreshCurrentUser = async () => {
  try {
    const me = await apiRequest('/me')
    const nextUser = {
      id: me.id,
      email: me.email,
      full_name: me.full_name,
      role: me.role
    }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser))
    return nextUser
  } catch {
    return getCurrentUser()
  }
}

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY)
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken }
      })
    }
  } catch {
    // ignore logout API failure on client side
  } finally {
    clearLocalAuth()
  }
  return { success: true }
}

export const emailExists = () => false
