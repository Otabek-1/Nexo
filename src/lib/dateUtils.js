/**
 * Date and time utility functions
 */

/**
 * Format ISO date to locale date string
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '-'
  
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return '-'
    
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '-'
  }
}

/**
 * Format ISO date to full locale string
 */
export const formatDateTime = (isoDate) => {
  if (!isoDate) return '-'
  
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return '-'
    
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

/**
 * Format milliseconds to HH:MM:SS
 */
export const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Get remaining time from now until end date
 */
export const getRemainingTime = (endDate) => {
  const now = new Date().getTime()
  const end = new Date(endDate).getTime()
  const remaining = Math.max(0, end - now)
  
  return {
    milliseconds: remaining,
    seconds: Math.floor(remaining / 1000),
    minutes: Math.floor(remaining / (1000 * 60)),
    hours: Math.floor(remaining / (1000 * 60 * 60)),
    days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
    formatted: formatCountdown(remaining)
  }
}

/**
 * Check if date is in the past
 */
export const isPastDate = (date) => {
  const dateTime = new Date(date).getTime()
  return dateTime < new Date().getTime()
}

/**
 * Check if date is in the future
 */
export const isFutureDate = (date) => {
  const dateTime = new Date(date).getTime()
  return dateTime > new Date().getTime()
}

/**
 * Get date X minutes from now
 */
export const getDateInMinutes = (minutes) => {
  return new Date(new Date().getTime() + minutes * 60 * 1000).toISOString()
}

/**
 * Get date X hours from now
 */
export const getDateInHours = (hours) => {
  return new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString()
}

/**
 * Get date X days from now
 */
export const getDateInDays = (days) => {
  return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 1) return '0 min'
  
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) {
    return `${hours} soat`
  }
  
  return `${hours} soat ${mins} min`
}

/**
 * Get time until test starts/ends
 */
export const getTestTiming = (startTime, endTime, currentTime = new Date()) => {
  const now = currentTime.getTime()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  if (now < start) {
    return {
      status: 'pending',
      message: `Boshlanishiga ${formatCountdown(start - now)} vaqt qoldi`,
      remaining: start - now
    }
  }

  if (now >= end) {
    return {
      status: 'ended',
      message: 'Test tugadi',
      remaining: 0
    }
  }

  return {
    status: 'active',
    message: `${formatCountdown(end - now)} vaqt qoldi`,
    remaining: end - now
  }
}

/**
 * Validate if given date range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  try {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return false
    }
    
    return end > start
  } catch {
    return false
  }
}
