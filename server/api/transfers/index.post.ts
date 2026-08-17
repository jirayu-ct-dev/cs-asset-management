import { transferInputSchema } from '../../../shared/schemas/workflows'
import { assertTransferable } from '../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, transferInputSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM assets WHERE id = ${input.assetId}::uuid FOR UPDATE`
    const asset = await tx.asset.findUniqueOrThrow({ where: { id: input.assetId } })
    assertTransferable(asset)
    if (asset.locationId === input.destinationLocationId && asset.responsiblePersonId === (input.newResponsiblePersonId || null)) {
      throw createError({ statusCode: 422, statusMessage: 'สถานที่และผู้รับผิดชอบไม่มีการเปลี่ยนแปลง' })
    }
    const transfer = await tx.transfer.create({
      data: {
        assetId: input.assetId,
        fromLocationId: asset.locationId,
        toLocationId: input.destinationLocationId,
        fromResponsibleId: asset.responsiblePersonId,
        toResponsibleId: input.newResponsiblePersonId,
        transferredAt: input.transferredAt,
        reason: input.reason,
        createdById: admin.id,
      },
    })
    await tx.asset.update({ where: { id: input.assetId }, data: { locationId: input.destinationLocationId, responsiblePersonId: input.newResponsiblePersonId } })
    await tx.assetEvent.create({ data: { assetId: input.assetId, type: 'TRANSFERRED', summary: `ย้ายสถานที่/ผู้รับผิดชอบ: ${input.reason}`, entityType: 'Transfer', entityId: transfer.id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'Transfer', entityId: transfer.id, before: asset, after: transfer })
    return transfer
  })
})
