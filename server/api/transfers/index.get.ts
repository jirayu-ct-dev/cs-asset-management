import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const search = String(query.search || '').trim()
  const locationId = typeof query.locationId === 'string' ? query.locationId : undefined
  const where = {
    ...(locationId && { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] }),
    ...(search && { AND: [{ OR: [
      { asset: { assetNumber: { contains: search, mode: 'insensitive' as const } } },
      { asset: { name: { contains: search, mode: 'insensitive' as const } } },
      { reason: { contains: search, mode: 'insensitive' as const } },
      { fromLocation: { name: { contains: search, mode: 'insensitive' as const } } },
      { toLocation: { name: { contains: search, mode: 'insensitive' as const } } },
    ] }] }),
  }
  const prisma = usePrisma(event)
  const orderBy = getSortOrder<Prisma.TransferOrderByWithRelationInput>(query, {
    'asset.assetNumber': direction => ({ asset: { assetNumber: direction } }),
    'asset.name': direction => ({ asset: { name: direction } }),
    'fromLocation.name': direction => ({ fromLocation: { name: direction } }),
    'toLocation.name': direction => ({ toLocation: { name: direction } }),
    transferredAt: direction => ({ transferredAt: direction }),
    reason: direction => ({ reason: direction }),
  }, [{ transferredAt: 'desc' }])
  const [items, total] = await prisma.$transaction([
    prisma.transfer.findMany({ where, include: { asset: true, fromLocation: true, toLocation: true, fromResponsible: true, toResponsible: true, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } }, orderBy, skip, take: pageSize }),
    prisma.transfer.count({ where }),
  ])
  return { items, total, page, pageSize }
})
