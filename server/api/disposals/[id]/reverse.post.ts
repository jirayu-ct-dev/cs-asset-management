import { cancellationSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM disposals WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.disposal.findUniqueOrThrow({ where: { id } })
    if (!['PROPOSED', 'COMPLETED'].includes(before.status)) throw createError({ statusCode: 409, statusMessage: 'รายการถูกย้อนกลับแล้ว' })
    await tx.$queryRaw`SELECT id FROM assets WHERE id = ${before.assetId}::uuid FOR UPDATE`
    const asset = await tx.asset.findUniqueOrThrow({ where: { id: before.assetId } })
    const expectedLifecycle = before.status === 'COMPLETED' ? 'DISPOSED' : 'PROPOSED_FOR_DISPOSAL'
    if (asset.lifecycleStatus !== expectedLifecycle) throw createError({ statusCode: 409, statusMessage: 'สถานะครุภัณฑ์เปลี่ยนไปแล้ว ไม่สามารถย้อนกลับรายการนี้' })
    const disposal = await tx.disposal.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() } })
    await tx.asset.update({ where: { id: before.assetId }, data: { lifecycleStatus: 'ACTIVE' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'DISPOSAL_REVERSED', summary: `ย้อนกลับการจำหน่าย: ${reason}`, entityType: 'Disposal', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'REVERSE', entityType: 'Disposal', entityId: id, before, after: disposal, reason })
    return disposal
  })
})
