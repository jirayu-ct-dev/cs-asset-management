import { repairCloseSchema } from '../../../../shared/schemas/workflows'
import { repairResultState } from '../../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const input = await readSchemaBody(event, repairCloseSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM repair_jobs WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.repairJob.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'SENT') throw createError({ statusCode: 409, statusMessage: 'รับกลับได้เฉพาะงานที่ส่งซ่อมแล้ว' })
    await tx.$queryRaw`SELECT id FROM assets WHERE id = ${before.assetId}::uuid FOR UPDATE`
    const asset = await tx.asset.findUniqueOrThrow({ where: { id: before.assetId } })
    if (asset.custodyStatus !== 'IN_REPAIR') throw createError({ statusCode: 409, statusMessage: 'สถานะครุภัณฑ์ไม่ตรงกับงานซ่อมนี้' })
    const repair = await tx.repairJob.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: input.receivedAt, outcome: input.successful ? 'REPAIRED' : 'UNREPAIRABLE', resultNotes: input.result, cost: input.cost, closedById: admin.id },
    })
    await tx.asset.update({ where: { id: before.assetId }, data: repairResultState(input.successful) })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'REPAIR_COMPLETED', summary: input.successful ? 'ซ่อมสำเร็จ' : 'ซ่อมไม่สำเร็จ', entityType: 'RepairJob', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'COMPLETE', entityType: 'RepairJob', entityId: id, before, after: repair })
    return repair
  })
})
