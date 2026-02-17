import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authenticateUser } from '../lib/auth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const errors = {}
    
    if (!email.trim()) {
      errors.email = 'Email maydoni majburiy'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Noto\'g\'ri email formati'
    }
    
    if (!password) {
      errors.password = 'Parol maydoni majburiy'
    } else if (password.length < 6) {
      errors.password = 'Parol kamida 6 ta belgi bo\'lishi kerak'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setValidationErrors({})

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)

    try {
      const result = await authenticateUser(email.trim(), password)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message || 'Kirish amalga oshmadi')
      }
    } catch (err) {
      setError('Xatolik: ' + (err.message || 'Tarmoq xatosi'))
      console.error('[LoginForm]:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          aria-invalid={Boolean(validationErrors.email)}
          aria-describedby={validationErrors.email ? 'email-error' : undefined}
        />
        {validationErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
          Parol
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          aria-invalid={Boolean(validationErrors.password)}
          aria-describedby={validationErrors.password ? 'password-error' : undefined}
        />
        {validationErrors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition duration-200 cursor-pointer"
      >
        {loading ? 'Kutilmoqda...' : 'Kirish'}
      </button>
    </form>
  )
}

