export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = String(query.type || 'assets')
  const format = String(query.format || 'pdf')
  const allowedTypes = new Set(['assets', 'loans', 'repairs', 'transfers', 'inspections', 'disposals', 'asset-history'])
  if (!allowedTypes.has(type) || !['pdf', 'xlsx'].includes(format)) throw createError({ statusCode: 422, statusMessage: 'ประเภทหรือรูปแบบรายงานไม่ถูกต้อง' })
  const forwarded = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (!['type', 'format'].includes(key) && typeof value === 'string') forwarded.set(key, value)
  }
  return sendRedirect(event, `/api/reports/${type}.${format}${forwarded.size ? `?${forwarded}` : ''}`, 302)
})
