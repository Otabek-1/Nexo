import { useState, useCallback, useEffect } from 'react'
import { AUTH_CONFIG } from '../lib/config'

/**
 * useAuth Hook - Manage authentication state
 * Ready for backend integration
 */
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth from storage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
        const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY)

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Failed to restore auth:', err)
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
        localStorage.removeItem(AUTH_CONFIG.USER_KEY)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  /**
   * Register user
   * TODO: Call backend when available
   */
  const register = useCallback(async (userData) => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with real API call
      // const response = await authApi.register(userData)
      const response = {
        id: String(Date.now()),
        email: userData.email,
        fullName: userData.fullName,
        role: 'creator',
        accessToken: `token_${Date.now()}`,
      }

      const userInfo = {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      }

      saveAuth(userInfo, response.accessToken)
      return userInfo
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Login user
   * TODO: Call backend when available
   */
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with real API call
      // const response = await authApi.login({ email, password })
      const response = {
        id: String(Date.now()),
        email,
        role: 'creator',
        accessToken: `token_${Date.now()}`,
      }

      const userInfo = {
        id: response.id,
        email: response.email,
        role: response.role,
      }

      saveAuth(userInfo, response.accessToken)
      return userInfo
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Call backend logout endpoint
      clearAuth()
    } catch (err) {
      setError(err.message)
      // Clear auth locally anyway
      clearAuth()
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Save auth data to state and storage
   */
  const saveAuth = useCallback((userInfo, accessToken) => {
    setUser(userInfo)
    setToken(accessToken)
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken)
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userInfo))
  }, [])

  /**
   * Clear auth data
   */
  const clearAuth = useCallback(() => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
    localStorage.removeItem(AUTH_CONFIG.USER_KEY)
  }, [])

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = Boolean(user && token)

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    return user?.role === role
  }, [user])

  return {
    // State
    user,
    token,
    loading,
    error,
    isAuthenticated,

    // Methods
    register,
    login,
    logout,
    hasRole,
    clearAuth,
    saveAuth,
  }
}

export default useAuth
