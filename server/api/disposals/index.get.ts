import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const status = query.status ? String(query.status) as 'PROPOSED' | 'COMPLETED' | 'CANCELLED' : undefined
  const search = String(query.search || '').trim()
  const where = {
    ...(status && { status }),
    ...(search && { OR: [
      { asset: { assetNumber: { contains: search, mode: 'insensitive' as const } } },
      { asset: { name: { contains: search, mode: 'insensitive' as const } } },
      { reason: { contains: search, mode: 'insensitive' as const } },
      { method: { contains: search, mode: 'insensitive' as const } },
      { documentNumber: { contains: search, mode: 'insensitive' as const } },
    ] }),
  }
  const prisma = usePrisma(event)
  const orderBy = getSortOrder<Prisma.DisposalOrderByWithRelationInput>(query, {
    'asset.assetNumber': direction => ({ asset: { assetNumber: direction } }),
    'asset.name': direction => ({ asset: { name: direction } }),
    proposedAt: direction => ({ proposedAt: direction }),
    reason: direction => ({ reason: direction }),
    method: direction => ({ method: direction }),
    status: direction => ({ status: direction }),
  }, [{ proposedAt: 'desc' }])
  const [items, total] = await prisma.$transaction([
    prisma.disposal.findMany({ where, include: { asset: true, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } }, orderBy, skip, take: pageSize }),
    prisma.disposal.count({ where }),
  ])
  return { items, total, page, pageSize }
})
