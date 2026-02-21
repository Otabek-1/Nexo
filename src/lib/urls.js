const TEST_BASE_URL = import.meta.env.VITE_TEST_BASE_URL || 'https://www.nexoo.space'

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '')

const validateTestId = (testId) => {
  const id = Number(testId)
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('Invalid test ID: must be a positive number')
  }
  return id
}

export const getPublicTestUrl = (testId) => {
  try {
    const validId = validateTestId(testId)
    const base = normalizeBaseUrl(TEST_BASE_URL)
    return `${base}/test/${validId}`
  } catch (error) {
    console.error('[urls] Error generating test URL:', error)
    return ''
  }
}

export const copyToClipboard = async (text) => {
  if (!text) {
    throw new Error('Cannot copy empty text')
  }
  
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('[urls] Copy to clipboard failed:', error)
    throw error
  }
}

