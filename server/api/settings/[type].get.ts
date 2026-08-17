export default defineEventHandler(async (event) => {
  const type = requiredRouteParam(event, 'type')
  const prisma = usePrisma(event)
  switch (type) {
    case 'categories': return prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    case 'units': return prisma.unit.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    case 'locations': return prisma.location.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    case 'funding-sources': return prisma.fundingSource.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    case 'admins': return prisma.user.findMany({ select: { id: true, name: true, email: true, isActive: true, updatedAt: true }, orderBy: { name: 'asc' } })
    default: throw createError({ statusCode: 404, statusMessage: 'ไม่พบชนิดการตั้งค่า' })
  }
})
