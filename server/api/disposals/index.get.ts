export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const status = query.status ? String(query.status) as 'PROPOSED' | 'COMPLETED' | 'CANCELLED' : undefined
  const where = status ? { status } : {}
  const prisma = usePrisma(event)
  const [items, total] = await prisma.$transaction([
    prisma.disposal.findMany({ where, include: { asset: true, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } }, orderBy: { proposedAt: 'desc' }, skip, take: pageSize }),
    prisma.disposal.count({ where }),
  ])
  return { items, total, page, pageSize }
})
