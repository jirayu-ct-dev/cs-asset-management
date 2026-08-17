export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const round = await usePrisma(event).inspectionRound.findUnique({
    where: { id },
    include: {
      location: true,
      attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } },
      items: { include: { actualLocation: true }, orderBy: { snapshotAssetNumber: 'asc' } },
    },
  })
  if (!round) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรอบตรวจ' })
  const counts = round.items.reduce((result, item) => {
    const key = item.result || 'UNCHECKED'
    result[key] = (result[key] || 0) + 1
    return result
  }, {} as Record<string, number>)
  return {
    ...round,
    summary: {
      ...counts,
      total: round.items.length,
      pending: counts.UNCHECKED || 0,
      inspected: round.items.length - (counts.UNCHECKED || 0),
    },
  }
})
