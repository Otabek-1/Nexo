import { apiRequest } from './api'

const toClientTest = (row) => {
  if (!row) return null
  if (row.testData && row.questions) return row
  return {
    id: row.id,
    testData: row.testData || {},
    questions: row.questions || [],
    creatorPlan: row.creatorPlan || 'free',
    createdAt: row.createdAt || new Date().toISOString(),
    hasEssay: Boolean(row.hasEssay),
    hasOpenQuestions: Boolean(row.hasOpenQuestions)
  }
}

export const getTests = async () => {
  const rows = await apiRequest('/tests')
  return (rows || []).map((item) => ({
    id: item.id,
    testData: item.testData,
    questions: [],
    creatorPlan: item.creatorPlan,
    createdAt: item.createdAt,
    hasEssay: false,
    hasOpenQuestions: false,
    submissionsCount: item?.stats?.submissionsCount || 0,
    pendingCount: item?.stats?.pendingCount || 0
  }))
}

export const getTestById = async (id) => {
  const testId = Number(id)
  if (!Number.isFinite(testId)) return null

  try {
    const row = await apiRequest(`/tests/${testId}`)
    return toClientTest(row)
  } catch {
    try {
      const sessionConfig = await apiRequest(`/tests/${testId}/session-config`, { auth: false })
      return toClientTest({
        id: sessionConfig.id,
        testData: sessionConfig.testData,
        questions: sessionConfig.questions,
        creatorPlan: sessionConfig.creatorPlan
      })
    } catch {
      return null
    }
  }
}

export const createTestRecord = async ({ testData, questions }) => {
  const row = await apiRequest('/tests', {
    method: 'POST',
    body: { testData, questions }
  })
  return toClientTest(row)
}

export const updateTestRecord = async (testId, updater) => {
  const current = await getTestById(testId)
  if (!current) return null
  const next = typeof updater === 'function' ? updater(current) : updater
  const row = await apiRequest(`/tests/${Number(testId)}`, {
    method: 'PATCH',
    body: {
      testData: next.testData,
      questions: next.questions
    }
  })
  return toClientTest(row)
}

export const getSubmissionsByTestId = async (testId) => {
  const normalizedId = Number(testId)
  if (!Number.isFinite(normalizedId)) return []
  return await apiRequest(`/tests/${normalizedId}/submissions`)
}

export const getAttemptsForPhone = async (testId, phone) => {
  const normalized = String(phone || '').trim()
  if (!normalized) return 0
  const result = await apiRequest(`/tests/${Number(testId)}/attempts/validate`, {
    method: 'POST',
    auth: false,
    body: { participant_value: normalized }
  })
  return Number(result?.used_attempts || 0)
}

export const getAttemptsForParticipantValue = async (testId, value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return 0
  const result = await apiRequest(`/tests/${Number(testId)}/attempts/validate`, {
    method: 'POST',
    auth: false,
    body: { participant_value: normalized }
  })
  return Number(result?.used_attempts || 0)
}

export const createSubmissionRecord = async (submissionLike) => {
  const payload = {
    participant_values: submissionLike?.participant?.fields || {},
    answers: submissionLike?.answers || {}
  }
  return await apiRequest(`/tests/${Number(submissionLike.testId)}/submissions`, {
    method: 'POST',
    auth: false,
    body: payload,
    headers: submissionLike?.id ? { 'Idempotency-Key': String(submissionLike.id) } : {}
  })
}

export const updateSubmissionRecord = async (testId, submissionId, patch) => {
  if (patch?.manualGrades) {
    return await apiRequest(`/tests/${Number(testId)}/submissions/${submissionId}/manual-grades`, {
      method: 'PATCH',
      body: { grades: patch.manualGrades }
    })
  }
  return await apiRequest(`/tests/${Number(testId)}/submissions/${submissionId}/finalize`, {
    method: 'POST',
    body: { final_score_override: patch?.finalScore ?? null }
  })
}

export const saveManualGrade = async (testId, submissionId, questionId, score) => {
  return await apiRequest(`/tests/${Number(testId)}/submissions/${submissionId}/manual-grades`, {
    method: 'PATCH',
    body: { grades: { [questionId]: Number(score) } }
  })
}

export const finalizeSubmission = async (testId, submissionId, override = null) => {
  return await apiRequest(`/tests/${Number(testId)}/submissions/${submissionId}/finalize`, {
    method: 'POST',
    body: { final_score_override: override }
  })
}

export const getLeaderboard = async (testId) => {
  return await apiRequest(`/tests/${Number(testId)}/leaderboard`, { auth: false })
}

export const deleteTestRecord = async (testId) => {
  try {
    await apiRequest(`/tests/${Number(testId)}`, { method: 'DELETE' })
    return true
  } catch {
    return false
  }
}

