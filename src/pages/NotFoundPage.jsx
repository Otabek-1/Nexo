import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Sahifa topilmadi</h1>
        
        <p className="text-slate-600 mb-8 max-w-md">
          Siz qidirayotgan sahifa o'chirilgan yoki noto'g'ri manzilga kirgan bo'lishingiz mumkin.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Bosh sahifaga qaytish
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition"
          >
            Orqaga qaytish
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md mx-auto">
          <h3 className="font-semibold text-slate-800 mb-4">Foydalı havolalar:</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:underline text-left"
              >
                → Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/auth?tab=login')}
                className="text-blue-600 hover:underline text-left"
              >
                → Kirish
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/plans')}
                className="text-blue-600 hover:underline text-left"
              >
                → Planlar
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
