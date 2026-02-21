import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppFooter from '../components/AppFooter'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="flex-1 flex">
        {/* Left Side - Pattern & Description */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* Pattern Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <h1 className="text-6xl font-bold mb-6">Nexo</h1>
            <div className="h-1 w-24 bg-blue-300 mx-auto mb-8"></div>
            <p className="text-2xl font-light mb-6">
              Test & Olimpiada Platformasi
            </p>
            <p className="text-lg text-blue-100 max-w-sm leading-relaxed">
              Nexo - bu imtihon va olimpiadalarni yaratish, boshqarish va o'tkazish uchun zamonaviy platform. Qulaylik va samaradorlik bilan ta'lim olish va o'qitishni boshqaring.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Buttons */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-4xl font-bold text-blue-800 mb-2">Nexo</h1>
            <p className="text-slate-600">Test & Olimpiada Platformasi</p>
          </div>

          <div className="w-full max-w-md">
            <button
              onClick={() => navigate('/auth?tab=login')}
              className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-lg mb-4"
            >
              Kirish
            </button>
            <button
              onClick={() => navigate('/auth?tab=register')}
              className="w-full py-3 px-6 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition duration-200"
            >
              Ro'yxatdan O'tish
            </button>

            {/* Info Text */}
            <div className="mt-12 text-center text-slate-600">
              <p className="text-sm mb-4">
                Nexo bilan qo'shiling va test yaratish, olimpiada o'tkazish, natijalarni tahlil qilishni boshlang.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-max">
        <AppFooter />
      </div>
    </div>
  )
}
