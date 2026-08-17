export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const status = ['OPEN', 'CLOSED'].includes(String(query.status)) ? String(query.status) as 'OPEN' | 'CLOSED' : undefined
  const locationId = typeof query.locationId === 'string' ? query.locationId : undefined
  const where = {
    ...(search && { OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      ...(Number.isInteger(Number(search)) ? [{ fiscalYear: Number(search) }] : []),
    ] }),
    ...(status && { status }),
    ...(locationId && { locationId }),
  }
  const prisma = usePrisma(event)
  const [items, total] = await prisma.$transaction([
    prisma.inspectionRound.findMany({
      where,
      include: { location: true, items: { select: { result: true } }, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } }, _count: { select: { items: true } } },
      orderBy: { openedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.inspectionRound.count({ where }),
  ])
  return {
    items: items.map((item) => {
      const inspected = item.items.filter(entry => entry.result !== null).length
      return { ...item, items: undefined, scope: item.location?.name || 'ทุกสถานที่', progress: `${inspected}/${item._count.items}` }
    }),
    total,
    page,
    pageSize,
  }
})
