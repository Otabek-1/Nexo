const AUTH_USER_KEY = 'nexo_auth_user_v1'
const AUTH_SESSION_KEY = 'nexo_auth_session_v1'
const AUTH_TOKEN_KEY = 'nexo_auth_token_v1'

// Get all registered users from storage
const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem('nexo_users_db_v1')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Save users to storage
const saveStoredUsers = (users) => {
  localStorage.setItem('nexo_users_db_v1', JSON.stringify(users))
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(String(email).toLowerCase())
}

// Validate password strength
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Parol kamida 6 ta belgi bo\'lishi kerak' }
  }
  return { valid: true }
}

// Generate a simple hash (for demo - in production use bcrypt)
const hashPassword = (password) => {
  // This is a placeholder. In production, use proper bcrypt hashing
  // For now, using a simple transformation with salt
  const salt = 'nexo_salt_2024'
  let hash = 0
  const str = salt + password
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Register a new user
export const registerUser = (email, password) => {
  const normalizedEmail = String(email).trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Noto\'g\'ri email formati' }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message }
  }

  const users = getStoredUsers()

  if (users[normalizedEmail]) {
    return { success: false, message: 'Bu email bilan foydalanuvchi allaqachon mavjud' }
  }

  users[normalizedEmail] = {
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  saveStoredUsers(users)

  return {
    success: true,
    message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz',
    user: { email: normalizedEmail }
  }
}

// Authenticate user
export const authenticateUser = async (email, password) => {
  const normalizedEmail = String(email).trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, message: 'Noto\'g\'ri email formati' }
  }

  if (!password) {
    return { success: false, message: 'Parol kiritilmagan' }
  }

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 300))

  const users = getStoredUsers()
  const user = users[normalizedEmail]

  if (!user) {
    return { success: false, message: 'Foydalanuvchi topilmadi' }
  }

  const passwordHash = hashPassword(password)
  if (user.passwordHash !== passwordHash) {
    return { success: false, message: 'Parol noto\'g\'ri' }
  }

  // Create session
  const session = {
    userId: normalizedEmail,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  }

  const token = btoa(JSON.stringify(session))
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ email: normalizedEmail }))
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))

  return {
    success: true,
    message: 'Muvaffaqiyatli kirish',
    user: { email: normalizedEmail }
  }
}

// Get current session
export const getCurrentSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null

    const session = JSON.parse(raw)
    const expiresAt = new Date(session.expiresAt).getTime()
    const now = Date.now()

    if (now > expiresAt) {
      logoutUser()
      return null
    }

    return session
  } catch {
    return null
  }
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return Boolean(getCurrentSession())
}

// Get current user
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Logout user
export const logoutUser = () => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)
  return { success: true }
}

// Check email existence
export const emailExists = (email) => {
  const normalizedEmail = String(email).trim().toLowerCase()
  const users = getStoredUsers()
  return Boolean(users[normalizedEmail])
}
