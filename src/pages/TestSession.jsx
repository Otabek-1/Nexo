import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { createSubmissionRecord, getAttemptsForParticipantValue, getTestById } from '../lib/testStore'
import RichContent from '../components/RichContent'
import AppFooter from '../components/AppFooter'
import {
  answerTextToCells,
  cellsToAnswerText,
  compareCellAnswers,
  formatCellTokenDisplay,
  normalizeCellToken,
  tokenizeIntoCells
} from '../lib/cellAnswer'

const TWO_PART_WRITTEN_TYPE = 'two-part-written'

// ─── Helpers ────────────────────────────────────────────────────────────────

const getQuestionMaxScore = (question, scoringType) => {
  if (scoringType === 'rasch' || question.type === 'essay') {
    const parsed = Number(question.points)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }
  if (
    question.type === 'multiple-choice' ||
    question.type === 'true-false' ||
    question.type === TWO_PART_WRITTEN_TYPE
  ) return 1
  return 0
}

/** Fisher-Yates shuffle — original indekslarni saqlab aralashtiradi */
const shuffleWithIndices = (arr) => {
  const indexed = arr.map((item, originalIdx) => ({ item, originalIdx }))
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
  }
  return indexed
}

const formatCountdown = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// sessionKey: sessionStorage-da saqlanadigan unique kalit
const makeSessionKey = (testId) => `nexo_session_${testId}`

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

const stringifyTwoPartAnswer = (first, second) => JSON.stringify({
  first: String(first || ''),
  second: String(second || '')
})

const isQuestionAnswered = (question, rawAnswer) => {
  if (question?.type === TWO_PART_WRITTEN_TYPE) {
    const parsed = parseTwoPartAnswer(rawAnswer)
    return tokenizeIntoCells(parsed.first).length > 0 && tokenizeIntoCells(parsed.second).length > 0
  }
  return rawAnswer !== undefined && rawAnswer !== ''
}

