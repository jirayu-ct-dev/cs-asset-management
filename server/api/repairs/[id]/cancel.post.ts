import { cancellationSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM repair_jobs WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.repairJob.findUniqueOrThrow({ where: { id } })
    if (!['REPORTED', 'SENT'].includes(before.status)) throw createError({ statusCode: 409, statusMessage: 'ยกเลิกได้เฉพาะงานซ่อมที่ยังไม่ปิด' })
    const repair = await tx.repairJob.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date(), closedById: admin.id } })
    await tx.asset.update({ where: { id: before.assetId }, data: { custodyStatus: 'AVAILABLE' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'REPAIR_CANCELLED', summary: `ยกเลิกงานซ่อม: ${reason}`, entityType: 'RepairJob', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'CANCEL', entityType: 'RepairJob', entityId: id, before, after: repair, reason })
    return repair
  })
})
