export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event)
  const [categories, units, locations, fundingSources, people] = await prisma.$transaction([
    prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.unit.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.location.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.fundingSource.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.person.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])
  return { categories, units, locations, fundingSources, people }
})
