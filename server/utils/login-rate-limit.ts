import type { H3Event } from 'h3'

const attempts = new Map<string, { count: number, resetAt: number }>()
const windowMs = 15 * 60 * 1000
const maxAttempts = 5
const maxKeys = 5000

const cleanup = (now: number) => {
  for (const [key, attempt] of attempts) {
    if (attempt.resetAt <= now) attempts.delete(key)
  }
  while (attempts.size >= maxKeys) {
    const oldestKey = attempts.keys().next().value
    if (!oldestKey) break
    attempts.delete(oldestKey)
  }
}

export const loginAttemptKey = (event: H3Event, email: string) => {
  const trustedProxy = Boolean(useRuntimeConfig(event).trustedProxy)
  return `${getRequestIP(event, { xForwardedFor: trustedProxy }) || 'unknown'}:${email}`
}

export const assertLoginAllowed = (key: string) => {
  const now = Date.now()
  cleanup(now)
  const current = attempts.get(key)
  if (current && current.resetAt > now && current.count >= maxAttempts) {
    throw createError({ statusCode: 429, statusMessage: 'เข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาที' })
  }
  if (current?.resetAt && current.resetAt <= now) attempts.delete(key)
}

export const recordLoginFailure = (key: string) => {
  const now = Date.now()
  const current = attempts.get(key)
  attempts.set(key, current && current.resetAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetAt: now + windowMs })
}

export const clearLoginFailures = (key: string) => attempts.delete(key)
