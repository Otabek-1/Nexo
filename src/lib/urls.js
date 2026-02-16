const TEST_BASE_URL = 'https://nexo-test.netlify.app'

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '')

export const getPublicTestUrl = (testId) => {
  const base = normalizeBaseUrl(TEST_BASE_URL)
  return `${base}/test/${testId}`
}

