import { passwordChangeSchema } from '../../../shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, passwordChangeSchema)
  const prisma = usePrisma(event)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw createError({ statusCode: 422, statusMessage: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
  }
  const passwordHash = await hashPassword(input.newPassword)
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: admin.id }, data: { passwordHash } })
    await writeAudit(tx, { actorId: admin.id, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: admin.id })
  })
  await clearUserSession(event)
  return { success: true, loginRequired: true }
})
