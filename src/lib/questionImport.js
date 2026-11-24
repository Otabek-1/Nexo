import { normalizeCellAnswerText, tokenizeIntoCells } from './cellAnswer.js'

const QUESTION_TYPES = new Set([
  'short-answer',
  'two-part-written',
  'two-part-math',
  'sat-math-input',
  'multiple-choice',
  'essay',
  'true-false',
])

const OBJECTIVE_TYPES = new Set([
  'two-part-written',
  'two-part-math',
  'sat-math-input',
  'multiple-choice',
  'true-false',
])

const SAT_MATH_ANSWER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+|\d+\/\d+)$/

const formatNumber = (value, fallback, fieldName) => {
  const parsed = Number(value ?? fallback)
  if (!Number.isFinite(parsed)) throw new Error(`${fieldName} son bo'lishi kerak`)
  return parsed
}

const normalizeQuestion = (source, index, moduleId, scoringType) => {
  const row = index + 1
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error(`${row}-savol JSON object bo'lishi kerak`)
  }

  const type = String(source.type || '')
  if (!QUESTION_TYPES.has(type)) {
    throw new Error(`${row}-savolda noma'lum type: "${type}"`)
  }
  if (['rasch', 'irt'].includes(scoringType) && !OBJECTIVE_TYPES.has(type)) {
    throw new Error(`${row}-savol "${type}" turida. Rasch/IRT uchun objective savol turidan foydalaning`)
  }

  const content = String(source.content || '').trim()
  if (!content) throw new Error(`${row}-savol content maydoni bo'sh bo'lmasligi kerak`)
  const difficulty = formatNumber(source.difficulty, 0, `${row}-savol difficulty`)
  const discrimination = formatNumber(source.discrimination, 1, `${row}-savol discrimination`)
  const guessing = formatNumber(source.guessing, 0, `${row}-savol guessing`)
  if (discrimination <= 0) throw new Error(`${row}-savol discrimination 0 dan katta bo'lishi kerak`)
  if (guessing < 0 || guessing >= 1) throw new Error(`${row}-savol guessing 0 dan kam va 1 dan katta bo'lmasligi kerak`)

  const question = {
    id: crypto.randomUUID(),
    type,
    content,
    options: [],
    correctAnswer: String(source.correctAnswer ?? ''),
    points: String(formatNumber(source.points, 1, `${row}-savol points`)),
    moduleId,
    difficulty,
    discrimination,
    guessing,
    subQuestions: ['', ''],
    twoPartCorrectAnswers: ['', ''],
    twoPartPoints: ['1', '1'],
  }
  if (scoringType === 'rasch' && OBJECTIVE_TYPES.has(type)) question.points = '1'

  if (type === 'multiple-choice') {
    question.options = Array.isArray(source.options)
      ? source.options.map(option => String(option || '').trim()).filter(Boolean)
      : []
    if (question.options.length < 2) {
      throw new Error(`${row}-savol multiple-choice bo'lsa, kamida 2 ta options kiriting`)
    }
    const rawAnswer = String(source.correctAnswer ?? '').trim().toUpperCase()
    const answerIndex = /^[A-Z]$/.test(rawAnswer)
      ? rawAnswer.charCodeAt(0) - 65
      : Number(rawAnswer)
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) {
      throw new Error(`${row}-savol correctAnswer variant raqami yoki harfi bo'lishi kerak`)
    }
    question.correctAnswer = String(answerIndex)
  }

  if (type === 'true-false' && !['true', 'false'].includes(question.correctAnswer.toLowerCase())) {
    throw new Error(`${row}-savol true-false uchun correctAnswer "true" yoki "false" bo'lishi kerak`)
  }
  if (type === 'true-false') question.correctAnswer = question.correctAnswer.toLowerCase()

  if (type === 'sat-math-input') {
    const answers = question.correctAnswer.split(',').map(answer => answer.trim())
    if (!question.correctAnswer.trim() || answers.some(answer => {
      const compact = answer.replace(/\s+/g, '')
      const valid = SAT_MATH_ANSWER_PATTERN.test(compact)
      return !valid || compact.length > 5 || (compact.includes('/') && Number(compact.split('/')[1]) === 0)
    })) {
      throw new Error(`${row}-savol SAT Math javoblari vergul bilan ajratilgan, 5 belgigacha bo'lgan son/kasrlar bo'lishi kerak`)
    }
  }

  if (type === 'two-part-written' || type === 'two-part-math') {
    if (!Array.isArray(source.subQuestions) || source.subQuestions.length !== 2) {
      throw new Error(`${row}-savol subQuestions ichida aynan 2 ta kichik savol bo'lishi kerak`)
    }
    if (!Array.isArray(source.twoPartCorrectAnswers) || source.twoPartCorrectAnswers.length !== 2) {
      throw new Error(`${row}-savol twoPartCorrectAnswers ichida aynan 2 ta javob bo'lishi kerak`)
    }
    question.subQuestions = source.subQuestions.map(value => String(value || '').trim())
    question.twoPartCorrectAnswers = source.twoPartCorrectAnswers.map(value => String(value || '').trim())
    if (question.subQuestions.some(value => !value) || question.twoPartCorrectAnswers.some(value => !value)) {
      throw new Error(`${row}-savolning ikkala kichik savoli va to'g'ri javobi to'ldirilishi kerak`)
    }
    if (type === 'two-part-written') {
      question.twoPartCorrectAnswers = question.twoPartCorrectAnswers.map(normalizeCellAnswerText)
      if (question.twoPartCorrectAnswers.some(value => tokenizeIntoCells(value).length === 0)) {
        throw new Error(`${row}-savol two-part-written javoblari bo'sh bo'lmasligi kerak`)
      }
    }
    if (Array.isArray(source.twoPartPoints)) {
      if (source.twoPartPoints.length !== 2) {
        throw new Error(`${row}-savol twoPartPoints ichida 2 ta qiymat bo'lishi kerak`)
      }
      question.twoPartPoints = source.twoPartPoints.map((value, partIndex) => {
        const points = formatNumber(value, 1, `${row}-savol twoPartPoints[${partIndex}]`)
        if (points <= 0) throw new Error(`${row}-savol qismlarining balli 0 dan katta bo'lishi kerak`)
        return String(scoringType === 'rasch' ? 1 : points)
      })
    }
  }

  if (type === 'essay' && formatNumber(source.points, 1, `${row}-savol points`) < 1) {
    throw new Error(`${row}-savol essay points kamida 1 bo'lishi kerak`)
  }

  return question
}

export const parseModuleQuestionFile = (fileText, { moduleId, scoringType }) => {
  let document
  try {
    document = JSON.parse(fileText)
  } catch (error) {
    throw new Error(`JSON format xato: ${error.message}`)
  }

  const rows = Array.isArray(document) ? document : document?.questions
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Faylda kamida bitta savol bo'lishi kerak. Savollarni questions ro'yxatiga yozing.")
  }

  return rows.map((row, index) => normalizeQuestion(row, index, moduleId, scoringType))
}
