export default defineEventHandler(async (event) => {
  const prisma = usePrisma(event)
  const now = new Date()
  const [total, available, borrowed, overdue, damaged, inRepair, missing, proposed, openRepairs, unchecked] = await prisma.$transaction([
    prisma.asset.count(),
    prisma.asset.count({ where: { lifecycleStatus: 'ACTIVE', custodyStatus: 'AVAILABLE' } }),
    prisma.asset.count({ where: { custodyStatus: 'BORROWED' } }),
    prisma.loan.count({ where: { status: 'ACTIVE', dueAt: { lt: now } } }),
    prisma.asset.count({ where: { conditionStatus: { in: ['DAMAGED_USABLE', 'UNUSABLE'] } } }),
    prisma.asset.count({ where: { custodyStatus: 'IN_REPAIR' } }),
    prisma.asset.count({ where: { custodyStatus: 'MISSING' } }),
    prisma.asset.count({ where: { lifecycleStatus: 'PROPOSED_FOR_DISPOSAL' } }),
    prisma.repairJob.count({ where: { status: { in: ['REPORTED', 'SENT'] } } }),
    prisma.inspectionItem.count({ where: { round: { status: 'OPEN' }, result: null } }),
  ])
  return { total, available, borrowed, overdue, damaged, inRepair, missing, proposed, openRepairs, unchecked }
})
