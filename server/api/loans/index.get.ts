import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const status = query.status ? String(query.status) as 'ACTIVE' | 'RETURNED' | 'CANCELLED' : undefined
  const assetId = typeof query.assetId === 'string' ? query.assetId : undefined
  if (assetId && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(assetId)) throw createError({ statusCode: 422, statusMessage: 'assetId ไม่ถูกต้อง' })
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const prisma = usePrisma(event)
  const where = {
    ...(status && { status }),
    ...(assetId && { assetId }),
    ...(search && { OR: [
      { asset: { assetNumber: { contains: search, mode: 'insensitive' as const } } },
      { asset: { name: { contains: search, mode: 'insensitive' as const } } },
      { borrower: { name: { contains: search, mode: 'insensitive' as const } } },
    ] }),
  }
  const orderBy = getSortOrder<Prisma.LoanOrderByWithRelationInput>(query, {
    'asset.assetNumber': direction => ({ asset: { assetNumber: direction } }),
    'asset.name': direction => ({ asset: { name: direction } }),
    'borrower.name': direction => ({ borrower: { name: direction } }),
    loanedAt: direction => ({ loanedAt: direction }),
    dueAt: direction => ({ dueAt: direction }),
    status: direction => ({ status: direction }),
  }, [{ loanedAt: 'desc' }])
  const [items, total] = await prisma.$transaction([
    prisma.loan.findMany({
      where,
      include: { asset: true, borrower: true, createdBy: { select: { id: true, name: true } }, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.loan.count({ where }),
  ])
  const now = new Date()
  return { items: items.map(item => ({ ...item, overdue: item.status === 'ACTIVE' && item.dueAt < now })), total, page, pageSize }
})
