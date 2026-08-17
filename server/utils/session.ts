import type { H3Event } from 'h3'

export const requireAdmin = async (event: H3Event) => {
  const session = await requireUserSession(event)
  if (!session.user?.id) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const user = await usePrisma(event).user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, isActive: true } })
  if (!user?.isActive) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'บัญชีนี้ถูกปิดใช้งาน' })
  }
  return { id: user.id, email: user.email, name: user.name }
}
