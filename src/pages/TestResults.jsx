import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSubmissionsByTestId, getTestById } from '../lib/testStore'

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const getParticipantSecondary = (participant) => {
  if (!participant) return '-'
  if (participant.phone) {
    const cleaned = String(participant.phone)
    if (cleaned.length < 4) return cleaned
    return `${cleaned.slice(0, 4)}***${cleaned.slice(-2)}`
  }

  const fields = participant.fields || {}
  const extra = Object.entries(fields).find(([key, value]) => key !== 'fullName' && String(value || '').trim())
  return extra ? String(extra[1]) : '-'
}

export default function TestResults() {
  const { id } = useParams()
  const test = getTestById(id)

  const { ranked, pending } = useMemo(() => {
    if (!test) return { ranked: [], pending: [] }

    const submissions = getSubmissionsByTestId(test.id)
    const done = submissions
      .filter(s => s.status === 'completed' && Number.isFinite(Number(s.finalScore)))
      .sort((a, b) => {
        const scoreDiff = Number(b.finalScore) - Number(a.finalScore)
        if (scoreDiff !== 0) return scoreDiff
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      })

    const waiting = submissions
      .filter(s => s.status !== 'completed')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return { ranked: done, pending: waiting }
  }, [test])

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Test topilmadi</h1>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:underline">Bosh sahifaga qaytish</Link>
        </div>
      </div>
    )
  }

  const topThree = ranked.slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Nexo</h1>
            <p className="text-sm text-slate-600">Leaderboard & Results</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/test/${test.id}`} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">Testga o'tish</Link>
            <Link to="/dashboard" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-slate-800">{test.testData.title}</h2>
          <p className="text-slate-600 mt-1">ID: {test.id}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
            <span>Yakunlangan: {ranked.length}</span>
            <span>Kutilayotgan review: {pending.length}</span>
            <span>Jami topshirganlar: {ranked.length + pending.length}</span>
          </div>
        </div>

        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((entry, index) => (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-sm text-slate-500">#{index + 1} o'rin</p>
                <p className="text-lg font-semibold text-slate-800 mt-1">{entry.participant?.fullName || 'Ismsiz participant'}</p>
                <p className="text-sm text-slate-600">{getParticipantSecondary(entry.participant)}</p>
                <p className="mt-3 text-2xl font-bold text-emerald-700">{entry.finalScore}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">To'liq Reyting</h3>
          </div>

          {ranked.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {ranked.map((entry, index) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">#{index + 1} {entry.participant?.fullName || 'Ismsiz participant'}</p>
                    <p className="text-sm text-slate-600">{getParticipantSecondary(entry.participant)} | {formatDateTime(entry.submittedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{entry.finalScore}</p>
                    <p className="text-xs text-slate-500">final score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-slate-600">Hali yakuniy natijalar yo'q.</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">Kutilayotgan Tekshiruvlar</h3>
          </div>
          {pending.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {pending.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{entry.participant?.fullName || 'Ismsiz participant'}</p>
                    <p className="text-sm text-slate-600">{getParticipantSecondary(entry.participant)} | {formatDateTime(entry.submittedAt)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">Pending Review</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-slate-600">Pending submission yo'q.</div>
          )}
        </div>
      </main>
    </div>
  )
}
