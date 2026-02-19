import { apiRequest } from './api'

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

export const refreshCreatorPlan = async () => {
  try {
    const me = await apiRequest('/me')
    const normalized = me.plan === PLAN_PRO || me.plan === 'lifetime' ? PLAN_PRO : PLAN_FREE
    localStorage.setItem(CREATOR_PLAN_KEY, normalized)
    return normalized
  } catch {
    return getCreatorPlan()
  }
}

export const setCreatorPlan = async (plan) => {
  const target = plan === PLAN_PRO ? PLAN_PRO : PLAN_FREE
  const payload = {
    plan: target === PLAN_PRO ? 'pro' : 'free',
    billing_cycle: 'monthly'
  }
  await apiRequest('/subscriptions/upgrade', { method: 'POST', body: payload })
  localStorage.setItem(CREATOR_PLAN_KEY, target)
  return target
}

export const isProPlan = (plan) => plan === PLAN_PRO

export const getPlanForTest = (test) => {
  if (!test) return PLAN_FREE
  return test.creatorPlan === PLAN_PRO || test.creatorPlan === 'lifetime' ? PLAN_PRO : PLAN_FREE
}

export const getOrCreateCreatorUserId = () => {
  const existing = localStorage.getItem(CREATOR_USER_ID_KEY)
  if (existing) return existing

  const generated = String(Math.floor(100000 + Math.random() * 900000))
  localStorage.setItem(CREATOR_USER_ID_KEY, generated)
  return generated
}

