import { disposalCompleteSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const input = await readSchemaBody(event, disposalCompleteSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const before = await tx.disposal.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'PROPOSED') throw createError({ statusCode: 409, statusMessage: 'บันทึกจำหน่ายได้เฉพาะรายการที่เสนอไว้' })
    const disposal = await tx.disposal.update({ where: { id }, data: { status: 'COMPLETED', completedAt: input.disposedAt, method: input.method, documentNumber: input.documentNumber, completedById: admin.id } })
    await tx.asset.update({ where: { id: before.assetId }, data: { lifecycleStatus: 'DISPOSED' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'DISPOSED', summary: `จำหน่ายแล้ว (${input.method})`, entityType: 'Disposal', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'COMPLETE', entityType: 'Disposal', entityId: id, before, after: disposal })
    return disposal
  })
})
