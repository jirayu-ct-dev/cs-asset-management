export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const batch = await usePrisma(event).importBatch.findUnique({ where: { id }, include: { rows: { orderBy: { rowNumber: 'asc' } } } })
  if (!batch) throw createError({ statusCode: 404, statusMessage: 'ไม่พบชุดนำเข้า' })
  return batch
})
