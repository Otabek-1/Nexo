export const CREATOR_PLAN_KEY = 'nexo_creator_plan_v1'
export const CREATOR_USER_ID_KEY = 'nexo_creator_user_id_v1'

export const PLAN_FREE = 'free'
export const PLAN_PRO = 'pro'

export const FREE_LIMITS = {
  activeTests: 3,
  questionsPerTest: 30,
  submissionsPerTest: 100,
  manualReviewRecent: 20
}

export const getCreatorPlan = () => {
  const plan = localStorage.getItem(CREATOR_PLAN_KEY)
  return plan === PLAN_PRO ? PLAN_PRO : PLAN_FREE
}

export const setCreatorPlan = (plan) => {
  localStorage.setItem(CREATOR_PLAN_KEY, plan === PLAN_PRO ? PLAN_PRO : PLAN_FREE)
}

export const isProPlan = (plan) => plan === PLAN_PRO

export const getPlanForTest = (test) => {
  if (!test) return PLAN_FREE
  return test.creatorPlan === PLAN_PRO ? PLAN_PRO : PLAN_FREE
}

export const getOrCreateCreatorUserId = () => {
  const existing = localStorage.getItem(CREATOR_USER_ID_KEY)
  if (existing) return existing

  const generated = String(Math.floor(100000 + Math.random() * 900000))
  localStorage.setItem(CREATOR_USER_ID_KEY, generated)
  return generated
}
