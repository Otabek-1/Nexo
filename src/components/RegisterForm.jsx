import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, isValidEmail, validatePassword, emailExists } from '../lib/auth'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'F.I.O maydoni majburiy'
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = 'F.I.O kamida 3 ta belgidan iborat bo\'lishi kerak'
    }

    if (!formData.email) {
      errors.email = 'Email maydoni majburiy'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Noto\'g\'ri email formati'
    } else if (emailExists(formData.email)) {
      errors.email = 'Bu email bilan foydalanuvchi allaqachon mavjud'
    }

    if (!formData.password) {
      errors.password = 'Parol maydoni majburiy'
    } else {
      const validation = validatePassword(formData.password)
      if (!validation.valid) {
        errors.password = validation.message
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Parol tasdiqini kiritish majburiy'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Parollar mos kelmadi'
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
      const result = await registerUser(formData.email, formData.password, formData.fullName)

      if (result.success) {
        setTimeout(() => {
          navigate('/auth?tab=login')
        }, 500)
      } else {
        setError(result.message || 'Ro\'yxatdan o\'tishda xatolik')
      }
    } catch (err) {
      setError('Xatolik: ' + (err.message || 'Noma\'lum xatolik'))
      console.error('[RegisterForm]:', err)
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
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
          F.I.O
        </label>
        <input
          id="fullName"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Ismingiz Familiyangiz"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          aria-invalid={Boolean(validationErrors.fullName)}
          aria-describedby={validationErrors.fullName ? 'fullName-error' : undefined}
        />
        {validationErrors.fullName && (
          <p id="fullName-error" className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
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
          name="password"
          value={formData.password}
          onChange={handleChange}
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

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
          Parolni Tasdiqlang
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          aria-invalid={Boolean(validationErrors.confirmPassword)}
          aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        {validationErrors.confirmPassword && (
          <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition duration-200 cursor-pointer"
      >
        {loading ? 'Kutilmoqda...' : 'Ro\'yxatdan O\'tish'}
      </button>
    </form>
  )
}

