const publicApiPaths = new Set(['/api/auth/login', '/api/health'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || publicApiPaths.has(path)) return
  await requireAdmin(event)
})
