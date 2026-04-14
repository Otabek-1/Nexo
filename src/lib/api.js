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
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  
  const fetchConfig = {
    method,
    headers,
  }
  
  if (body) fetchConfig.body = JSON.stringify(body)
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://nexo-server-lgzw.onrender.com/api/v1'
  const url = `${baseUrl}${endpoint}`
  
  try {
    const response = await fetch(url, fetchConfig)
    
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

