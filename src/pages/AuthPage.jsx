import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Side - Info */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-6xl font-bold mb-6 hover:scale-105 transition">Nexo</h1>
          <div className="h-1 w-24 bg-blue-300 mx-auto mb-8"></div>
          <p className="text-2xl font-light mb-6">
            Test & Olimpiada Platformasi
          </p>
          <p className="text-lg text-blue-100 max-w-sm leading-relaxed">
            Sinov va olimpiadalarni osongina yaratib, boshqaring va olib boring.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        {/* Mobile Header */}
        <div 
          className="lg:hidden mb-8 text-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <h1 className="text-4xl font-bold text-blue-800 mb-2">Nexo</h1>
          <p className="text-slate-600">Test & Olimpiada Platformasi</p>
        </div>

        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => navigate('/auth?tab=login', { replace: true })}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => navigate('/auth?tab=register', { replace: true })}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              Ro'yxat
            </button>
          </div>

          {/* Forms */}
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
