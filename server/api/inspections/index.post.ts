import { inspectionRoundSchema } from '../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, inspectionRoundSchema)
  return usePrisma(event).$transaction(async (tx) => {
    const assets = await tx.asset.findMany({
      where: { lifecycleStatus: { not: 'DISPOSED' }, ...(input.locationId && { locationId: input.locationId }) },
      select: { id: true, assetNumber: true, name: true, locationId: true, responsiblePersonId: true, conditionStatus: true },
    })
    const round = await tx.inspectionRound.create({
      data: {
        name: input.name,
        fiscalYear: input.fiscalYear,
        locationId: input.locationId,
        createdById: admin.id,
        items: {
          create: assets.map(asset => ({
            assetId: asset.id,
            snapshotAssetNumber: asset.assetNumber,
            snapshotName: asset.name,
            snapshotLocationId: asset.locationId,
            snapshotResponsibleId: asset.responsiblePersonId,
            snapshotCondition: asset.conditionStatus,
          })),
        },
      },
      include: { _count: { select: { items: true } } },
    })
    await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'InspectionRound', entityId: round.id, after: round })
    return round
  })
})
