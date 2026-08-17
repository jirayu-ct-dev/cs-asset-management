import { cancellationSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const before = await tx.disposal.findUniqueOrThrow({ where: { id } })
    if (before.status === 'CANCELLED') throw createError({ statusCode: 409, statusMessage: 'รายการถูกย้อนกลับแล้ว' })
    const disposal = await tx.disposal.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() } })
    await tx.asset.update({ where: { id: before.assetId }, data: { lifecycleStatus: 'ACTIVE' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'DISPOSAL_REVERSED', summary: `ย้อนกลับการจำหน่าย: ${reason}`, entityType: 'Disposal', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'REVERSE', entityType: 'Disposal', entityId: id, before, after: disposal, reason })
    return disposal
  })
})
