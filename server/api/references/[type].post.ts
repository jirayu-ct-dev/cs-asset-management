import { referenceInputSchema } from '../../../shared/schemas/reference'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const type = requiredRouteParam(event, 'type')
  const input = await readSchemaBody(event, referenceInputSchema)
  const prisma = usePrisma(event)
  const created = await (async () => {
    switch (type) {
      case 'categories': return prisma.category.create({ data: input })
      case 'units': return prisma.unit.create({ data: input })
      case 'locations': return prisma.location.create({ data: input })
      case 'funding-sources': return prisma.fundingSource.create({ data: input })
      default: throw createError({ statusCode: 404, statusMessage: 'ไม่พบชนิดข้อมูลอ้างอิง' })
    }
  })()
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'CREATE', entityType: type, entityId: created.id, after: JSON.parse(JSON.stringify(created)) } })
  return created
})
