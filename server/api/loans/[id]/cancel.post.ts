import { cancellationSchema } from '../../../../shared/schemas/workflows'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const { reason } = await readSchemaBody(event, cancellationSchema)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM loans WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.loan.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'ACTIVE') throw createError({ statusCode: 409, statusMessage: 'ยกเลิกได้เฉพาะรายการที่กำลังยืม' })
    const loan = await tx.loan.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() } })
    await tx.asset.update({ where: { id: before.assetId }, data: { custodyStatus: 'AVAILABLE' } })
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'LOAN_CANCELLED', summary: `ยกเลิกการยืม: ${reason}`, entityType: 'Loan', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'CANCEL', entityType: 'Loan', entityId: id, before, after: loan, reason })
    return loan
  })
})
