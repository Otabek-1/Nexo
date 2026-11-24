import { config } from './config'

const AUTH_TOKEN_KEY = 'nexo_auth_token_v1'
const AUTH_REFRESH_KEY = 'nexo_auth_refresh_token_v1'
const AUTH_USER_KEY = 'nexo_auth_user_v1'
const AUTH_SESSION_KEY = 'nexo_auth_session_v1'
let refreshInFlight = null

export const getAccessToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

const clearLocalAuth = () => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)
}

const refreshAccessToken = async (baseUrl) => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY)
      if (!refreshToken) throw new Error('No refresh token')

      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        const error = await response.text()
        if (response.status === 401 || response.status === 403) clearLocalAuth()
        throw new Error(`Token refresh failed: ${response.status} - ${error}`)
      }

      const tokens = await response.json()
      localStorage.setItem(AUTH_TOKEN_KEY, tokens.access_token)
      localStorage.setItem(AUTH_REFRESH_KEY, tokens.refresh_token)

      const rawSession = localStorage.getItem(AUTH_SESSION_KEY)
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession)
          const expiresInSec = Number(tokens.expires_in)
          const duration = Number.isFinite(expiresInSec) && expiresInSec > 0
            ? expiresInSec
            : 900
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
            ...session,
            expiresAt: new Date(Date.now() + duration * 1000).toISOString()
          }))
        } catch {
          localStorage.removeItem(AUTH_SESSION_KEY)
        }
      }

      return tokens.access_token
    })()
  }

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

const withTimeout = async (promise, timeoutMs = config.requestTimeoutMs) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const result = await promise(controller.signal)
    return result
  } finally {
    clearTimeout(timer)
  }
}

export const apiRequest = async (endpoint, options = {}) => {
  const { auth = true, method = 'GET', body = null } = options

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://nexo-server-jwjb.onrender.com/api/v1'
  const url = `${baseUrl}${endpoint}`

  const sendRequest = (token) => {
    const headers = { 'Content-Type': 'application/json' }
    if (auth && token) headers.Authorization = `Bearer ${token}`

    const fetchConfig = { method, headers }
    if (body) fetchConfig.body = JSON.stringify(body)
    return fetch(url, fetchConfig)
  }

  try {
    let response = await sendRequest(getAccessToken())

    if (response.status === 401 && auth && !endpoint.startsWith('/auth/')) {
      const refreshedToken = await refreshAccessToken(baseUrl)
      response = await sendRequest(refreshedToken)
    }

    if (!response.ok) {
      const error = await response.text()
      console.error(`API ${response.status}:`, error)
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

