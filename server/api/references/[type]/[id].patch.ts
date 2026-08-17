import { referenceInputSchema } from '../../../../shared/schemas/reference'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const type = requiredRouteParam(event, 'type')
  const id = requiredRouteParam(event)
  const result = await referenceInputSchema.partial().safeParseAsync(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  const prisma = usePrisma(event)
  const updated = await (async () => {
    switch (type) {
      case 'categories': return prisma.category.update({ where: { id }, data: result.data })
      case 'units': return prisma.unit.update({ where: { id }, data: result.data })
      case 'locations': return prisma.location.update({ where: { id }, data: result.data })
      case 'funding-sources': return prisma.fundingSource.update({ where: { id }, data: result.data })
      default: throw createError({ statusCode: 404, statusMessage: 'ไม่พบชนิดข้อมูลอ้างอิง' })
    }
  })()
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'UPDATE', entityType: type, entityId: updated.id, after: JSON.parse(JSON.stringify(updated)) } })
  return updated
})
