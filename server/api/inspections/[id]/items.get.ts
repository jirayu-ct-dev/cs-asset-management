export default defineEventHandler(async (event) => {
  const roundId = requiredRouteParam(event)
  const q = String(getQuery(event).q || '').trim()
  const items = await usePrisma(event).inspectionItem.findMany({
    where: {
      roundId,
      ...(q && { OR: [{ snapshotAssetNumber: { contains: q, mode: 'insensitive' } }, { snapshotName: { contains: q, mode: 'insensitive' } }] }),
    },
    include: { snapshotLocation: true, actualLocation: true },
    orderBy: { snapshotAssetNumber: 'asc' },
  })
  return items.map(item => ({
    ...item,
    asset: { id: item.assetId, assetNumber: item.snapshotAssetNumber, name: item.snapshotName },
    snapshotLocationName: item.snapshotLocation?.name || '',
  }))
})
