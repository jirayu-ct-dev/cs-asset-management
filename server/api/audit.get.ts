export default defineEventHandler(async (event) => {
  const { page, pageSize, skip, query } = getPageQuery(event)
  const where = {
    ...(query.actorId && { actorId: String(query.actorId) }),
    ...(query.action && { action: { contains: String(query.action), mode: 'insensitive' as const } }),
    ...(query.entityType && { entityType: String(query.entityType) }),
  }
  const prisma = usePrisma(event)
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    prisma.auditLog.count({ where }),
  ])
  return { items, total, page, pageSize }
})
