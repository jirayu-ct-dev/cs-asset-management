import { cancellationSchema } from '../../../../shared/schemas/workflows'
import { assertTransferable } from '../../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const original = await tx.transfer.findUniqueOrThrow({ where: { id } })
    await tx.$queryRaw`SELECT id FROM assets WHERE id = ${original.assetId}::uuid FOR UPDATE`
    const [asset, laterTransfers] = await Promise.all([
      tx.asset.findUniqueOrThrow({ where: { id: original.assetId } }),
      tx.transfer.count({ where: { assetId: original.assetId, id: { not: original.id }, createdAt: { gte: original.createdAt } } }),
    ])
    assertTransferable(asset)
    if (laterTransfers > 0) throw createError({ statusCode: 409, statusMessage: 'ย้อนกลับได้เฉพาะรายการย้ายล่าสุดของครุภัณฑ์' })
    if (asset.locationId !== original.toLocationId || asset.responsiblePersonId !== original.toResponsibleId) {
      throw createError({ statusCode: 409, statusMessage: 'สถานที่หรือผู้รับผิดชอบเปลี่ยนไปแล้ว กรุณาบันทึกการย้ายแก้ไขรายการใหม่' })
    }
    const correction = await tx.transfer.create({
      data: {
        assetId: original.assetId,
        fromLocationId: original.toLocationId,
        toLocationId: original.fromLocationId,
        fromResponsibleId: original.toResponsibleId,
        toResponsibleId: original.fromResponsibleId,
        transferredAt: new Date(),
        reason: `ย้อนกลับรายการ ${original.id}: ${reason}`,
        createdById: admin.id,
      },
    })
    await tx.asset.update({
      where: { id: original.assetId },
      data: { locationId: original.fromLocationId, responsiblePersonId: original.fromResponsibleId },
    })
    await tx.assetEvent.create({
      data: { assetId: original.assetId, type: 'TRANSFER_REVERSED', summary: `ย้อนกลับการย้าย: ${reason}`, entityType: 'Transfer', entityId: correction.id, actorId: admin.id },
    })
    await writeAudit(tx, { actorId: admin.id, action: 'REVERSE', entityType: 'Transfer', entityId: original.id, before: original, after: correction, reason })
    return correction
  })
})
