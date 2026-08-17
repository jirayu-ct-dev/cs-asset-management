export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(self)',
  })
  const method = event.method
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return
  const origin = getHeader(event, 'origin')
  if (!origin) return
  const allowedOrigin = new URL(useRuntimeConfig(event).public.appBaseUrl).origin
  if (origin !== allowedOrigin) throw createError({ statusCode: 403, statusMessage: 'Origin is not allowed' })
})