function CellAnswerInput({ value, onChange, cells = 30 }) {
  const tokens = useMemo(() => answerTextToCells(value, cells), [value, cells])
  const refs = useRef([])

  const focusCell = (index) => {
    const next = refs.current[index]
    if (next) next.focus()
  }

  const updateAt = (index, token) => {
    const next = [...tokens]
    if (token && token !== ' ') {
      // If user jumps ahead and types, keep skipped cells as explicit blanks.
      let lastFilled = -1
      for (let i = index - 1; i >= 0; i--) {
        if (next[i]) {
          lastFilled = i
          break
        }
      }
      for (let i = lastFilled + 1; i < index; i++) {
        if (!next[i]) next[i] = ' '
      }
    }
    next[index] = token
    onChange(cellsToAnswerText(next))
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1.5 min-w-[520px]" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
        {tokens.map((token, index) => (
          <input
            key={index}
            ref={(el) => { refs.current[index] = el }}
            type="text"
            value={formatCellTokenDisplay(token)}
            maxLength={2}
            onChange={(e) => {
              const normalized = normalizeCellToken(e.target.value)
              updateAt(index, normalized)
              if (normalized && index < tokens.length - 1) focusCell(index + 1)
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault()
                updateAt(index, ' ')
                if (index < tokens.length - 1) focusCell(index + 1)
                return
              }
              if (e.key === 'Backspace' && !tokens[index] && index > 0) {
                e.preventDefault()
                focusCell(index - 1)
                return
              }
              if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault()
                focusCell(index - 1)
                return
              }
              if (e.key === 'ArrowRight' && index < tokens.length - 1) {
                e.preventDefault()
                focusCell(index + 1)
              }
            }}
            className={`h-9 w-9 border rounded-sm text-center text-xs font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500
              ${token === ' ' ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Countdown ring component ────────────────────────────────────────────────

function TimerRing({ remainingMs, totalMs, warning = false, danger = false }) {
  const R = 20
  const C = 2 * Math.PI * R
  const ratio = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0
  const dash = C * ratio

  return (
    <svg width="52" height="52" className="flex-shrink-0" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={R} fill="none" strokeWidth="4"
        className="stroke-slate-200" />
      <circle cx="26" cy="26" r={R} fill="none" strokeWidth="4"
        strokeDasharray={`${dash} ${C}`}
        strokeDashoffset={C * 0.25}
        strokeLinecap="round"
        className={danger ? 'stroke-red-500' : warning ? 'stroke-amber-400' : 'stroke-blue-500'}
        style={{ transition: 'stroke-dasharray 0.8s linear' }}
      />
    </svg>
  )
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
        {answered}/{total} javoblandi
      </span>
    </div>
  )
}

// ─── Question nav dots ───────────────────────────────────────────────────────

function QuestionNav({ questions, answers, currentIdx, onGoto }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, idx) => {
        const isAnswered = isQuestionAnswered(q.item, answers[q.item.id])
        const isCurrent = idx === currentIdx
        return (
          <button
            key={q.item.id}
            type="button"
            onClick={() => onGoto(idx)}
            title={`${idx + 1}-savol${isAnswered ? ' (javoblandi)' : ''}`}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
              ${isCurrent
                ? 'bg-blue-600 text-white shadow-sm scale-110'
                : isAnswered
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-white text-slate-500 border border-slate-300 hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            {idx + 1}
          </button>
        )
      })}
    </div>
  )
}

// ─── Confirm modal ───────────────────────────────────────────────────────────

function ConfirmModal({ unanswered, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
        <div className="text-2xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Testni yakunlash</h3>
        {unanswered > 0 ? (
          <p className="text-slate-600 mb-4">
            <span className="font-semibold text-amber-600">{unanswered} ta savol</span> hali javoblanmagan.
            Shunga qaramay testni yakunlamoqchimisiz?
          </p>
        ) : (
          <p className="text-slate-600 mb-4">
            Barcha savollar javoblandi. Testni yakunlashni tasdiqlaysizmi?
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Ha, yakunlash
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Auto-submit toast ───────────────────────────────────────────────────────

function AutoSubmitToast() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm animate-bounce">
      ⏰ Vaqt tugadi! Test avtomatik topshirilmoqda...
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TestSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const row = await getTestById(id)
        if (!mounted) return
        setTest(row)
      } catch (error) {
        console.error('[TestSession] load failed:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  // ── Participant fields ──
  const participantFields = useMemo(() => {
    if (!test) return []
    const configured = Array.isArray(test.testData?.participantFields)
      ? test.testData.participantFields : []
    const hasAttempts = Boolean(test.testData?.attemptsEnabled)
    const hasFullName = configured.some(f => f.id === 'fullName')
    const hasPhone = configured.some(f => f.id === 'phone')
    if (configured.length === 0) {
      return [
        { id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true },
        { id: 'phone', label: 'Phone', type: 'tel', required: hasAttempts, locked: hasAttempts }
      ]
    }
    const base = hasFullName
      ? configured
      : [{ id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true }, ...configured]

    if (!hasAttempts) return base

    const normalizedBase = base.map((field) => (
      field.id === 'phone'
        ? { ...field, type: 'tel', required: true, locked: true, label: field.label || 'Phone' }
        : field
    ))

    if (hasPhone) {
      const fullNameField = normalizedBase.find((field) => field.id === 'fullName') ||
        { id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true }
      const phoneField = normalizedBase.find((field) => field.id === 'phone') ||
        { id: 'phone', label: 'Phone', type: 'tel', required: true, locked: true }
      const rest = normalizedBase.filter((field) => field.id !== 'fullName' && field.id !== 'phone')
      return [fullNameField, phoneField, ...rest]
    }

    const fullNameField = normalizedBase.find((field) => field.id === 'fullName') ||
      { id: 'fullName', label: 'Full Name', type: 'text', required: true, locked: true }
    const rest = normalizedBase.filter((field) => field.id !== 'fullName')
    return [fullNameField, { id: 'phone', label: 'Phone', type: 'tel', required: true, locked: true }, ...rest]
  }, [test])

  // ── States ──
  const [participantValues, setParticipantValues] = useState({})
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const [durationEndTs, setDurationEndTs] = useState(null) // test boshlanganda qo'yiladi

  // ── Shuffled questions (session davomida barqaror) ──
  const [shuffledQuestions, setShuffledQuestions] = useState([])
  const attemptsEnabled = Boolean(test?.testData?.attemptsEnabled)

  const autoSubmitRef = useRef(false)
  const sessionKey = useMemo(() => (test ? makeSessionKey(test.id) : null), [test])

  const requiresManualReview = useMemo(() => {
    if (!test) return false
    return (
      test.testData.scoringType === 'rasch' ||
      test.questions.some(q => q.type === 'essay' || q.type === 'short-answer')
    )
  }, [test])

  // ── Global clock (1s) ──
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Restore session from sessionStorage ──
  useEffect(() => {
    if (!sessionKey) return
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (!raw) return
      const session = JSON.parse(raw)
      if (session.submitted) return // already done
      setParticipantValues(session.participantValues || {})
      setAnswers(session.answers || {})
      setShuffledQuestions(session.shuffledQuestions || [])
      setDurationEndTs(session.durationEndTs || null)
      setCurrentIdx(session.currentIdx || 0)
      setStarted(true)
    } catch {
      // corrupt data — ignore
    }
  }, [sessionKey])

  // ── Persist session on every change ──
  useEffect(() => {
    if (!sessionKey || !started) return
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        participantValues,
        answers,
        shuffledQuestions,
        durationEndTs,
        currentIdx,
        submitted: false,
      }))
    } catch { /* quota exceeded — ignore */ }
  }, [sessionKey, started, participantValues, answers, shuffledQuestions, durationEndTs, currentIdx])

  // ── Test window timing (start/end times from testData) ──
  const timing = useMemo(() => {
    if (!test) return { status: 'active', startMs: null, endMs: null, remainingMs: 0 }
    const startMs = new Date(test.testData.startTime).getTime()
    const endMs = new Date(test.testData.endTime).getTime()
    const hasValidWindow = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
    if (!hasValidWindow) return { status: 'active', startMs: null, endMs: null, remainingMs: 0 }
    if (nowTs < startMs) return { status: 'pending', startMs, endMs, remainingMs: startMs - nowTs }
    if (nowTs >= endMs) return { status: 'ended', startMs, endMs, remainingMs: 0 }
    return { status: 'active', startMs, endMs, remainingMs: endMs - nowTs }
  }, [test, nowTs])

  // ── Duration timer (from when user started) ──
  const durationMs = useMemo(() => {
    if (!test) return 0
    const dur = Number(test.testData.duration)
    return Number.isFinite(dur) && dur > 0 ? dur * 60 * 1000 : 0
  }, [test])

  const durationRemaining = useMemo(() => {
    if (!durationEndTs) return durationMs
    return Math.max(0, durationEndTs - nowTs)
  }, [durationEndTs, nowTs, durationMs])

  const durationWarning = durationMs > 0 && durationRemaining < 5 * 60 * 1000 && durationRemaining > 0
  const durationDanger  = durationMs > 0 && durationRemaining < 60 * 1000 && durationRemaining > 0

  // ── Redirect when test window ends ──
  useEffect(() => {
    if (!test) return
    if (timing.status !== 'ended') return
    navigate(`/test/${test.id}/results`, { replace: true })
  }, [timing.status, test, navigate])

  // ── Auto-submit when duration runs out ──
  const doSubmit = useCallback(async (currentAnswers) => {
    if (autoSubmitRef.current) return
    autoSubmitRef.current = true

    const answersByQuestion = {}
    test.questions.forEach(q => {
      answersByQuestion[q.id] = (currentAnswers ?? answers)[q.id] ?? ''
    })

    let autoScore = 0
    let autoMaxScore = 0
    test.questions.forEach(q => {
      const answer = answersByQuestion[q.id]
      const max = getQuestionMaxScore(q, test.testData.scoringType)
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        autoMaxScore += max
        if (String(answer) === String(q.correctAnswer)) autoScore += max
        return
      }

      if (q.type === TWO_PART_WRITTEN_TYPE) {
        autoMaxScore += max
        const parsed = parseTwoPartAnswer(answer)
        const firstCorrect = q.twoPartCorrectAnswers?.[0] || ''
        const secondCorrect = q.twoPartCorrectAnswers?.[1] || ''
        const isCorrect = compareCellAnswers(parsed.first, firstCorrect) && compareCellAnswers(parsed.second, secondCorrect)
        if (isCorrect) autoScore += max
      }
    })

    const status = requiresManualReview ? 'pending_review' : 'completed'
    const attemptValue = attemptsEnabled
      ? String(participantValues.phone || '').trim()
      : String(participantValues.fullName || '').trim()
    const submission = {
      id: crypto.randomUUID(),
      testId: test.id,
      participant: {
        fullName: participantValues.fullName || '',
        phone: participantValues.phone || '',
        fields: participantValues,
        attemptValue
      },
      answers: answersByQuestion,
      autoScore,
      autoMaxScore,
      finalScore: status === 'completed' ? autoScore : null,
      status,
      submittedAt: new Date().toISOString(),
      manualGrades: {},
      reviewedAt: null,
    }

    let saved = null
    try {
      saved = await createSubmissionRecord(submission)
    } catch (error) {
      autoSubmitRef.current = false
      const reason = error?.payload?.detail || error?.message || "Testni topshirishda xatolik yuz berdi"
      alert(String(reason))
      setAutoSubmitting(false)
      return
    }
    // Mark session as done
    try { sessionStorage.removeItem(sessionKey) } catch { }
    setSubmitted(saved || submission)
    setShowConfirm(false)
    setAutoSubmitting(false)
  }, [test, answers, participantValues, requiresManualReview, sessionKey, attemptsEnabled])

  useEffect(() => {
    if (!started || submitted || !durationEndTs) return
    if (durationMs === 0) return
    if (durationRemaining > 0) return
    // Vaqt tugadi
    setAutoSubmitting(true)
    const t = setTimeout(() => doSubmit(answers), 1500)
    return () => clearTimeout(t)
  }, [durationRemaining, started, submitted, durationEndTs, durationMs, doSubmit, answers])

  // ── Handle Start ──
  const handleStart = async (e) => {
    e.preventDefault()

    const normalizedParticipant = {}
    for (const field of participantFields) {
      const value = String(participantValues[field.id] || '').trim()
      if (field.required && !value) {
        alert(`"${field.label}" maydonini to'liq kiriting`)
        return
      }
      normalizedParticipant[field.id] = value
    }

    const attemptValue = attemptsEnabled
      ? String(normalizedParticipant.phone || '').trim()
      : (normalizedParticipant.fullName || '')
    if (!attemptValue) {
      alert(attemptsEnabled ? 'Telefon raqam maydoni majburiy' : 'Full Name maydoni majburiy')
      return
    }

    if (attemptsEnabled) {
      const phoneRegex = /^\+[1-9]\d{7,14}$/
      if (!phoneRegex.test(attemptValue)) {
        alert("Telefon raqam to'liq davlat kodi bilan kiriting. Masalan: +998901234567")
        return
      }

      let validation = null
      try {
        validation = await getAttemptsForParticipantValue(test.id, attemptValue)
      } catch (error) {
        const reason = error?.payload?.detail || error?.message || 'Urinishni tekshirishda xatolik'
        alert(String(reason))
        return
      }
      if (!validation?.allowed) {
        alert(validation?.reason || 'Urinish limiti tugagan')
        return
      }
    }

    // Savollarni aralashtirish
    const shuffled = shuffleWithIndices(test.questions)
    setShuffledQuestions(shuffled)

    // Duration end timestamp hisoblash
    const endTs = durationMs > 0 ? Date.now() + durationMs : null
    setDurationEndTs(endTs)

    setParticipantValues(normalizedParticipant)
    setCurrentIdx(0)
    setStarted(true)
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleTwoPartAnswerChange = (questionId, part, value) => {
    const current = parseTwoPartAnswer(answers[questionId])
    const next = part === 'first'
      ? stringifyTwoPartAnswer(value, current.second)
      : stringifyTwoPartAnswer(current.first, value)
    handleAnswerChange(questionId, next)
  }

  const handleSubmitClick = () => setShowConfirm(true)

  const unansweredCount = useMemo(() => {
    if (!shuffledQuestions.length) return 0
    return shuffledQuestions.filter(({ item: q }) => {
      const a = answers[q.id]
      return !isQuestionAnswered(q, a)
    }).length
  }, [shuffledQuestions, answers])

  const answeredCount = (shuffledQuestions.length || 0) - unansweredCount

  // ── Not found ──
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
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Test topilmadi</h1>
          <p className="text-slate-600">Link xato yoki test o'chirilgan bo'lishi mumkin.</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {autoSubmitting && <AutoSubmitToast />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-blue-600 flex-shrink-0">Nexo</h1>

          {started && !submitted && (
            <div className="flex-1 min-w-0">
              <ProgressBar answered={answeredCount} total={shuffledQuestions.length} />
            </div>
          )}

          {/* Duration timer */}
          {started && !submitted && durationMs > 0 && (
            <div className={`flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-xl border
              ${durationDanger
                ? 'border-red-200 bg-red-50'
                : durationWarning
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'}`}
            >
              <TimerRing
                remainingMs={durationRemaining}
                totalMs={durationMs}
                warning={durationWarning}
                danger={durationDanger}
              />
              <div className="text-right">
                <div className={`font-mono text-base font-bold tabular-nums
                  ${durationDanger ? 'text-red-600' : durationWarning ? 'text-amber-600' : 'text-slate-800'}`}>
                  {formatCountdown(durationRemaining)}
                </div>
                <div className="text-[10px] text-slate-400">qoldi</div>
              </div>
            </div>
          )}

          {/* Test window timer */}
          {timing.status === 'active' && timing.endMs && !started && (
            <div className="text-xs text-slate-500 flex-shrink-0">
              Musobaqa tugashiga: <span className="font-mono font-semibold">{formatCountdown(timing.remainingMs)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Test info card ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
          <h2 className="text-xl font-bold text-slate-800">{test.testData.title}</h2>
          {test.testData.description && (
            <RichContent html={test.testData.description} className="text-slate-600 mt-2 text-sm" />
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {test.testData.duration && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                ⏱ {test.testData.duration} daqiqa
              </span>
            )}
            {attemptsEnabled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                🔄 {test.testData.attemptsCount} ta urinish
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              📊 {test.testData.scoringType === 'rasch' ? 'Rasch Model' : 'Klassik'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              📝 {test.questions.length} ta savol
            </span>
          </div>
          {test.testData.scoringType === 'rasch' && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              ⚡ Rasch tanlangan: natijalar real time chiqarilmaydi, admin tekshiruvdan keyin e'lon qilinadi.
            </div>
          )}
        </div>

        {/* ── Pending state ── */}
        {!started && !submitted && timing.status === 'pending' && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">🕐</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Test hali boshlanmagan</h3>
            <p className="text-slate-500 text-sm mb-6">Kuting, musobaqa tez orada boshlanadi.</p>
            <div className="inline-flex items-center rounded-xl border border-blue-300 bg-blue-50 px-6 py-4 gap-3">
              <span className="text-2xl">⏳</span>
              <div className="text-left">
                <div className="text-xs text-blue-600 font-medium">Boshlanishiga</div>
                <div className="font-mono text-2xl font-bold text-blue-800">{formatCountdown(timing.remainingMs)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Start form ── */}
        {!started && !submitted && timing.status === 'active' && (
          <form onSubmit={handleStart} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
              <h3 className="text-base font-semibold text-slate-800">Ma'lumotlaringizni kiriting</h3>
            </div>
            {participantFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={participantValues[field.id] ?? ''}
                    onChange={(e) => setParticipantValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    required={Boolean(field.required)}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={participantValues[field.id] ?? ''}
                    onChange={(e) => setParticipantValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    required={Boolean(field.required)}
                  />
                )}
              </div>
            ))}
            {attemptsEnabled && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                Bu testda kirish uchun Telegram bot orqali ro'yxatdan o'tgan telefon raqamingizni
                <strong> to'liq davlat kodi bilan</strong> kiriting (masalan: +998901234567).
              </div>
            )}
            {durationMs > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <span>
                  Testni boshlagandan so'ng sizda <strong>{test.testData.duration} daqiqa</strong> vaqt bo'ladi.
                  Sahifani yopsangiz ham timer to'xtamaydi — qaytib kirganingizda davom etadi.
                </span>
              </div>
            )}
            <button type="submit"
              className="w-full px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
              🚀 Testni Boshlash
            </button>
          </form>
        )}

        {/* ── Active test ── */}
        {started && !submitted && shuffledQuestions.length > 0 && (
          <div className="space-y-4">

            {/* Question navigator */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-medium mb-2">Savollar navigatsiyasi</p>
              <QuestionNav
                questions={shuffledQuestions}
                answers={answers}
                currentIdx={currentIdx}
                onGoto={setCurrentIdx}
              />
            </div>

            {/* Current question */}
            {(() => {
              const { item: question, originalIdx } = shuffledQuestions[currentIdx]
              return (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {currentIdx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {question.type === 'multiple-choice' ? "Ko'p tanlovli" :
                          question.type === 'true-false' ? "To'g'ri/Noto'g'ri" :
                            question.type === TWO_PART_WRITTEN_TYPE ? '2 qismli yozma' :
                            question.type === 'essay' ? 'Yozma javob' : 'Qisqa javob'}
                      </span>
                    </div>
                    {(test.testData.scoringType === 'rasch' || question.type === 'essay') && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        {question.points || 1} ball
                      </span>
                    )}
                  </div>

                  {/* Question content */}
                  <RichContent html={question.content} className="text-slate-800 mb-5 text-sm leading-relaxed" />

                  {/* Multiple choice */}
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2.5">
                      {question.options.map((option, i) => {
                        const isSelected = String(answers[question.id] ?? '') === String(i)
                        return (
                          <label
                            key={`${question.id}-${i}`}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              value={i}
                              checked={isSelected}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="mt-0.5 accent-blue-600"
                            />
                            <span className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`font-bold text-sm flex-shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <RichContent html={option} className="text-sm text-slate-700 min-w-0" />
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* True / False */}
                  {question.type === 'true-false' && (
                    <div className="flex gap-3">
                      {[
                        { value: 'true', label: "✓ To'g'ri", activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                        { value: 'false', label: "✗ Noto'g'ri", activeClass: 'border-red-400 bg-red-50 text-red-700' },
                      ].map(({ value, label, activeClass }) => {
                        const isSelected = answers[question.id] === value
                        return (
                          <label
                            key={value}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer font-semibold text-sm transition-all
                              ${isSelected ? activeClass : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <input type="radio" name={`q-${question.id}`} value={value}
                              checked={isSelected}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="hidden"
                            />
                            {label}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Essay / Short answer */}
                  {(question.type === 'essay' || question.type === 'short-answer') && (
                    <textarea
                      value={answers[question.id] ?? ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={question.type === 'essay' ? 6 : 3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                      placeholder={question.type === 'essay' ? 'Batafsil javobingizni yozing...' : 'Qisqa javob...'}
                    />
                  )}

                  {question.type === TWO_PART_WRITTEN_TYPE && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                        Eslatma: Sh, Ch, Ng bitta katak emas (S+H, C+H, N+G alohida kataklarda yoziladi). O', G' bitta katak.
                        Sonlar alohida katak.
                        So'zlar orasida bitta bo'sh katak qoldiring.
                      </div>
                      {(() => {
                        const twoPart = parseTwoPartAnswer(answers[question.id])
                        const firstLabel = question.subQuestions?.[0] || 'a) Birinchi javob'
                        const secondLabel = question.subQuestions?.[1] || 'b) Ikkinchi javob'
                        return (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">{firstLabel}</label>
                              <CellAnswerInput
                                value={twoPart.first}
                                onChange={(next) => handleTwoPartAnswerChange(question.id, 'first', next)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">{secondLabel}</label>
                              <CellAnswerInput
                                value={twoPart.second}
                                onChange={(next) => handleTwoPartAnswerChange(question.id, 'second', next)}
                              />
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Prev / Next navigation */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                      disabled={currentIdx === 0}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      ← Oldingi
                    </button>

                    <span className="text-xs text-slate-400">
                      {currentIdx + 1} / {shuffledQuestions.length}
                    </span>

                    {currentIdx < shuffledQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(i => Math.min(shuffledQuestions.length - 1, i + 1))}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Keyingi →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitClick}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                      >
                        Yakunlash ✓
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Submit button always visible */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
              <span className="text-sm text-slate-500">
                {unansweredCount > 0
                  ? <><span className="font-semibold text-amber-600">{unansweredCount} ta savol</span> javoblanmagan</>
                  : <span className="text-emerald-600 font-medium">✓ Barcha savollar javoblandi</span>}
              </span>
              <button
                type="button"
                onClick={handleSubmitClick}
                className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-sm"
              >
                Testni Yakunlash
              </button>
            </div>
          </div>
        )}

        {/* ── Submitted ── */}
        {submitted && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">
              {submitted.status === 'completed' ? '🎉' : '📬'}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Test topshirildi!</h3>
            {submitted.status === 'completed' ? (
              <>
                <p className="text-slate-500 mb-4 text-sm">Sizning natijangiz:</p>
                <div className="inline-flex items-center gap-2 px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl mb-6">
                  <span className="text-3xl font-bold text-blue-700">{submitted.finalScore}</span>
                  <span className="text-xl text-blue-400">/</span>
                  <span className="text-xl font-semibold text-blue-500">{submitted.autoMaxScore}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${submitted.autoMaxScore > 0 ? Math.round((submitted.finalScore / submitted.autoMaxScore) * 100) : 0}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm">
                📋 Javoblar qabul qilindi. Natija hozircha chiqarilmaydi — admin tekshiruvdan keyin yakuniy baho beriladi.
              </p>
            )}
            <Link
              to={`/test/${test.id}/results`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              🏆 Leaderboardni ko'rish
            </Link>
          </div>
        )}
      </main>
      <AppFooter />

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <ConfirmModal
          unanswered={unansweredCount}
          onConfirm={() => doSubmit(answers)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
