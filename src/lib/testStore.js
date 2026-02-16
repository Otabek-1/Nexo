const TESTS_KEY = 'nexo_tests_v1'
const SUBMISSIONS_KEY = 'nexo_submissions_v1'

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const getTests = () => {
  return readJson(TESTS_KEY)
}

export const getTestById = (id) => {
  const testId = Number(id)
  return getTests().find(test => Number(test.id) === testId) || null
}

export const createTestRecord = ({ testData, questions, creatorPlan }) => {
  const tests = getTests()
  const nextId = tests.length > 0 ? Math.max(...tests.map(t => Number(t.id) || 0)) + 1 : 1

  const record = {
    id: nextId,
    testData,
    questions,
    creatorPlan: creatorPlan || 'free',
    createdAt: new Date().toISOString(),
    hasEssay: questions.some(q => q.type === 'essay'),
    hasOpenQuestions: questions.some(q => q.type === 'essay' || q.type === 'short-answer')
  }

  writeJson(TESTS_KEY, [record, ...tests])
  return record
}

export const updateTestRecord = (testId, updater) => {
  const all = getTests()
  let updated = null
  const normalizedId = Number(testId)

  const next = all.map(item => {
    if (Number(item.id) !== normalizedId) return item
    updated = typeof updater === 'function' ? updater(item) : updater
    return updated
  })

  if (!updated) return null
  writeJson(TESTS_KEY, next)
  return updated
}

export const getSubmissions = () => {
  return readJson(SUBMISSIONS_KEY)
}

export const getSubmissionsByTestId = (testId) => {
  const normalizedId = Number(testId)
  return getSubmissions().filter(item => Number(item.testId) === normalizedId)
}

export const getAttemptsForPhone = (testId, phone) => {
  const normalized = String(phone || '').trim()
  if (!normalized) return 0
  return getSubmissionsByTestId(testId).filter(s => s.participant?.phone === normalized).length
}

export const getAttemptsForParticipantValue = (testId, value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return 0
  return getSubmissionsByTestId(testId).filter(
    s => String(s.participant?.attemptValue || s.participant?.fullName || '').trim() === normalized
  ).length
}

export const createSubmissionRecord = (submission) => {
  const all = getSubmissions()
  writeJson(SUBMISSIONS_KEY, [submission, ...all])
  return submission
}

export const updateSubmissionRecord = (submissionId, updater) => {
  const all = getSubmissions()
  let updated = null
  const next = all.map(item => {
    if (item.id !== submissionId) return item
    updated = typeof updater === 'function' ? updater(item) : updater
    return updated
  })

  if (!updated) return null
  writeJson(SUBMISSIONS_KEY, next)
  return updated
}

export const deleteTestRecord = (testId) => {
  const normalizedId = Number(testId)
  const tests = getTests()
  const nextTests = tests.filter(item => Number(item.id) !== normalizedId)
  if (nextTests.length === tests.length) return false

  const submissions = getSubmissions()
  const nextSubmissions = submissions.filter(item => Number(item.testId) !== normalizedId)

  writeJson(TESTS_KEY, nextTests)
  writeJson(SUBMISSIONS_KEY, nextSubmissions)
  return true
}
