export default defineEventHandler(async (event) => {
  const { page, pageSize, skip } = getPageQuery(event)
  const prisma = usePrisma(event)
  const [items, total] = await prisma.$transaction([
    prisma.transfer.findMany({ include: { asset: true, fromLocation: true, toLocation: true, fromResponsible: true, toResponsible: true, attachments: { select: { id: true, originalName: true, mimeType: true, createdAt: true } } }, orderBy: { transferredAt: 'desc' }, skip, take: pageSize }),
    prisma.transfer.count(),
  ])
  return { items, total, page, pageSize }
})
