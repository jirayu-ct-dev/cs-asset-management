import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const search = String(query.search || '').trim()
  const type = ['STUDENT', 'STAFF', 'EXTERNAL'].includes(String(query.type)) ? String(query.type) as 'STUDENT' | 'STAFF' | 'EXTERNAL' : undefined
  const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined
  const where = {
    ...(search && { OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { code: { contains: search, mode: 'insensitive' as const } },
      { department: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ] }),
    ...(type && { type }),
    ...(isActive !== undefined && { isActive }),
  }
  const prisma = usePrisma(event)
  const orderBy = getSortOrder<Prisma.PersonOrderByWithRelationInput>(query, {
    name: direction => ({ name: direction }),
    code: direction => ({ code: direction }),
    type: direction => ({ type: direction }),
    department: direction => ({ department: direction }),
    phone: direction => ({ phone: direction }),
    isActive: direction => ({ isActive: direction }),
  }, [{ name: 'asc' }])
  const [items, total] = await prisma.$transaction([
    prisma.person.findMany({ where, orderBy, skip, take: pageSize }),
    prisma.person.count({ where }),
  ])
  return { items, total, page, pageSize }
})
