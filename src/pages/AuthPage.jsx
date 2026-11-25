import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'

const POINTS = [
  "Formulalar bilan savollar yarating",
  "SAT va IRT imtihonlarini o'tkazing",
  "Natijalarni ishtirokchilar bo'yicha tahlil qiling",
]

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const tab = (id) =>
    `flex-1 py-2.5 px-4 rounded-xl font-semibold transition duration-200 ${
      activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white/80'
    }`

  return (
    <div className="stage grain min-h-screen flex items-center">
      <div className="grid-lines" />
      <div className="orb w-[30rem] h-[30rem] -top-32 -left-24 bg-violet-600" />
      <div className="orb w-[26rem] h-[26rem] bottom-0 right-0 bg-cyan-500/80" style={{ animationDelay: '-7s' }} />
      <div className="orb w-[22rem] h-[22rem] top-1/2 left-1/3 bg-rose-500/60" style={{ animationDelay: '-12s' }} />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-2 gap-14 items-center">
        <div className="hidden lg:block rise" style={{ '--i': 1 }}>
          <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-10" aria-label="Bosh sahifa">
            <img src="/nexo.svg" alt="" className="w-12 h-12" />
            <span className="font-display text-3xl font-semibold text-white">Nexo</span>
          </button>
          <h1 className="text-5xl xl:text-6xl font-bold leading-[1.05] text-white">
            Testlaringiz <span className="prism-text">bir joyda</span>
          </h1>
          <ul className="mt-9 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="glass rounded-2xl px-5 py-4 text-white/85 flex items-center gap-4">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-300 to-fuchsia-400 shadow-[0_0_14px_#a78bfa]" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rise mx-auto w-full max-w-md" style={{ '--i': 2 }}>
          <button onClick={() => navigate('/')} className="lg:hidden flex items-center gap-3 mx-auto mb-6" aria-label="Bosh sahifa">
            <img src="/nexo.svg" alt="" className="w-10 h-10" />
            <span className="font-display text-2xl font-semibold text-white">Nexo</span>
          </button>
          <div className="prism-border rounded-[28px] bg-white/90 backdrop-blur-xl p-7 sm:p-9 shadow-2xl">
            <div className="flex gap-2 p-1.5 mb-8 rounded-2xl bg-blue-50">
              <button onClick={() => navigate('/auth?tab=login', { replace: true })} className={tab('login')}>Kirish</button>
              <button onClick={() => navigate('/auth?tab=register', { replace: true })} className={tab('register')}>Ro'yxat</button>
            </div>
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-white/70 hover:text-white text-sm font-medium">Bosh sahifaga qaytish</button>
          </div>
        </div>
      </div>
    </div>
  )
}
