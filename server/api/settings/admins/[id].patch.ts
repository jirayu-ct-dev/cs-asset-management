import { adminStatusSchema } from '../../../../shared/schemas/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const input = await readSchemaBody(event, adminStatusSchema)
  if (id === admin.id && !input.isActive) throw createError({ statusCode: 409, statusMessage: 'ไม่สามารถปิดบัญชีที่กำลังใช้งาน' })
  return usePrisma(event).$transaction(async (tx) => {
    const before = await tx.user.findUniqueOrThrow({ where: { id } })
    const user = await tx.user.update({ where: { id }, data: input, select: { id: true, email: true, name: true, isActive: true, updatedAt: true } })
    await writeAudit(tx, { actorId: admin.id, action: 'UPDATE_STATUS', entityType: 'User', entityId: id, before, after: user })
    return user
  })
})
