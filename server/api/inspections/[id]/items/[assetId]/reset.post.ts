import { cancellationSchema } from '../../../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const roundId = requiredRouteParam(event)
  const assetId = requiredRouteParam(event, 'assetId')
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM inspection_rounds WHERE id = ${roundId}::uuid FOR UPDATE`
    const round = await tx.inspectionRound.findUniqueOrThrow({ where: { id: roundId } })
    if (round.status !== 'OPEN') throw createError({ statusCode: 409, statusMessage: 'รอบตรวจปิดแล้ว ต้องเปิดแก้พร้อมเหตุผลก่อน' })
    const before = await tx.inspectionItem.findUniqueOrThrow({ where: { roundId_assetId: { roundId, assetId } } })
    if (!before.result) throw createError({ statusCode: 409, statusMessage: 'รายการนี้ยังไม่มีผลตรวจให้ล้าง' })
    const item = await tx.inspectionItem.update({
      where: { roundId_assetId: { roundId, assetId } },
      data: { result: null, actualLocationId: null, actualCondition: null, notes: null, inspectedAt: null, inspectedById: null },
    })
    await tx.assetEvent.create({ data: { assetId, type: 'INSPECTION_RESET', summary: `ล้างผลตรวจนับ: ${reason}`, entityType: 'InspectionRound', entityId: roundId, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'RESET', entityType: 'InspectionItem', entityId: item.id, before, after: item, reason })
    return item
  })
})
