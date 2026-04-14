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

export const apiRequest = async (endpoint, options = {}) => {
  const { auth = true, method = 'GET', body = null } = options
  
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (auth) {
    const token = localStorage.getItem('access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  
  const config = {
    method,
    headers,
  }
  
  if (body) config.body = JSON.stringify(body)
  
  const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${endpoint}`, config)
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

