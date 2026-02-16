import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteTestRecord, getSubmissionsByTestId, getTests } from './lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getCreatorPlan } from './lib/subscription'
import { getPublicTestUrl } from './lib/urls'

const formatDate = (isoDate) => {
  if (!isoDate) return '-'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const plan = getCreatorPlan()
  const isPro = plan === PLAN_PRO
  const [, setRefreshTick] = useState(0)

  const tests = getTests()

  useEffect(() => {
    sessionStorage.setItem('nexo_creator_mode', '1')
  }, [])

  const testsWithStats = useMemo(() => {
    return tests.map(test => {
      const submissions = getSubmissionsByTestId(test.id)
      const pending = submissions.filter(s => s.status === 'pending_review').length
      return {
        ...test,
        submissionsCount: submissions.length,
        pendingCount: pending
      }
    })
  }, [tests])

  const handleDeleteTest = (testId) => {
    const confirmed = window.confirm('Rostdan ham bu imtihonni ochirmoqchimisiz? Barcha submissionlar ham ochiriladi.')
    if (!confirmed) return

    const deleted = deleteTestRecord(testId)
    if (!deleted) {
      alert('Imtihonni ochirishda xatolik boldi')
      return
    }

    setRefreshTick(v => v + 1)
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-blue-600">Nexo</h1>
            <p className="text-slate-600 text-sm">Dashboard</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Chiqish
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Salom, Otabek!</h2>
          <p className="text-slate-600">Sizning imtihonlaringiz va testlaringiz bilan ishlang</p>
        </div>

        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${isPro ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
          <p>
            Joriy plan: <span className="font-semibold">{isPro ? 'Pro' : 'Free'}</span>
          </p>
          {!isPro && (
            <p className="mt-1">
              Free limitlar: {FREE_LIMITS.activeTests} ta test, {FREE_LIMITS.questionsPerTest} ta savol/test, {FREE_LIMITS.submissionsPerTest} ta submission/test.
            </p>
          )}
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/create-test')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            + Yangi Imtihon Yaratish
          </button>
          <button
            onClick={() => navigate('/plans')}
            className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg border border-blue-300 hover:bg-blue-50 transition"
          >
            Planlar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Yaratilgan Imtihonlar</h3>
          </div>

          {testsWithStats.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {testsWithStats.map((test) => {
                const shareLink = getPublicTestUrl(test.id)
                return (
                  <div
                    key={test.id}
                    className="px-8 py-6 hover:bg-slate-50 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-slate-800">{test.testData.title}</h4>
                      <div className="mt-2 flex gap-4 text-sm text-slate-600 flex-wrap">
                        <span>Sana: {formatDate(test.createdAt)}</span>
                        <span>Savollar: {test.questions.length}</span>
                        <span>Javoblar: {test.submissionsCount}</span>
                        <span>Kutilayotgan review: {test.pendingCount}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 break-all">Link: {shareLink}</p>
                    </div>

                    <div className="flex gap-2 ml-4 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(shareLink)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition text-sm font-medium"
                      >
                        Link Nusxalash
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(shareLink, '_blank')}
                        className="px-3 py-1 text-slate-700 hover:bg-slate-200 rounded transition text-sm font-medium"
                      >
                        Testni Ochish
                      </button>
                      <Link
                        to={`/test/${test.id}/results`}
                        className="px-3 py-1 text-violet-700 hover:bg-violet-50 rounded transition text-sm font-medium"
                      >
                        Leaderboard
                      </Link>
                      <Link
                        to={`/test/${test.id}/review`}
                        className="px-3 py-1 text-emerald-700 hover:bg-emerald-50 rounded transition text-sm font-medium"
                      >
                        Javoblarni Baholash
                      </Link>
                      <Link
                        to={`/edit-test/${test.id}`}
                        className="px-3 py-1 text-amber-700 hover:bg-amber-50 rounded transition text-sm font-medium"
                      >
                        Update
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(test.id)}
                        className="px-3 py-1 text-red-700 hover:bg-red-50 rounded transition text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-8 py-12 text-center text-slate-600">
              <p className="text-lg">Hali imtihon yaratilmagan</p>
              <p className="text-sm mt-2">Yangi imtihon yaratishni boshlang</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
