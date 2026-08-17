import { disposalInputSchema } from '../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, disposalInputSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM assets WHERE id = ${input.assetId}::uuid FOR UPDATE`
    const asset = await tx.asset.findUniqueOrThrow({ where: { id: input.assetId } })
    if (asset.lifecycleStatus !== 'ACTIVE') throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์ไม่ได้อยู่ในสถานะใช้งาน' })
    if (asset.custodyStatus !== 'AVAILABLE') throw createError({ statusCode: 409, statusMessage: 'ต้องรับคืนหรือปิดงานซ่อมก่อนเสนอจำหน่าย' })
    const disposal = await tx.disposal.create({ data: { ...input, createdById: admin.id } })
    await tx.asset.update({ where: { id: input.assetId }, data: { lifecycleStatus: 'PROPOSED_FOR_DISPOSAL' } })
    await tx.assetEvent.create({ data: { assetId: input.assetId, type: 'DISPOSAL_PROPOSED', summary: `เสนอจำหน่าย: ${input.reason}`, entityType: 'Disposal', entityId: disposal.id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'Disposal', entityId: disposal.id, after: disposal })
    return disposal
  })
})
