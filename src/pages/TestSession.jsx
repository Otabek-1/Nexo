import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { createSubmissionRecord, getAttemptsForParticipantValue, getSubmissionsByTestId, getTestById } from '../lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getPlanForTest } from '../lib/subscription'

const getQuestionMaxScore = (question, scoringType) => {
  if (scoringType === 'rasch' || question.type === 'essay') {
    const parsed = Number(question.points)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }

  if (question.type === 'multiple-choice' || question.type === 'true-false') return 1
  return 0
}

const INITIAL_NOW_TS = new Date().getTime()

export default function TestSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const test = getTestById(id)
  const creatorPlan = getPlanForTest(test)
  const isPro = creatorPlan === PLAN_PRO
  const participantFields = useMemo(() => {
    if (!test) return []
    const configured = Array.isArray(test.testData?.participantFields) ? test.testData.participantFields : []
    const hasFullName = configured.some(field => field.id === 'fullName')

    if (configured.length === 0) {
      return [
        { id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true },
        { id: 'phone', label: 'Phone', type: 'tel', required: true, locked: false }
      ]
    }

    return hasFullName
      ? configured
      : [{ id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true }, ...configured]
  }, [test])
  const [participantValues, setParticipantValues] = useState({})
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [nowTs, setNowTs] = useState(INITIAL_NOW_TS)

  const requiresManualReview = useMemo(() => {
    if (!test) return false
    return test.testData.scoringType === 'rasch' || test.questions.some(q => q.type === 'essay' || q.type === 'short-answer')
  }, [test])

  const timing = useMemo(() => {
    if (!test) return { status: 'active', startMs: null, endMs: null, remainingMs: 0 }

    const startMs = new Date(test.testData.startTime).getTime()
    const endMs = new Date(test.testData.endTime).getTime()
    const hasValidWindow = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs

    if (!hasValidWindow) {
      return { status: 'active', startMs: null, endMs: null, remainingMs: 0 }
    }

    if (nowTs < startMs) {
      return { status: 'pending', startMs, endMs, remainingMs: startMs - nowTs }
    }

    if (nowTs >= endMs) {
      return { status: 'ended', startMs, endMs, remainingMs: 0 }
    }

    return { status: 'active', startMs, endMs, remainingMs: endMs - nowTs }
  }, [test, nowTs])

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!test) return
    if (timing.status !== 'ended') return
    navigate(`/test/${test.id}/results`, { replace: true })
  }, [timing.status, test, navigate])

  const formatCountdown = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0')
    const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
    const ss = String(totalSec % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Test topilmadi</h1>
          <p className="text-slate-600">Link xato yoki test o'chirilgan bo'lishi mumkin.</p>
          <Link to="/" className="inline-block mt-4 text-blue-600 hover:underline">Bosh sahifaga qaytish</Link>
        </div>
      </div>
    )
  }

  const handleStart = (e) => {
    e.preventDefault()

    const normalizedParticipant = {}
    for (const field of participantFields) {
      const value = String(participantValues[field.id] || '').trim()
      if (field.required && !value) {
        alert(`"${field.label}" maydonini toliq kiriting`)
        return
      }
      normalizedParticipant[field.id] = value
    }

    const attemptValue = normalizedParticipant.fullName || ''
    if (!attemptValue) {
      alert('Full Name maydoni majburiy')
      return
    }

    const attemptCount = getAttemptsForParticipantValue(test.id, attemptValue)
    if (attemptCount >= Number(test.testData.attemptsCount)) {
      alert('Bu participant uchun urinish limiti tugagan')
      return
    }

    if (!isPro && getSubmissionsByTestId(test.id).length >= FREE_LIMITS.submissionsPerTest) {
      alert(`Bu test Free limitiga yetgan (${FREE_LIMITS.submissionsPerTest} ta submission). Creator Pro ni yoqishi kerak.`)
      return
    }

    setParticipantValues(normalizedParticipant)
    setStarted(true)
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const submitTest = () => {
    const answersByQuestion = {}
    test.questions.forEach(question => {
      answersByQuestion[question.id] = answers[question.id] ?? ''
    })

    let autoScore = 0
    let autoMaxScore = 0

    test.questions.forEach(question => {
      const answer = answersByQuestion[question.id]
      const max = getQuestionMaxScore(question, test.testData.scoringType)
      const isAutoGradable = question.type === 'multiple-choice' || question.type === 'true-false'

      if (isAutoGradable) {
        autoMaxScore += max
        if (String(answer) === String(question.correctAnswer)) {
          autoScore += max
        }
      }
    })

    const status = requiresManualReview ? 'pending_review' : 'completed'
    const submission = {
      id: crypto.randomUUID(),
      testId: test.id,
      participant: {
        fullName: participantValues.fullName || '',
        phone: participantValues.phone || '',
        fields: participantValues,
        attemptValue: participantValues.fullName || ''
      },
      answers: answersByQuestion,
      autoScore,
      autoMaxScore,
      finalScore: status === 'completed' ? autoScore : null,
      status,
      submittedAt: new Date().toISOString(),
      manualGrades: {},
      reviewedAt: null
    }

    createSubmissionRecord(submission)
    setSubmitted(submission)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Nexo</h1>
          <div className="text-sm text-slate-600">Test ID: {test.id}</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{test.testData.title}</h2>
          <p className="text-slate-600 mt-2">{test.testData.description || 'Tavsif kiritilmagan'}</p>
          <div className="mt-4 flex gap-4 flex-wrap text-sm text-slate-700">
            <span>Davomiylik: {test.testData.duration} daqiqa</span>
            <span>Urinishlar: {test.testData.attemptsCount}</span>
            <span>Baholash: {test.testData.scoringType === 'rasch' ? 'Rasch Model' : 'Klassik'}</span>
          </div>
          {test.testData.scoringType === 'rasch' && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Rasch tanlangan: natijalar real time chiqarilmaydi.
            </div>
          )}
        </div>

        {!started && !submitted && timing.status === 'pending' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-800">{test.testData.title}</h3>
            <p className="text-slate-600 mt-2">{test.testData.description || 'Tavsif kiritilmagan'}</p>
            <div className="mt-6 inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-5 py-3">
              <span className="text-sm text-blue-900 font-medium">
                Boshlanishiga {formatCountdown(timing.remainingMs)} vaqt qoldi
              </span>
            </div>
          </div>
        )}

        {!started && !submitted && timing.status === 'active' && (
          <form onSubmit={handleStart} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Testni boshlash</h3>
            {participantFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label} {field.required ? '*' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={participantValues[field.id] ?? ''}
                    onChange={(e) => setParticipantValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required={Boolean(field.required)}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={participantValues[field.id] ?? ''}
                    onChange={(e) => setParticipantValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    required={Boolean(field.required)}
                  />
                )}
              </div>
            ))}
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Boshlash
            </button>
          </form>
        )}

        {started && !submitted && (
          <div className="space-y-4">
            {test.questions.map((question, idx) => (
              <div key={question.id} className="bg-white border border-slate-200 rounded-xl p-6">
                <h4 className="font-semibold text-slate-800 mb-3">{idx + 1}. {question.content}</h4>

                {question.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <label key={`${question.id}-${i}`} className="flex items-center gap-2 text-slate-700">
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={i}
                          checked={String(answers[question.id] ?? '') === String(i)}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                        <span>{String.fromCharCode(65 + i)}. {option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-slate-700">
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value="true"
                        checked={answers[question.id] === 'true'}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      />
                      Togri
                    </label>
                    <label className="flex items-center gap-2 text-slate-700">
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        value="false"
                        checked={answers[question.id] === 'false'}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      />
                      Notogri
                    </label>
                  </div>
                )}

                {(question.type === 'essay' || question.type === 'short-answer') && (
                  <textarea
                    value={answers[question.id] ?? ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="Javobingizni yozing"
                  />
                )}
              </div>
            ))}

            <button onClick={submitTest} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Testni Yakunlash
            </button>
          </div>
        )}

        {submitted && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-slate-800">Test qabul qilindi</h3>
            {submitted.status === 'completed' ? (
              <p className="mt-2 text-slate-700">Natija: {submitted.finalScore} / {submitted.autoMaxScore}</p>
            ) : (
              <p className="mt-2 text-amber-700">
                Javoblar qabul qilindi. Natija hozircha chiqarilmaydi, admin tekshiruvdan keyin yakuniy baho beriladi.
              </p>
            )}
            <div className="mt-4">
              <Link
                to={`/test/${test.id}/results`}
                className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Leaderboardni ko'rish
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
