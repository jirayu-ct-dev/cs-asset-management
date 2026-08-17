import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const status = query.status ? String(query.status) as 'REPORTED' | 'SENT' | 'COMPLETED' | 'CANCELLED' : undefined
  const search = String(query.search || '').trim()
  const where = {
    ...(status && { status }),
    ...(search && { OR: [
      { asset: { assetNumber: { contains: search, mode: 'insensitive' as const } } },
      { asset: { name: { contains: search, mode: 'insensitive' as const } } },
      { issue: { contains: search, mode: 'insensitive' as const } },
      { vendor: { contains: search, mode: 'insensitive' as const } },
    ] }),
  }
  const prisma = usePrisma(event)
  const orderBy = getSortOrder<Prisma.RepairJobOrderByWithRelationInput>(query, {
    'asset.assetNumber': direction => ({ asset: { assetNumber: direction } }),
    'asset.name': direction => ({ asset: { name: direction } }),
    reportedAt: direction => ({ reportedAt: direction }),
    vendor: direction => ({ vendor: direction }),
    expectedBackAt: direction => ({ expectedBackAt: direction }),
    cost: direction => ({ cost: direction }),
    status: direction => ({ status: direction }),
  }, [{ reportedAt: 'desc' }])
  const [items, total] = await prisma.$transaction([
    prisma.repairJob.findMany({ where, include: { asset: true, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } }, orderBy, skip, take: pageSize }),
    prisma.repairJob.count({ where }),
  ])
  return { items, total, page, pageSize }
})
