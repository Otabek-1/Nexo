import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateEmail } from '../lib/validators'
import { getErrorMessage, logError } from '../lib/errors'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const errors = {}

    if (!email.trim()) {
      errors.email = 'Email majburiy'
    } else if (!validateEmail(email)) {
      errors.email = 'Email formati noto\'g\'ri'
    }

    if (!password) {
      errors.password = 'Parol majburiy'
    } else if (password.length < 6) {
      errors.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // TODO: Replace with real API call when backend is ready
      // const response = await authApi.login({ email, password })
      // Save auth token, set user session, etc.

      // For demo: just navigate to dashboard
      console.log('Kirish:', { email })
      navigate('/dashboard')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      logError(err, { context: 'login_form' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }))
          }}
          onBlur={() => {
            if (email && !validateEmail(email)) {
              setFieldErrors(prev => ({ ...prev, email: 'Email formati noto\'g\'ri' }))
            }
          }}
          placeholder="example@gmail.com"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
            fieldErrors.email
              ? 'border-red-300 focus:ring-red-500'
              : 'border-slate-300 focus:ring-blue-500'
          }`}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-red-600 text-xs mt-1">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Parol <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }))
          }}
          placeholder="Kamida 6 ta belgi"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
            fieldErrors.password
              ? 'border-red-300 focus:ring-red-500'
              : 'border-slate-300 focus:ring-blue-500'
          }`}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-red-600 text-xs mt-1">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-200"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Kutilmoqda...
          </span>
        ) : (
          'Kirish'
        )}
      </button>
    </form>
  )
}

