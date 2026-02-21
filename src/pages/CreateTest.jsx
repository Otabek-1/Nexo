import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTestRecord, getTelegramRegistrationLink, getTestById, getTests, updateTestRecord } from '../lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getCreatorPlan } from '../lib/subscription'
import { getPublicTestUrl } from '../lib/urls'
import RichContent from '../components/RichContent'
import RichTextEditor from '../components/RichTextEditor'
import { isRichContentEmpty } from '../lib/richContent'
import { normalizeCellAnswerText, tokenizeIntoCells } from '../lib/cellAnswer'

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localMs = date.getTime() - date.getTimezoneOffset() * 60 * 1000
  return new Date(localMs).toISOString().slice(0, 16)
}

const toUtcISOString = (localDateTimeValue) => {
  if (!localDateTimeValue) return ''
  const date = new Date(localDateTimeValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

const formatApiError = (error) => {
  const detail = error?.payload?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        const path = Array.isArray(item?.loc) ? item.loc.join('.') : ''
        const msg = item?.msg || ''
        return path ? `${path}: ${msg}` : msg
      })
      .filter(Boolean)
      .join('\n')
  }
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  return 'Imtihonni saqlashda xatolik yuz berdi'
}

export default function CreateTest() {
  const TWO_PART_WRITTEN_TYPE = 'two-part-written'
  const navigate = useNavigate()
  const { id } = useParams()
  const [creatorPlan, setCreatorPlan] = useState(getCreatorPlan())
  const isPro = creatorPlan === PLAN_PRO
  const [existingTests, setExistingTests] = useState([])
  const [editingTest, setEditingTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const isEditing = Boolean(editingTest)
  const emptyQuestion = {
    type: 'short-answer',
    content: '',
    options: [],
    points: '1',
    correctAnswer: '',
    subQuestions: ['', ''],
    twoPartCorrectAnswers: ['', ''],
    twoPartPoints: ['1', '1']
  }
  const defaultParticipantField = {
    id: 'fullName',
    label: 'Ism familya',
    type: 'text',
    required: true,
    locked: true
  }

  const [step, setStep] = useState('info')
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: '',
    attemptsEnabled: false,
    attemptsCount: '1',
    registrationWindowHours: '24',
    scoringType: 'correct-incorrect',
    testType: 'exam'
  })

  const [questions, setQuestions] = useState([])
  const [participantFields, setParticipantFields] = useState([defaultParticipantField])
  const [newParticipantLabel, setNewParticipantLabel] = useState('')
  const [newParticipantType, setNewParticipantType] = useState('text')
  const [currentQuestion, setCurrentQuestion] = useState(emptyQuestion)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [createdTest, setCreatedTest] = useState(null)
  const [telegramRegistrationLink, setTelegramRegistrationLink] = useState('')

  const shareLink = useMemo(() => {
    if (!createdTest) return ''
    return getPublicTestUrl(createdTest.id)
  }, [createdTest])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const tests = await getTests()
        if (!mounted) return
        setExistingTests(Array.isArray(tests) ? tests : [])
        setCreatorPlan(getCreatorPlan())

        if (id) {
          const found = await getTestById(id)
          if (!mounted) return
          setEditingTest(found)
          if (found) {
            setTestData({
              title: found?.testData?.title || '',
              description: found?.testData?.description || '',
              startTime: toDateTimeLocal(found?.testData?.startTime),
              endTime: toDateTimeLocal(found?.testData?.endTime),
              duration: String(found?.testData?.duration || ''),
              attemptsEnabled: Boolean(found?.testData?.attemptsEnabled),
              attemptsCount: String(found?.testData?.attemptsCount || '1'),
              registrationWindowHours: String(found?.testData?.registrationWindowHours || '24'),
              scoringType: found?.testData?.scoringType || 'correct-incorrect',
              testType: found?.testData?.testType || 'exam'
            })
            setQuestions(found?.questions || [])
            const configured = Array.isArray(found?.testData?.participantFields) ? found.testData.participantFields : []
            if (configured.length === 0) {
              setParticipantFields([defaultParticipantField])
            } else {
              const hasLockedFullName = configured.some(field => field.id === 'fullName')
              if (hasLockedFullName) {
                setParticipantFields(
                  configured.map(field => (field.id === 'fullName' ? { ...field, locked: true, required: true } : field))
                )
              } else {
                setParticipantFields([defaultParticipantField, ...configured])
              }
            }
          }
        }
      } catch (error) {
        console.error('[CreateTest] load failed:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setTestData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleQuestionChange = (e) => {
    const { name, value } = e.target
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addParticipantField = () => {
    const label = newParticipantLabel.trim()
    if (!label) {
      alert('Yangi maydon uchun nom kiriting')
      return
    }

    const normalized = label.toLowerCase()
    const hasDuplicate = participantFields.some(field => field.label.trim().toLowerCase() === normalized)
    if (hasDuplicate) {
      alert('Bunday nomli maydon allaqachon mavjud')
      return
    }

    setParticipantFields(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        type: newParticipantType,
        required: true,
        locked: false
      }
    ])
    setNewParticipantLabel('')
    setNewParticipantType('text')
  }

  const changeParticipantFieldLabel = (id, label) => {
    setParticipantFields(prev =>
      prev.map(field => (field.id === id && !field.locked ? { ...field, label } : field))
    )
  }

  const changeParticipantFieldType = (id, type) => {
    setParticipantFields(prev =>
      prev.map(field => (field.id === id && !field.locked ? { ...field, type } : field))
    )
  }

  const removeParticipantField = (id) => {
    setParticipantFields(prev => prev.filter(field => field.id !== id || field.locked))
  }

  const handleQuestionTypeChange = (e) => {
    const { value } = e.target
    setCurrentQuestion(prev => ({
      ...prev,
      type: value,
      options: value === 'multiple-choice' ? prev.options : [],
      correctAnswer: '',
      subQuestions: value === TWO_PART_WRITTEN_TYPE
        ? (Array.isArray(prev.subQuestions) && prev.subQuestions.length === 2 ? prev.subQuestions : ['', ''])
        : ['', ''],
      twoPartCorrectAnswers: value === TWO_PART_WRITTEN_TYPE
        ? (Array.isArray(prev.twoPartCorrectAnswers) && prev.twoPartCorrectAnswers.length === 2
          ? prev.twoPartCorrectAnswers
          : ['', ''])
        : ['', ''],
      twoPartPoints: value === TWO_PART_WRITTEN_TYPE
        ? (Array.isArray(prev.twoPartPoints) && prev.twoPartPoints.length === 2
          ? prev.twoPartPoints
          : ['1', '1'])
        : ['1', '1']
    }))
  }

  const getOptionLabel = (index) => String.fromCharCode(65 + index)

  const normalizeQuestionForSave = () => {
    const normalized = {
      ...currentQuestion,
      content: currentQuestion.content
    }

    if (normalized.type === 'multiple-choice') {
      const cleanedOptions = normalized.options.map(opt => opt.trim()).filter(Boolean)
      normalized.options = cleanedOptions
      normalized.correctAnswer = String(Number(normalized.correctAnswer))
    }
    if (normalized.type === TWO_PART_WRITTEN_TYPE) {
      const normalizedSubQuestions = Array.isArray(normalized.subQuestions)
        ? normalized.subQuestions.map(item => String(item || '').trim()).slice(0, 2)
        : []
      while (normalizedSubQuestions.length < 2) normalizedSubQuestions.push('')
      normalized.subQuestions = normalizedSubQuestions

      const normalizedCorrectAnswers = Array.isArray(normalized.twoPartCorrectAnswers)
        ? normalized.twoPartCorrectAnswers.map(item => normalizeCellAnswerText(item).trim()).slice(0, 2)
        : []
      while (normalizedCorrectAnswers.length < 2) normalizedCorrectAnswers.push('')
      normalized.twoPartCorrectAnswers = normalizedCorrectAnswers

      const normalizedPoints = Array.isArray(normalized.twoPartPoints)
        ? normalized.twoPartPoints.map((item) => String(item ?? '').trim()).slice(0, 2)
        : []
      while (normalizedPoints.length < 2) normalizedPoints.push('1')
      normalized.twoPartPoints = normalizedPoints.map((item) => {
        const parsed = Number(item)
        return String(Number.isFinite(parsed) && parsed > 0 ? parsed : 1)
      })
    }

    return normalized
  }

  const addQuestion = () => {
    if (!editingQuestionId && !isPro && questions.length >= FREE_LIMITS.questionsPerTest) {
      alert(`Free plan uchun har testda ${FREE_LIMITS.questionsPerTest} ta savol limiti bor. Pro ni yoqing.`)
      return
    }

    if (isRichContentEmpty(currentQuestion.content)) {
      alert('Savol matni bosh bolmasligi kerak')
      return
    }

    if (currentQuestion.type === 'multiple-choice') {
      const cleanedOptions = currentQuestion.options.map(opt => opt.trim()).filter(Boolean)
      if (cleanedOptions.length < 2) {
        alert('Kop variantli savolda kamida 2 ta bosh bolmagan variant bolishi kerak')
        return
      }

      const answerIndex = Number(currentQuestion.correctAnswer)
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= cleanedOptions.length) {
        alert('Kop variantli savolda togri javobni tanlang')
        return
      }
    }

    if (currentQuestion.type === 'true-false' && !['true', 'false'].includes(currentQuestion.correctAnswer)) {
      alert('True/False savolda togri javobni tanlang')
      return
    }

    if (currentQuestion.type === 'essay') {
      const points = Number(currentQuestion.points)
      if (!Number.isFinite(points) || points < 1) {
        alert('Yozma savol uchun ball 1 dan kichik bolmasligi kerak')
        return
      }
    }
    if (currentQuestion.type === TWO_PART_WRITTEN_TYPE) {
      const parts = Array.isArray(currentQuestion.subQuestions) ? currentQuestion.subQuestions : []
      const first = String(parts[0] || '').trim()
      const second = String(parts[1] || '').trim()
      if (!first || !second) {
        alert('Bu turda 2 ta kichik savol matnini toldirish majburiy')
        return
      }

      const corrects = Array.isArray(currentQuestion.twoPartCorrectAnswers) ? currentQuestion.twoPartCorrectAnswers : []
      const firstCorrect = String(corrects[0] || '')
      const secondCorrect = String(corrects[1] || '')
      if (tokenizeIntoCells(firstCorrect).length === 0 || tokenizeIntoCells(secondCorrect).length === 0) {
        alert("Bu turda creator uchun a) va b) to'g'ri javoblarini kiriting")
        return
      }

      if (testData.scoringType === 'rasch') {
        const pointValues = Array.isArray(currentQuestion.twoPartPoints) ? currentQuestion.twoPartPoints : []
        const firstPoint = Number(pointValues[0] || 0)
        const secondPoint = Number(pointValues[1] || 0)
        if (!Number.isFinite(firstPoint) || firstPoint <= 0 || !Number.isFinite(secondPoint) || secondPoint <= 0) {
          alert("Raschda a) va b) uchun ball 0 dan katta bo'lishi kerak")
          return
        }
      }
    }

    const normalizedQuestion = normalizeQuestionForSave()
    const payload = editingQuestionId
      ? { ...normalizedQuestion, id: editingQuestionId }
      : { ...normalizedQuestion, id: crypto.randomUUID() }

    setQuestions(prev =>
      editingQuestionId ? prev.map(q => (q.id === editingQuestionId ? payload : q)) : [...prev, payload]
    )
    setCurrentQuestion(emptyQuestion)
    setEditingQuestionId(null)
  }

  const deleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
    if (editingQuestionId === id) {
      setEditingQuestionId(null)
      setCurrentQuestion(emptyQuestion)
    }
  }

  const editQuestion = (id) => {
    const question = questions.find(q => q.id === id)
    if (!question) return

    setCurrentQuestion({
      ...question,
      options: Array.isArray(question.options) ? [...question.options] : [],
      subQuestions: Array.isArray(question.subQuestions) && question.subQuestions.length === 2
        ? [...question.subQuestions]
        : ['', ''],
      twoPartCorrectAnswers: Array.isArray(question.twoPartCorrectAnswers) && question.twoPartCorrectAnswers.length === 2
        ? [...question.twoPartCorrectAnswers]
        : ['', ''],
      twoPartPoints: Array.isArray(question.twoPartPoints) && question.twoPartPoints.length === 2
        ? question.twoPartPoints.map((item) => String(item))
        : ['1', '1']
    })
    setEditingQuestionId(id)
  }

  const cancelEditQuestion = () => {
    setEditingQuestionId(null)
    setCurrentQuestion(emptyQuestion)
  }

  const handleSubQuestionChange = (index, value) => {
    setCurrentQuestion(prev => {
      const next = Array.isArray(prev.subQuestions) ? [...prev.subQuestions] : ['', '']
      while (next.length < 2) next.push('')
      next[index] = value
      return {
        ...prev,
        subQuestions: next
      }
    })
  }

  const handleTwoPartCorrectAnswerChange = (index, value) => {
    setCurrentQuestion(prev => {
      const next = Array.isArray(prev.twoPartCorrectAnswers) ? [...prev.twoPartCorrectAnswers] : ['', '']
      while (next.length < 2) next.push('')
      next[index] = value
      return {
        ...prev,
        twoPartCorrectAnswers: next
      }
    })
  }

  const handleTwoPartPointChange = (index, value) => {
    setCurrentQuestion(prev => {
      const next = Array.isArray(prev.twoPartPoints) ? [...prev.twoPartPoints] : ['1', '1']
      while (next.length < 2) next.push('1')
      next[index] = value
      return {
        ...prev,
        twoPartPoints: next
      }
    })
  }

  const handleAddOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }
  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt))
    }))
  }

  const handleDeleteOption = (index) => {
    setCurrentQuestion(prev => {
      const currentAnswerIndex = Number(prev.correctAnswer)
      let nextCorrectAnswer = prev.correctAnswer

      if (Number.isInteger(currentAnswerIndex)) {
        if (currentAnswerIndex === index) {
          nextCorrectAnswer = ''
        } else if (currentAnswerIndex > index) {
          nextCorrectAnswer = String(currentAnswerIndex - 1)
        }
      }

      return {
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctAnswer: nextCorrectAnswer
      }
    })
  }

  const continueToQuestions = (e) => {
    e.preventDefault()

    const title = testData.title.trim()
    const duration = Number(testData.duration)
    const attemptsEnabled = Boolean(testData.attemptsEnabled)
    const attempts = Number(testData.attemptsCount)
    const registrationWindowHours = Number(testData.registrationWindowHours)
    const startMs = new Date(testData.startTime).getTime()
    const endMs = new Date(testData.endTime).getTime()

    if (!title || !testData.startTime || !testData.endTime || !testData.duration) {
      alert('Barcha majburiy maydonlarni toldiring')
      return
    }

    const invalidField = participantFields.find(field => !field.label.trim())
    if (invalidField) {
      alert('Participant uchun barcha maydon nomlari toliq bolishi kerak')
      return
    }
    
    if (!isPro && testData.scoringType === 'rasch') {
      alert('Rasch scoring faqat Pro plan uchun ochiq')
      return
    }

    if (!Number.isFinite(duration) || duration < 1) {
      alert('Imtihon vaqti 1 daqiqadan kam bolmasligi kerak')
      return
    }

    if (attemptsEnabled) {
      if (!Number.isFinite(attempts) || attempts < 1) {
        alert('Urinish soni 1 dan kichik bolmasligi kerak')
        return
      }
      if (!Number.isFinite(registrationWindowHours) || registrationWindowHours < 1) {
        alert("Registratsiya muddati (soat) 1 dan kichik bo'lmasligi kerak")
        return
      }
    }

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      alert('Tugash vaqti boshlanish vaqtidan keyin bolishi kerak')
      return
    }

    const availableMinutes = Math.floor((endMs - startMs) / (1000 * 60))
    if (duration > availableMinutes) {
      alert('Imtihon vaqti boshlanish va tugash oraligidan katta bolmasligi kerak')
      return
    }

    setTestData(prev => ({ ...prev, title }))
    setStep('questions')
  }

  const finishCreating = async () => {
    if (!isEditing && !isPro && existingTests.length >= FREE_LIMITS.activeTests) {
      alert(`Free planda ${FREE_LIMITS.activeTests} ta test limiti bor. Pro ni yoqing.`)
      return
    }

    if (questions.length === 0) {
      alert('Kamida bitta savol bolishi kerak')
      return
    }

    const normalizedFields = participantFields.map(field => ({
      ...field,
      label: field.label.trim()
    }))

    const payload = {
      testData: {
        ...testData,
        startTime: toUtcISOString(testData.startTime),
        endTime: toUtcISOString(testData.endTime),
        attemptsCount: testData.attemptsEnabled ? String(testData.attemptsCount) : '1',
        registrationWindowHours: testData.attemptsEnabled
          ? Number(testData.registrationWindowHours)
          : null,
        participantFields: normalizedFields
      },
      questions
    }

    try {
      const saved = isEditing
        ? await updateTestRecord(editingTest.id, prev => ({
          ...prev,
          ...payload,
          creatorPlan: prev.creatorPlan || creatorPlan
        }))
        : await createTestRecord({ ...payload, creatorPlan })

      if (!saved) {
        alert('Imtihonni saqlashda xatolik boldi')
        return
      }

      setCreatedTest(saved)
      if (saved?.testData?.attemptsEnabled) {
        try {
          const link = await getTelegramRegistrationLink(saved.id)
          setTelegramRegistrationLink(link)
        } catch {
          setTelegramRegistrationLink('')
        }
      } else {
        setTelegramRegistrationLink('')
      }
    } catch (error) {
      console.error('[CreateTest] save failed:', error)
      alert(formatApiError(error))
    }
  }

  const copyShareLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      alert('Link nusxalandi')
    } catch {
      alert('Linkni nusxalashda xatolik boldi')
    }
  }

  const copyTelegramLink = async () => {
    if (!telegramRegistrationLink) return
    try {
      await navigator.clipboard.writeText(telegramRegistrationLink)
      alert('Telegram registratsiya linki nusxalandi')
    } catch {
      alert('Telegram linkni nusxalashda xatolik boldi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Yuklanmoqda...</h1>
        </div>
      </div>
    )
  }

  if (id && !editingTest) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Imtihon topilmadi</h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Dashboardga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Nexo</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            {'<-'} Ortga
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {step === 'info' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">{isEditing ? 'Imtihonni Yangilash' : 'Yangi Imtihon Yaratish'}</h2>
              <p className="text-slate-600 mt-2">
                {isEditing ? 'Mavjud imtihon malumotlarini tahrirlang' : 'Imtihon malumotlarini kiriting'}
              </p>
            </div>

            {!isPro && (
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">
                Free plan: {FREE_LIMITS.activeTests} ta test, {FREE_LIMITS.questionsPerTest} ta savol/test. Rasch scoring Pro plan orqali ochiladi.
              </div>
            )}

            {testData.scoringType === 'rasch' && (
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">
                Diqqat: Rasch baholash tizimi tanlansa natijalar real time korinmaydi va kam sonli foydalanuvchilarda tavsiya qilinmaydi.
              </div>
            )}

            <form
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6"
              onSubmit={continueToQuestions}
            >
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                  Imtihon Nomi *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={testData.title}
                  onChange={handleChange}
                  placeholder="Masalan: Matematika Midterm"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Tavsifi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={testData.description}
                  onChange={handleChange}
                  placeholder="Imtihon haqida qisqacha malumot"
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">Participant ma'lumot maydonlari</h3>
                  <span className="text-xs text-slate-500">Test boshida so'raladi</span>
                </div>

                <div className="space-y-3">
                  {participantFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={field.label}
                        disabled={field.locked}
                        onChange={(e) => changeParticipantFieldLabel(field.id, e.target.value)}
                        className={`px-3 py-2 border rounded-lg ${field.locked ? 'bg-slate-100 border-slate-200 text-slate-500' : 'border-slate-300'}`}
                      />
                      <select
                        value={field.type}
                        disabled={field.locked}
                        onChange={(e) => changeParticipantFieldType(field.id, e.target.value)}
                        className={`px-3 py-2 border rounded-lg bg-white ${field.locked ? 'border-slate-200 text-slate-500' : 'border-slate-300'}`}
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="textarea">Long Text</option>
                      </select>
                      <button
                        type="button"
                        disabled={field.locked}
                        onClick={() => removeParticipantField(field.id)}
                        className={`px-3 py-2 rounded-lg ${field.locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                      >
                        {field.locked ? 'Majburiy' : 'Olib tashlash'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newParticipantLabel}
                    onChange={(e) => setNewParticipantLabel(e.target.value)}
                    placeholder="Masalan: Email yoki Manzil"
                    className="px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <select
                    value={newParticipantType}
                    onChange={(e) => setNewParticipantType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Long Text</option>
                  </select>
                  <button
                    type="button"
                    onClick={addParticipantField}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Maydon qo'shish
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Boshlanish Vaqti *
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={testData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Tugash Vaqti *
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={testData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-2">
                    Imtihon Vaqti (daqiqa) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={testData.duration}
                    onChange={handleChange}
                    placeholder="Masalan: 120"
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 p-4">
                  <label className="inline-flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="attemptsEnabled"
                      name="attemptsEnabled"
                      checked={Boolean(testData.attemptsEnabled)}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Attempt limitni yoqish</span>
                      <span className="block text-xs text-slate-600 mt-1">
                        Yoqilsa, userlar Telegram bot orqali ro'yxatdan o'tib telefon raqami bilan kiradi.
                      </span>
                    </span>
                  </label>

                  {testData.attemptsEnabled && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="attemptsCount" className="block text-sm font-medium text-slate-700 mb-2">
                          Urinish Soni *
                        </label>
                        <input
                          type="number"
                          id="attemptsCount"
                          name="attemptsCount"
                          value={testData.attemptsCount}
                          onChange={handleChange}
                          min="1"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={Boolean(testData.attemptsEnabled)}
                        />
                      </div>
                      <div>
                        <label htmlFor="registrationWindowHours" className="block text-sm font-medium text-slate-700 mb-2">
                          Registratsiya muddati (soat) *
                        </label>
                        <input
                          type="number"
                          id="registrationWindowHours"
                          name="registrationWindowHours"
                          value={testData.registrationWindowHours}
                          onChange={handleChange}
                          min="1"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={Boolean(testData.attemptsEnabled)}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Registratsiya test yaratilgan vaqtdan boshlab shu soat davomida ochiq bo'ladi.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="scoringType" className="block text-sm font-medium text-slate-700 mb-2">
                    Baholash Turi *
                  </label>
                  <select
                    id="scoringType"
                    name="scoringType"
                    value={testData.scoringType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="correct-incorrect">Togri/Notogri (Klassik)</option>
                    <option value="rasch" disabled={!isPro}>Rasch Model {!isPro ? '(Pro)' : ''}</option>
                  </select>
                  {!isPro && (
                    <p className="mt-2 text-xs text-amber-700">
                      Rasch scoring Pro plan uchun.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="testType" className="block text-sm font-medium text-slate-700 mb-2">
                    Imtihon Turi *
                  </label>
                  <select
                    id="testType"
                    name="testType"
                    value={testData.testType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="exam">Imtihon</option>
                    <option value="olympiad">Olimpiada</option>
                    <option value="test">Shunchaki Test</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Davom Ettirish
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'questions' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Savollarni Qoshish</h2>
              <p className="text-slate-600 mt-2">{testData.title}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8 space-y-6">
              {editingQuestionId && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Savol tahrirlash rejimi yoqilgan.
                </div>
              )}

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
                  Savol Turi
                </label>
                <select
                  id="type"
                  name="type"
                  value={currentQuestion.type}
                  onChange={handleQuestionTypeChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="short-answer">Qisqa Javob</option>
                  <option value={TWO_PART_WRITTEN_TYPE}>2 qismli yozma (a,b)</option>
                  <option value="multiple-choice">Kop Variantli</option>
                  <option value="essay">Yozma Javob (Essay)</option>
                  <option value="true-false">Togri/Notogri</option>
                </select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
                  Savol Matni *
                </label>
                <RichTextEditor
                  id="content"
                  value={currentQuestion.content}
                  onChange={(next) => setCurrentQuestion(prev => ({ ...prev, content: next }))}
                  placeholder="Savol matnini yozing, formatlang, rasm/video yoki matematik belgilar qo'shing..."
                />
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">Live preview</p>
                  <RichContent html={currentQuestion.content} className="text-sm text-slate-800" />
                </div>
              </div>

              {currentQuestion.type === TWO_PART_WRITTEN_TYPE && (
                <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700">Kichik savollar (2 ta)</p>
                  <input
                    type="text"
                    value={currentQuestion.subQuestions?.[0] ?? ''}
                    onChange={(e) => handleSubQuestionChange(0, e.target.value)}
                    placeholder="a) Birinchi kichik savol"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={currentQuestion.subQuestions?.[1] ?? ''}
                    onChange={(e) => handleSubQuestionChange(1, e.target.value)}
                    placeholder="b) Ikkinchi kichik savol"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500">
                    Ishtirokchiga umumiy savol matni bilan birga a) va b) alohida javob maydoni chiqadi.
                  </p>

                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Creator uchun to'g'ri javoblar</p>
                    <input
                      type="text"
                      value={currentQuestion.twoPartCorrectAnswers?.[0] ?? ''}
                      onChange={(e) => handleTwoPartCorrectAnswerChange(0, e.target.value)}
                      placeholder="a) To'g'ri javob"
                      className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={currentQuestion.twoPartCorrectAnswers?.[1] ?? ''}
                      onChange={(e) => handleTwoPartCorrectAnswerChange(1, e.target.value)}
                      placeholder="b) To'g'ri javob"
                      className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {testData.scoringType === 'rasch' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={currentQuestion.twoPartPoints?.[0] ?? '1'}
                          onChange={(e) => handleTwoPartPointChange(0, e.target.value)}
                          placeholder="a) Ball (Rasch)"
                          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={currentQuestion.twoPartPoints?.[1] ?? '1'}
                          onChange={(e) => handleTwoPartPointChange(1, e.target.value)}
                          placeholder="b) Ball (Rasch)"
                          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                      Eslatma: Sh, Ch, Ng bitta katak emas (S+H, C+H, N+G alohida kataklarda yoziladi). O', G' esa bitta katakka yoziladi.
                      Sonlar alohida katakka yoziladi. Javob bir nechta so'z bo'lsa, so'zlar orasida bitta bo'sh katak qoldiriladi.
                    </div>
                  </div>
                </div>
              )}

              {currentQuestion.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Javob Variantlari
                  </label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Variant ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          Ochirish
                        </button>
                      </div>
                    ))}
                  </div>

                  {currentQuestion.options.length > 0 && (
                    <div className="mt-4">
                      <label htmlFor="correctAnswer" className="block text-sm font-medium text-slate-700 mb-2">
                        Togri Javob *
                      </label>
                      <select
                        id="correctAnswer"
                        name="correctAnswer"
                        value={currentQuestion.correctAnswer}
                        onChange={handleQuestionChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Togri variantni tanlang</option>
                        {currentQuestion.options
                          .map(option => option.trim())
                          .filter(Boolean)
                          .map((option, index) => (
                            <option key={index} value={index}>
                              {getOptionLabel(index)} variant - {option}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                  >
                    + Variant Qoshish
                  </button>
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div>
                  <label htmlFor="correctAnswerTf" className="block text-sm font-medium text-slate-700 mb-2">
                    Togri Javob *
                  </label>
                  <select
                    id="correctAnswerTf"
                    name="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={handleQuestionChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Togri javobni tanlang</option>
                    <option value="true">Togri</option>
                    <option value="false">Notogri</option>
                  </select>
                </div>
              )}

              {(testData.scoringType === 'rasch' || currentQuestion.type === 'essay') && (
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-slate-700 mb-2">
                    Ball *
                  </label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={currentQuestion.points}
                    onChange={handleQuestionChange}
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  {editingQuestionId ? 'Savolni Yangilash' : '+ Savol Qoshish'}
                </button>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={cancelEditQuestion}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
                  >
                    Bekor qilish
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                  Qoshilgan Savollar ({questions.length})
                </h3>
              </div>

              {questions.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {questions.map((q, index) => (
                    <div key={q.id} className="px-8 py-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-2">
                            {index + 1}.
                          </h4>
                          <RichContent html={q.content} className="text-slate-800 mb-2" />
                          <div className="flex gap-4 text-sm text-slate-600 flex-wrap">
                            <span className="bg-slate-100 px-2 py-1 rounded">
                              {q.type === 'short-answer' ? 'Qisqa Javob' :
                                q.type === TWO_PART_WRITTEN_TYPE ? '2 qismli yozma' :
                                q.type === 'multiple-choice' ? 'Kop Variantli' :
                                  q.type === 'essay' ? 'Yozma Javob' :
                                    'Togri/Notogri'}
                            </span>
                            {testData.scoringType === 'rasch' || q.type === 'essay' ? (
                              <span>Ball: {q.points || 1}</span>
                            ) : null}
                            {q.type === 'multiple-choice' && (
                              <span>
                                Variantlar: {q.options.length}, Togri javob: {getOptionLabel(Number(q.correctAnswer))}
                              </span>
                            )}
                            {q.type === 'true-false' && (
                              <span>
                                Togri javob: {q.correctAnswer === 'true' ? 'Togri' : 'Notogri'}
                              </span>
                            )}
                            {q.type === TWO_PART_WRITTEN_TYPE && (
                              <span>
                                Kichik savollar: {(q.subQuestions || []).filter(Boolean).length}/2, To'g'ri javoblar: {((q.twoPartCorrectAnswers || []).filter(Boolean).length)}/2
                              </span>
                            )}
                            {q.type === TWO_PART_WRITTEN_TYPE && testData.scoringType === 'rasch' && (
                              <span>
                                Rasch ball: a) {q.twoPartPoints?.[0] || 1}, b) {q.twoPartPoints?.[1] || 1}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => editQuestion(q.id)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(q.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                          >
                            Ochirish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-8 py-12 text-center text-slate-600">
                  <p>Hali savol qoshilmagan</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                {'<-'} Orqaga
              </button>
              <button
                type="button"
                onClick={finishCreating}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {isEditing ? 'Imtihonni Yangilash' : 'Imtihonni Yaratish'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                Bekor qilish
              </button>
            </div>
          </>
        )}
      </main>

      {createdTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{isEditing ? 'Imtihon yangilandi' : 'Imtihon yaratildi'}</h3>
            <p className="text-slate-600 mb-4">Quyidagi linkni ishtirokchilarga ulashishingiz mumkin:</p>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 break-all text-sm text-slate-800">
              {shareLink}
            </div>
            {createdTest?.testData?.attemptsEnabled && (
              <div className="mt-4">
                <p className="text-slate-600 mb-2 text-sm">Telegram registratsiya linki:</p>
                <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 break-all text-sm text-slate-800">
                  {telegramRegistrationLink || "Bot link hali tayyor emas. Keyinroq qayta urinib ko'ring."}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyShareLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Linkni Nusxalash
              </button>
              <button
                type="button"
                onClick={() => window.open(shareLink, '_blank')}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Linkni Ochish
              </button>
              {createdTest?.testData?.attemptsEnabled && telegramRegistrationLink && (
                <button
                  type="button"
                  onClick={copyTelegramLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Telegram Linkni Nusxalash
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Dashboardga O'tish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
