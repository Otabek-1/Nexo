import { config } from './config'

const AUTH_TOKEN_KEY = 'nexo_auth_token_v1'

export const getAccessToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || ''
  } catch {
    return ''
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

export const apiRequest = async (path, { method = 'GET', body, headers = {}, auth = true } = {}) => {
  const token = getAccessToken()
  const finalHeaders = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  }
  if (auth && token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }

  const response = await withTimeout((signal) =>
    fetch(`${config.apiBaseUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    })
  )

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `HTTP ${response.status}`
    const err = new Error(detail)
    err.status = response.status
    err.payload = payload
    throw err
  }

  return payload
}

