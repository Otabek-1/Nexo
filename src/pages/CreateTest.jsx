import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTestRecord, getTestById, getTests, updateTestRecord } from '../lib/testStore'
import { FREE_LIMITS, PLAN_PRO, getCreatorPlan } from '../lib/subscription'
import { getPublicTestUrl } from '../lib/urls'
import RichContent from '../components/RichContent'
import RichTextEditor from '../components/RichTextEditor'
import { isRichContentEmpty } from '../lib/richContent'

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localMs = date.getTime() - date.getTimezoneOffset() * 60 * 1000
  return new Date(localMs).toISOString().slice(0, 16)
}

export default function CreateTest() {
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
    correctAnswer: ''
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
    attemptsCount: '1',
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
              attemptsCount: String(found?.testData?.attemptsCount || '1'),
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
    const { name, value } = e.target
    setTestData(prev => ({
      ...prev,
      [name]: value
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
      correctAnswer: ''
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
      options: Array.isArray(question.options) ? [...question.options] : []
    })
    setEditingQuestionId(id)
  }

  const cancelEditQuestion = () => {
    setEditingQuestionId(null)
    setCurrentQuestion(emptyQuestion)
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
    const attempts = Number(testData.attemptsCount)
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

    if (!Number.isFinite(attempts) || attempts < 1) {
      alert('Urinish soni 1 dan kichik bolmasligi kerak')
      return
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
        participantFields: normalizedFields
      },
      questions
    }

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
                    required
                  />
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
