import { repairSendSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const input = await readSchemaBody(event, repairSendSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const before = await tx.repairJob.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'REPORTED') throw createError({ statusCode: 409, statusMessage: 'ส่งซ่อมได้จากรายการแจ้งชำรุดเท่านั้น' })
    const repair = await tx.repairJob.update({ where: { id }, data: { status: 'SENT', vendor: input.vendor, sentAt: input.sentAt, documentNumber: input.documentNumber, expectedBackAt: input.expectedAt } })
    await tx.asset.update({ where: { id: before.assetId }, data: { custodyStatus: 'IN_REPAIR' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'REPAIR_SENT', summary: `ส่งซ่อมที่ ${input.vendor}`, entityType: 'RepairJob', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'SEND', entityType: 'RepairJob', entityId: id, before, after: repair })
    return repair
  })
})
