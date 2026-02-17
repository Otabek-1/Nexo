import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSubmissionsByTestId, getTestById, updateSubmissionRecord } from '../lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getPlanForTest } from '../lib/subscription'
import RichContent from '../components/RichContent'

const getQuestionPoints = (question) => {
  const parsed = Number(question.points)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const getParticipantSecondary = (participant) => {
  if (!participant) return '-'
  if (participant.phone) return participant.phone

  const fields = participant.fields || {}
  const extra = Object.entries(fields).find(([key, value]) => key !== 'fullName' && String(value || '').trim())
  return extra ? String(extra[1]) : '-'
}

export default function ReviewSubmissions() {
  const { id } = useParams()
  const test = getTestById(id)
  const isCreatorMode = sessionStorage.getItem('nexo_creator_mode') === '1'
  const creatorPlan = getPlanForTest(test)
  const isPro = creatorPlan === PLAN_PRO

  const [, setRefreshTick] = useState(0)
  const submissions = test ? getSubmissionsByTestId(test.id) : []
  const visibleSubmissions = isPro ? submissions : submissions.slice(0, FREE_LIMITS.manualReviewRecent)
  const manualReviewQuestions = test
    ? test.questions.filter(q => q.type === 'essay' || q.type === 'short-answer')
    : []

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Test topilmadi</h1>
          <Link to="/dashboard" className="inline-block mt-4 text-blue-600 hover:underline">Dashboardga qaytish</Link>
        </div>
      </div>
    )
  }

  if (!isCreatorMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ruxsat yo'q</h1>
          <p className="text-slate-600">Bu bo'lim faqat test yaratuvchisi/admin uchun.</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:underline">Bosh sahifaga qaytish</Link>
        </div>
      </div>
    )
  }

  const saveManualGrade = (submissionId, questionId, value) => {
    const raw = Number(value)
    const safe = Number.isFinite(raw) ? raw : 0
    updateSubmissionRecord(submissionId, prev => ({
      ...prev,
      manualGrades: {
        ...(prev.manualGrades || {}),
        [questionId]: safe
      }
    }))
    setRefreshTick(v => v + 1)
  }

  const finalizeSubmission = (submission) => {
    if (!isPro) {
      alert('Finalize qilish Pro plan uchun ochiq. /plans bo`limida Pro ni yoqing.')
      return
    }

    const manualGrades = submission.manualGrades || {}

    let essayTotal = 0
    manualReviewQuestions.forEach(question => {
      const value = Number(manualGrades[question.id] || 0)
      const max = getQuestionPoints(question)
      essayTotal += Math.max(0, Math.min(value, max))
    })

    let finalScore = submission.autoScore + essayTotal

    if (test.testData.scoringType === 'rasch') {
      const custom = prompt('Rasch uchun yakuniy ballni kiriting', String(finalScore))
      if (custom === null) return
      const parsed = Number(custom)
      if (!Number.isFinite(parsed) || parsed < 0) {
        alert('Yakuniy ball notogri')
        return
      }
      finalScore = parsed
    }

    updateSubmissionRecord(submission.id, prev => ({
      ...prev,
      finalScore,
      status: 'completed',
      reviewedAt: new Date().toISOString(),
      manualGrades: prev.manualGrades || {}
    }))

    setRefreshTick(v => v + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Nexo</h1>
            <p className="text-sm text-slate-600">Yozma javoblarni baholash</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{test.testData.title}</h2>
          <p className="text-slate-600 mt-2">Baholash turi: {test.testData.scoringType === 'rasch' ? 'Rasch Model' : 'Klassik'}</p>
          {test.testData.scoringType === 'rasch' && (
            <p className="text-sm text-amber-700 mt-2">Rasch bo'lgani uchun yakuniy ballni admin qo'lda tasdiqlaydi.</p>
          )}
          {!isPro && (
            <p className="text-sm text-amber-700 mt-2">
              Free plan: faqat oxirgi {FREE_LIMITS.manualReviewRecent} ta submission uchun manual review ochiq, finalize Pro'da.
            </p>
          )}
        </div>

        {submissions.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-600">Hali submission yoq.</div>
        )}

        {!isPro && submissions.length > visibleSubmissions.length && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            {submissions.length - visibleSubmissions.length} ta eski submission Free planda yashirilgan. Barchasi uchun Pro kerak.
          </div>
        )}

        <div className="space-y-4">
          {visibleSubmissions.map((submission) => (
            <div key={submission.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {submission.participant?.fullName || 'Ismsiz participant'} ({getParticipantSecondary(submission.participant)})
                  </h3>
                  <p className="text-sm text-slate-600">Holat: {submission.status === 'completed' ? 'Baholangan' : 'Tekshirilmoqda'}</p>
                </div>
                <div className="text-sm text-slate-700">Auto: {submission.autoScore} / {submission.autoMaxScore}</div>
              </div>

              {manualReviewQuestions.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {manualReviewQuestions.map((question, index) => (
                    <div key={question.id} className="border border-slate-200 rounded-lg p-4">
                      <p className="font-medium text-slate-800">{index + 1}.</p>
                      <RichContent html={question.content} className="text-slate-800 mt-1" />
                      <p className="text-sm text-slate-600 mt-2">Javob: {submission.answers?.[question.id] || '(Bo`sh)'}</p>
                      <div className="mt-3 max-w-xs">
                        <label className="block text-sm text-slate-700 mb-1">Ball (max {getQuestionPoints(question)})</label>
                        <input
                          type="number"
                          min="0"
                          max={getQuestionPoints(question)}
                          value={submission.manualGrades?.[question.id] ?? ''}
                          onChange={(e) => saveManualGrade(submission.id, question.id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 mt-4">Bu testda yozma savollar yoq.</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-700">Yakuniy ball: {submission.finalScore ?? '-'}</span>
                <button
                  type="button"
                  onClick={() => finalizeSubmission(submission)}
                  className={`px-4 py-2 rounded-lg ${isPro ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                >
                  {isPro ? 'Saqlash va Yakunlash' : 'Pro talab qilinadi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
