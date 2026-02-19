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
  const [upgradeModal, setUpgradeModal] = useState({ open: false, planType: '' })

  const isYearly = billingCycle === 'yearly'

  const handleUpgrade = (planType) => {
    setUpgradeModal({ open: true, planType })
  }

  const handleGetStarted = async () => {
    await setCreatorPlan(PLAN_FREE)
    navigate('/dashboard')
  }

  const proPriceLabel = isYearly ? '549,000 UZS / year' : '59,000 UZS / month'
  const proPlanType = isYearly ? 'pro_yearly' : 'pro_monthly'
  const selectedPlanLabel = upgradeModal.planType === 'lifetime' ? 'Founder Lifetime' : 'Pro'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
            <p className="mt-1 text-sm text-slate-600">Simple plans for schools, teachers, and exam organizers.</p>
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
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isYearly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Yearly
            </button>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">2 months free</span>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Free</h2>
            <p className="mt-1 text-sm text-slate-600">For trying out Nexo basics</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">0 UZS</p>
            <p className="mt-1 text-sm text-slate-500">Forever free</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />1 active test</li>
              <li className="flex items-center gap-3"><CheckIcon />Up to 50 submissions</li>
              <li className="flex items-center gap-3"><CheckIcon />Basic scoring (correct/incorrect)</li>
              <li className="flex items-center gap-3"><CrossIcon />No Rasch scoring</li>
              <li className="flex items-center gap-3"><CrossIcon />No advanced analytics</li>
              <li className="flex items-center gap-3"><CheckIcon />Community support</li>
            </ul>

            <button
              type="button"
              onClick={handleGetStarted}
              className="mt-8 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Get Started
            </button>
          </article>

          <article className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-md">
            <div className="absolute -top-3 left-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
              Recommended
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Pro</h2>
            <p className="mt-1 text-sm text-slate-600">For serious exam operations</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">{proPriceLabel}</p>
            {isYearly && (
              <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                2 months free
              </div>
            )}

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />Unlimited tests</li>
              <li className="flex items-center gap-3"><CheckIcon />Unlimited submissions</li>
              <li className="flex items-center gap-3"><CheckIcon />Rasch scoring enabled</li>
              <li className="flex items-center gap-3"><CheckIcon />Manual review system</li>
              <li className="flex items-center gap-3"><CheckIcon />Leaderboard and advanced stats</li>
              <li className="flex items-center gap-3"><CheckIcon />Priority support</li>
            </ul>

            <button
              type="button"
              onClick={() => handleUpgrade(proPlanType)}
              className="mt-8 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Tarifni Yoqish
            </button>
          </article>

          <article className="relative rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
            <div className="absolute -top-3 left-5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Limited to 30 users only
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Founder Lifetime</h2>
            <p className="mt-1 text-sm text-slate-600">Premium one-time founder access</p>
            <p className="mt-5 text-3xl font-semibold text-slate-900">990,000 UZS</p>
            <p className="mt-1 text-sm text-slate-500">One-time payment. No recurring charges.</p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-3"><CheckIcon />Everything in Pro</li>
              <li className="flex items-center gap-3"><CheckIcon />Lifetime access</li>
              <li className="flex items-center gap-3"><CheckIcon muted />Founder-only launch offer</li>
            </ul>

            <button
              type="button"
              onClick={() => handleUpgrade('lifetime')}
              className="mt-8 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Tarifni Yoqish
            </button>
          </article>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Feature comparison</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Feature</th>
                  <th className="py-3 pr-4 font-medium">Free</th>
                  <th className="py-3 pr-4 font-medium">Pro</th>
                  <th className="py-3 font-medium">Founder Lifetime</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Tests</td>
                  <td className="py-3 pr-4">1 active</td>
                  <td className="py-3 pr-4">Unlimited</td>
                  <td className="py-3">Unlimited</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Submissions</td>
                  <td className="py-3 pr-4">50 max</td>
                  <td className="py-3 pr-4">Unlimited</td>
                  <td className="py-3">Unlimited</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Rasch scoring</td>
                  <td className="py-3 pr-4"><CrossIcon /></td>
                  <td className="py-3 pr-4"><CheckIcon /></td>
                  <td className="py-3"><CheckIcon /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">Manual review</td>
                  <td className="py-3 pr-4"><CrossIcon /></td>
                  <td className="py-3 pr-4"><CheckIcon /></td>
                  <td className="py-3"><CheckIcon /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Support</td>
                  <td className="py-3 pr-4">Community</td>
                  <td className="py-3 pr-4">Priority</td>
                  <td className="py-3">Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">FAQ</h3>
          <div className="mt-4 space-y-3">
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">Can I cancel anytime?</summary>
              <p className="mt-2 text-sm text-slate-600">Yes. You can cancel your Pro subscription at any time from billing settings.</p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">What happens when subscription ends?</summary>
              <p className="mt-2 text-sm text-slate-600">Your workspace moves to Free limits. Existing data is preserved, but Pro-only features are locked.</p>
            </details>
            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">Is Lifetime really lifetime?</summary>
              <p className="mt-2 text-sm text-slate-600">Yes. Founder Lifetime is a one-time purchase with no recurring charges for the included features.</p>
            </details>
          </div>
        </section>
      </main>

      {upgradeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">{selectedPlanLabel} tarifini yoqish</h3>
            <p className="mt-2 text-sm text-slate-600">
              To'lov tizimi to'liq ulanmaguncha tariflar qo'lda aktiv qilinadi.
            </p>

            <div className="mt-5 rounded-xl bg-slate-950 p-5 text-slate-100">
              <p className="text-sm leading-7">
                Siz <span className="font-semibold">{selectedPlanLabel}</span> tarifini yoqmoqchisiz.
              </p>
              <p className="mt-4 text-sm leading-7">Aktivatsiya qilish tartibi:</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7">
                <li>Telegram orqali biz bilan bog'laning</li>
                <li>To'lov bo'yicha ma'lumotlarni yuboramiz</li>
                <li>Hisobingiz bir necha daqiqada aktiv qilinadi</li>
              </ol>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <a
                href="https://t.me/i_am_nobody2038"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                Telegram orqali bog'lanish (@i_am_nobody2038)
              </a>
              <button
                type="button"
                onClick={() => setUpgradeModal({ open: false, planType: '' })}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
