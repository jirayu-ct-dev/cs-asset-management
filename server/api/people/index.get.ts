export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const search = String(query.search || '').trim()
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { code: { contains: search, mode: 'insensitive' as const } }] } : {}
  const prisma = usePrisma(event)
  const [items, total] = await prisma.$transaction([
    prisma.person.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
    prisma.person.count({ where }),
  ])
  return { items, total, page, pageSize }
})
