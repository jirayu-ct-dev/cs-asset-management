import { cancellationSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM inspection_rounds WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.inspectionRound.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'CLOSED') throw createError({ statusCode: 409, statusMessage: 'รอบตรวจเปิดอยู่แล้ว' })
    const round = await tx.inspectionRound.update({ where: { id }, data: { status: 'OPEN', closedAt: null, closedById: null, reopenedReason: reason } })
    await writeAudit(tx, { actorId: admin.id, action: 'REOPEN', entityType: 'InspectionRound', entityId: id, before, after: round, reason })
    return round
  })
})
