import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppFooter from '../components/AppFooter'

const Icon = ({ d, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
)

const FEATURES = [
  { title: "Formulalar bilan savollar", text: "LaTeX formulalarni yozing va natijani o'sha zahoti ko'ring. Matematika va fizika testlari toza chiqadi.", tint: 'from-cyan-400 to-blue-500', d: ['M5 5h14l-7 7 7 7H5'] },
  { title: 'SAT va IRT testlari', text: "Modulli SAT va IRT imtihonlarini haqiqiy imtihon tartibida, vaqt bo'yicha o'tkazing.", tint: 'from-violet-400 to-fuchsia-500', d: ['M13 2 4 14h7l-1 8 9-12h-7l1-8z'] },
  { title: 'Natijalar va tahlil', text: "Har bir ishtirokchining javoblarini ko'rib chiqing, ballarni solishtiring va xatolar qayerda ekanini toping.", tint: 'from-rose-400 to-orange-400', d: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  { title: 'Telegram orqali kirish', text: "Ishtirokchilar Telegram bilan ro'yxatdan o'tadi. Natijalar to'g'ri odamga bog'lanadi.", tint: 'from-amber-300 to-rose-400', d: ['M22 3 2 11l7 2 2 7 3-5 5 4 3-16z'] },
]
const SUBJECTS = ['Matematika', 'Fizika', 'Kimyo', 'Biologiya', 'Ingliz tili', 'SAT', 'IRT', 'Tarix', 'Informatika', 'Ona tili']

export default function LandingPage() {
  const navigate = useNavigate()
  const track = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div className="stage grain min-h-screen flex flex-col">
      <div className="grid-lines" />
      <div className="orb w-[34rem] h-[34rem] -top-40 -left-32 bg-violet-600" />
      <div className="orb w-[28rem] h-[28rem] top-1/4 -right-24 bg-cyan-500" style={{ animationDelay: '-6s' }} />
      <div className="orb w-[26rem] h-[26rem] bottom-0 left-1/3 bg-rose-500/80" style={{ animationDelay: '-11s' }} />

      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between rise" style={{ '--i': 0 }}>
        <div className="flex items-center gap-3">
          <img src="/nexo.svg" alt="" className="w-10 h-10" />
          <span className="font-display text-2xl font-semibold">Nexo</span>
        </div>
        <nav className="flex items-center gap-2">
          <button onClick={() => navigate('/auth?tab=login')} className="px-5 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10">Kirish</button>
          <button onClick={() => navigate('/auth?tab=register')} className="glass px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/10">Ro'yxatdan o'tish</button>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 lg:pt-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div>
            <p className="rise glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-cyan-100" style={{ '--i': 1 }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              Test va olimpiada platformasi
            </p>
            <h1 className="mt-7 text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.02]">
              <span className="rise block" style={{ '--i': 2 }}>Imtihon va olimpiadalarni</span>
              <span className="rise block prism-text pb-2" style={{ '--i': 3 }}>yorug'lik tezligida o'tkazing</span>
            </h1>
            <p className="rise mt-7 max-w-xl text-lg text-white/70 leading-relaxed" style={{ '--i': 4 }}>
              Test yarating, ishtirokchilarni taklif qiling va natijalarni real vaqtda tahlil qiling. Hammasi bitta joyda.
            </p>
            <div className="rise mt-10 flex flex-wrap gap-4" style={{ '--i': 5 }}>
              <button onClick={() => navigate('/auth?tab=register')} className="btn-prism px-8 py-4 rounded-2xl text-lg">Bepul boshlash</button>
              <button onClick={() => navigate('/auth?tab=login')} className="glass px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/10">Hisobimga kirish</button>
            </div>
          </div>

          {/* Live test mock */}
          <div className="rise relative mx-auto w-full max-w-md" style={{ '--i': 4 }}>
            <div className="float glass prism-border rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Matematika, 2-modul</p>
                  <p className="font-display text-lg font-semibold">12 / 22 savol</p>
                </div>
                <svg viewBox="0 0 52 52" className="w-14 h-14 -rotate-90" aria-label="Qolgan vaqt">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="4" />
                  <circle cx="26" cy="26" r="22" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" className="ring" />
                </svg>
              </div>
              <p className="mt-6 text-xl leading-snug font-medium">x² − 5x + 6 = 0 tenglama ildizlarining yig'indisini toping.</p>
              <div className="mt-5 grid gap-2.5">
                {['A) 2', 'B) 3', 'C) 5', 'D) 6'].map((o, i) => (
                  <div key={o} className={`rounded-xl px-4 py-3 text-sm border ${i === 2 ? 'border-violet-300/70 bg-violet-400/25 shadow-[0_0_30px_-4px_rgba(167,139,250,.8)]' : 'border-white/10 bg-white/5'}`}>{o}</div>
                ))}
              </div>
              <div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[55%] rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-rose-400" />
              </div>
            </div>
            <div className="float-alt glass absolute -left-6 sm:-left-12 top-24 rounded-2xl px-4 py-3 text-sm">
              <p className="text-white/60">To'g'ri javoblar</p>
              <p className="font-display text-2xl font-bold text-emerald-300">94%</p>
            </div>
            <div className="float glass absolute -right-4 sm:-right-10 bottom-16 rounded-2xl px-4 py-3 text-sm" style={{ animationDelay: '-2s' }}>
              <p className="text-white/60">SAT ball</p>
              <p className="font-display text-2xl font-bold prism-text">1480</p>
            </div>
          </div>
        </section>

        <div className="border-y border-white/10 bg-white/[0.03] py-5 overflow-hidden" aria-hidden="true">
          <div className="marquee">
            {[...SUBJECTS, ...SUBJECTS].map((s, i) => (
              <span key={i} className="mx-8 font-display text-2xl text-white/35 whitespace-nowrap">{s}</span>
            ))}
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl sm:text-5xl font-bold max-w-2xl leading-tight">Test o'tkazish uchun kerak bo'lgan hamma narsa</h2>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <article key={f.title} onMouseMove={track} className="spot glass rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.tint} grid place-items-center text-white shadow-lg`}>
                  <Icon d={f.d} />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm text-white/65 leading-relaxed">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-28">
          <div className="prism-border glass rounded-[32px] px-8 py-14 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold">Birinchi testingizni bugun yarating</h2>
            <p className="mt-4 text-white/70">Ro'yxatdan o'tish bir daqiqa oladi.</p>
            <button onClick={() => navigate('/auth?tab=register')} className="btn-prism mt-9 px-10 py-4 rounded-2xl text-lg">Ro'yxatdan o'tish</button>
          </div>
        </section>
      </main>

      <div className="relative z-10 text-white/60"><AppFooter /></div>
    </div>
  )
}
