import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLAN_FREE, PLAN_PRO, setCreatorPlan } from '../lib/subscription'

const CheckIcon = ({ muted = false }) => (
  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${muted ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 011.414-1.42l2.543 2.544 6.543-6.543a1 1 0 011.415 0z"
        clipRule="evenodd"
      />
    </svg>
  </span>
)

const CrossIcon = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500">
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  </span>
)

export default function PlansPage() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly')

  const isYearly = billingCycle === 'yearly'

  const handleUpgrade = (planType) => {
    setCreatorPlan(PLAN_PRO)
    alert(`${planType} rejasi tanlandi. Demo muhiti uchun Pro aktiv qilindi.`)
    navigate('/dashboard')
  }

  const handleGetStarted = () => {
    setCreatorPlan(PLAN_FREE)
    navigate('/dashboard')
  }

  const proPriceLabel = isYearly ? '549,000 UZS / year' : '59,000 UZS / month'
  const proPlanType = isYearly ? 'pro_yearly' : 'pro_monthly'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Narxlar</h1>
            <p className="mt-1 text-sm text-slate-600">Maktablar, o'qituvchilar va imtihon tashkilotchilari uchun sodda rejalar.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${!isYearly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Oylik
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isYearly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Yillik
            </button>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">2 oy bepul</span>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Bepul</h2>
            <p className="mt-1 text-sm text-slate-600">Nexo'ni asoslari bilan tanishish uchun</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">0 UZS</p>
            <p className="mt-1 text-sm text-slate-500">Hamisha bepul</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />1 ta faol test</li>
              <li className="flex items-center gap-3"><CheckIcon />Maksimal 50 submission</li>
              <li className="flex items-center gap-3"><CheckIcon />Asosiy scoring (to'g'ri/noto'g'ri)</li>
              <li className="flex items-center gap-3"><CrossIcon />Rasch scoring yo'q</li>
              <li className="flex items-center gap-3"><CrossIcon />Puxta analitika yo'q</li>
              <li className="flex items-center gap-3"><CheckIcon />Jamoa yordami</li>
            </ul>

            <button
              type="button"
              onClick={handleGetStarted}
              className="mt-8 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Boshlash
            </button>
          </article>

          <article className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-md">
            <div className="absolute -top-3 left-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
              Tavsiya etilgan
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Pro</h2>
            <p className="mt-1 text-sm text-slate-600">Jiddiy imtihon operatsiyalari uchun</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">{proPriceLabel}</p>
            {isYearly && (
              <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                2 oy bepul
              </div>
            )}

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />Cheksiz testlar</li>
              <li className="flex items-center gap-3"><CheckIcon />Cheksiz submissionlar</li>
              <li className="flex items-center gap-3"><CheckIcon />Rasch scoring faol</li>
              <li className="flex items-center gap-3"><CheckIcon />Manual ko'rib chiqish tizimi</li>
              <li className="flex items-center gap-3"><CheckIcon />Leaderboard va puxta statistika</li>
              <li className="flex items-center gap-3"><CheckIcon />Birinchi darajali yordami</li>
            </ul>

            <button
              type="button"
              onClick={() => handleUpgrade(proPlanType)}
              className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Yakshanitish
            </button>
          </article>

          <article className="relative rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
            <div className="absolute -top-3 left-5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Faqat 30 foydalanuvchi
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Founder Lifetime</h2>
            <p className="mt-1 text-sm text-slate-600">Premium bir martalik founder kirishi</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">990,000 UZS</p>
            <p className="mt-1 text-sm text-slate-500">Bir martalik to'lov. Takroriy xarajatlar yo'q.</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />Pro'dagi hamma narsa</li>
              <li className="flex items-center gap-3"><CheckIcon />Umrbod kirish</li>
              <li className="flex items-center gap-3"><CheckIcon muted />Founder uchun special taklif</li>
            </ul>

            <button
              type="button"
              onClick={() => handleUpgrade('lifetime')}
              className="mt-8 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Yakshanitish
            </button>
          </article>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Xususiyat taqqoslash</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Xususiyat</th>
                  <th className="py-3 pr-4 font-medium">Bepul</th>
                  <th className="py-3 pr-4 font-medium">Pro</th>
                  <th className="py-3 font-medium">Founder Lifetime</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Testlar</td>
                  <td className="py-3 pr-4">1 ta faol</td>
                  <td className="py-3 pr-4">Cheksiz</td>
                  <td className="py-3">Cheksiz</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Submissionlar</td>
                  <td className="py-3 pr-4">50 maksimal</td>
                  <td className="py-3 pr-4">Cheksiz</td>
                  <td className="py-3">Cheksiz</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Rasch scoring</td>
                  <td className="py-3 pr-4"><CrossIcon /></td>
                  <td className="py-3 pr-4"><CheckIcon /></td>
                  <td className="py-3"><CheckIcon /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Manual ko'rib chiqish</td>
                  <td className="py-3 pr-4"><CrossIcon /></td>
                  <td className="py-3 pr-4"><CheckIcon /></td>
                  <td className="py-3"><CheckIcon /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Yordami</td>
                  <td className="py-3 pr-4">Jamoa</td>
                  <td className="py-3 pr-4">Birinchi</td>
                  <td className="py-3">Birinchi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Tez-tez so'raladigan savollar</h3>
          <div className="mt-4 space-y-3">
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">Men har vaqt bekor qila olamanmi?</summary>
              <p className="mt-2 text-sm text-slate-600">Ha. Siz Pro obunani istalgan vaqtda billing sozlamalaridan bekor qilishingiz mumkin.</p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">Obuna tugasa nima bo'ladi?</summary>
              <p className="mt-2 text-sm text-slate-600">Sizning ish fazoingiz Bepul limitlarga o'tadi. Mavjud ma'lumotlar saqlanadi, lekin Pro-xususiyatlari qulflanadi.</p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">Lifetime haqiqatan umrbod mi?</summary>
              <p className="mt-2 text-sm text-slate-600">Ha. Founder Lifetime - bir martalik sotib olish bo'lib, kiritilgan xususiyatlari uchun takroriy xarajatlar yo'q.</p>
            </details>
          </div>
        </section>
      </main>
    </div>
  )
}
