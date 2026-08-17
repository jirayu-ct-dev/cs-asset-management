import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const search = String(query.search || '').trim()
  const where = {
    ...(search && {
      OR: [
        { assetNumber: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
        { serialNumber: { contains: search, mode: 'insensitive' as const } },
        { location: { name: { contains: search, mode: 'insensitive' as const } } },
        { responsiblePerson: { name: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(query.lifecycleStatus && { lifecycleStatus: String(query.lifecycleStatus) as 'ACTIVE' }),
    ...(query.custodyStatus && { custodyStatus: String(query.custodyStatus) as 'AVAILABLE' }),
    ...(query.conditionStatus && { conditionStatus: String(query.conditionStatus) as 'NORMAL' }),
    ...(query.locationId && { locationId: String(query.locationId) }),
    ...(query.categoryId && { categoryId: String(query.categoryId) }),
  }
  const prisma = usePrisma(event)
  const orderBy = getSortOrder<Prisma.AssetOrderByWithRelationInput>(query, {
    assetNumber: direction => ({ assetNumber: direction }),
    name: direction => ({ name: direction }),
    'category.name': direction => ({ category: { name: direction } }),
    'location.name': direction => ({ location: { name: direction } }),
    custodyStatus: direction => ({ custodyStatus: direction }),
    conditionStatus: direction => ({ conditionStatus: direction }),
  }, [{ assetNumber: 'asc' }])
  const [items, total] = await prisma.$transaction([
    prisma.asset.findMany({
      where,
      include: { category: true, unit: true, location: true, responsiblePerson: true },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ])
  return { items, total, page, pageSize }
})
