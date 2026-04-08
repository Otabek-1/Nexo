import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { finalizeSubmission, getSubmissionsByTestId, getTestById, saveManualGrade } from '../lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getPlanForTest } from '../lib/subscription'
import RichContent from '../components/RichContent'
import { compareCellAnswers } from '../lib/cellAnswer'
import ButtonSpinner from '../components/ButtonSpinner'

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
  const [test, setTest] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const isCreatorMode = sessionStorage.getItem('nexo_creator_mode') === '1'
  const creatorPlan = getPlanForTest(test || {})
  const isPro = creatorPlan === PLAN_PRO

  const [refreshTick, setRefreshTick] = useState(0)
  const [finalizingSubmissionId, setFinalizingSubmissionId] = useState(null)
  const visibleSubmissions = isPro ? submissions : submissions.slice(0, FREE_LIMITS.manualReviewRecent)
  const reviewQuestions = test?.questions || []
  const manualReviewQuestions = reviewQuestions.filter(q => q.type === 'essay' || q.type === 'short-answer')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const fetchedTest = await getTestById(id)
        if (!mounted) return
        setTest(fetchedTest)
        if (fetchedTest?.id) {
          const rows = await getSubmissionsByTestId(fetchedTest.id)
          if (!mounted) return
          setSubmissions(Array.isArray(rows) ? rows : [])
        } else {
          setSubmissions([])
        }
      } catch (error) {
        console.error('[ReviewSubmissions] load failed:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id, refreshTick])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Yuklanmoqda...</h1>
        </div>
      </div>
    )
  }

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

  const saveManualGradeField = async (submissionId, questionId, value) => {
    const raw = Number(value)
    const safe = Number.isFinite(raw) ? raw : 0
    if (!test) return
    const updated = await saveManualGrade(test.id, submissionId, questionId, safe)
    setSubmissions(prev => prev.map(item => (item.id === submissionId ? updated : item)))
    setRefreshTick(v => v + 1)
  }

  const finalizeCurrentSubmission = async (submission) => {
    if (finalizingSubmissionId) return
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

    setFinalizingSubmissionId(submission.id)
    try {
      const updated = await finalizeSubmission(test.id, submission.id, test.testData.scoringType === 'rasch' ? null : finalScore)
      setSubmissions(prev => prev.map(item => (item.id === submission.id ? updated : item)))
      setRefreshTick(v => v + 1)
    } finally {
      setFinalizingSubmissionId(null)
    }
  }

  const getAutoCheckMeta = (question, rawAnswer) => {
    if (!question) return null

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const isCorrect = String(rawAnswer ?? '') === String(question.correctAnswer ?? '')
      return {
        isCorrect,
        userAnswer: formatObjectiveAnswer(question, rawAnswer),
        correctAnswer: formatObjectiveAnswer(question, question.correctAnswer)
      }
    }

    if (question.type === 'two-part-written') {
      const parsed = parseTwoPartAnswer(rawAnswer)
      const firstCorrect = String(question.twoPartCorrectAnswers?.[0] || '')
      const secondCorrect = String(question.twoPartCorrectAnswers?.[1] || '')
      const firstMatched = compareCellAnswers(parsed.first, firstCorrect)
      const secondMatched = compareCellAnswers(parsed.second, secondCorrect)
      return {
        isCorrect: firstMatched && secondMatched,
        userAnswer: `a) ${parsed.first || "(Bo'sh)"} | b) ${parsed.second || "(Bo'sh)"}`,
        correctAnswer: `a) ${firstCorrect || "(Bo'sh)"} | b) ${secondCorrect || "(Bo'sh)"}`,
        note: `a) ${firstMatched ? "to'g'ri" : "noto'g'ri"}, b) ${secondMatched ? "to'g'ri" : "noto'g'ri"}`
      }
    }

    return null
  }

  const formatObjectiveAnswer = (question, value) => {
    if (question.type === 'multiple-choice') {
      const index = Number(value)
      if (!Number.isInteger(index) || index < 0) return "(Bo'sh)"
      const option = question.options?.[index]
      return option ? `${String.fromCharCode(65 + index)}. ${stripHtml(option)}` : `${String.fromCharCode(65 + index)}`
    }
    if (question.type === 'true-false') {
      if (value === 'true') return "To'g'ri"
      if (value === 'false') return "Noto'g'ri"
      return "(Bo'sh)"
    }
    return String(value || '').trim() || "(Bo'sh)"
  }

  const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  const parseTwoPartAnswer = (value) => {
    if (!value) return { first: '', second: '' }
    try {
      const parsed = JSON.parse(String(value))
      return {
        first: String(parsed?.first || ''),
        second: String(parsed?.second || '')
      }
    } catch {
      return { first: '', second: '' }
    }
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
            <p className="text-sm text-amber-700 mt-2">Rasch bo'lgani uchun yakuniy ball cohort bo'yicha avtomatik kalibrlanadi va qo'lda override qilinmaydi.</p>
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

              {reviewQuestions.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {reviewQuestions.map((question, index) => {
                    const autoCheckMeta = getAutoCheckMeta(question, submission.answers?.[question.id])
                    const isManual = question.type === 'essay' || question.type === 'short-answer'
                    return (
                    <div key={question.id} className="border border-slate-200 rounded-lg p-4">
                      <p className="font-medium text-slate-800">{index + 1}.</p>
                      <RichContent html={question.content} className="text-slate-800 mt-1" />
                      {isManual ? (
                        <>
                          <p className="text-sm text-slate-600 mt-2">Javob: {submission.answers?.[question.id] || "(Bo'sh)"}</p>
                          <div className="mt-3 max-w-xs">
                            <label className="block text-sm text-slate-700 mb-1">Ball (max {getQuestionPoints(question)})</label>
                            <input
                              type="number"
                              min="0"
                              max={getQuestionPoints(question)}
                              value={submission.manualGrades?.[question.id] ?? ''}
                              onChange={(e) => saveManualGradeField(submission.id, question.id, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${autoCheckMeta?.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {autoCheckMeta?.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                            </span>
                            {autoCheckMeta?.note && (
                              <span className="text-slate-500">{autoCheckMeta.note}</span>
                            )}
                          </div>
                          <p className="text-slate-700"><span className="font-medium">Berilgan javob:</span> {autoCheckMeta?.userAnswer}</p>
                          <p className="text-slate-700"><span className="font-medium">To'g'ri javob:</span> {autoCheckMeta?.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              ) : (
                <p className="text-sm text-slate-600 mt-4">Bu testda yozma savollar yoq.</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-700">Yakuniy ball: {submission.finalScore ?? '-'}</span>
                <button
                  type="button"
                  onClick={() => finalizeCurrentSubmission(submission)}
                  disabled={!isPro || finalizingSubmissionId === submission.id}
                  className={`px-4 py-2 rounded-lg ${isPro ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'} disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {isPro ? (
                    <span className="inline-flex items-center gap-2">
                      {finalizingSubmissionId === submission.id && <ButtonSpinner className="h-3.5 w-3.5" />}
                      {finalizingSubmissionId === submission.id ? 'Saqlanmoqda...' : 'Saqlash va Yakunlash'}
                    </span>
                  ) : 'Pro talab qilinadi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
