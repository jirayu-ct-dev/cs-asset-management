import { inspectionItemSchema } from '../../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const roundId = requiredRouteParam(event)
  const assetId = requiredRouteParam(event, 'assetId')
  const input = await readSchemaBody(event, inspectionItemSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const round = await tx.inspectionRound.findUniqueOrThrow({ where: { id: roundId } })
    if (round.status !== 'OPEN') throw createError({ statusCode: 409, statusMessage: 'รอบตรวจปิดแล้ว ต้องเปิดแก้พร้อมเหตุผลก่อน' })
    const before = await tx.inspectionItem.findUniqueOrThrow({ where: { roundId_assetId: { roundId, assetId } } })
    const item = await tx.inspectionItem.update({
      where: { roundId_assetId: { roundId, assetId } },
      data: { result: input.result, actualLocationId: input.actualLocationId, actualCondition: input.observedCondition, notes: input.notes, inspectedAt: new Date(), inspectedById: admin.id },
    })
    await tx.assetEvent.create({ data: { assetId, type: 'INSPECTED', summary: `ผลตรวจนับ: ${input.result}`, entityType: 'InspectionRound', entityId: roundId, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'INSPECT', entityType: 'InspectionItem', entityId: item.id, before, after: item })
    return item
  })
})
