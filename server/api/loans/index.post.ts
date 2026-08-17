import { loanInputSchema } from '../../../shared/schemas/workflows'
import { assertBorrowable } from '../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, loanInputSchema)
  const prisma = usePrisma(event)
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM assets WHERE id = ${input.assetId}::uuid FOR UPDATE`
      const asset = await tx.asset.findUniqueOrThrow({ where: { id: input.assetId } })
      assertBorrowable(asset)
      const loan = await tx.loan.create({
        data: {
          assetId: input.assetId,
          borrowerId: input.borrowerId,
          purpose: input.purpose,
          loanedAt: input.borrowedAt,
          dueAt: input.dueAt,
          conditionBefore: input.conditionBefore,
          createdById: admin.id,
        },
        include: { asset: true, borrower: true },
      })
      await tx.asset.update({ where: { id: input.assetId }, data: { custodyStatus: 'BORROWED' } })
      await tx.assetEvent.create({ data: { assetId: input.assetId, type: 'LOANED', summary: `ยืมโดย ${loan.borrower.name}`, entityType: 'Loan', entityId: loan.id, actorId: admin.id } })
      await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'Loan', entityId: loan.id, after: loan })
      return loan
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์มีรายการยืมที่ยังไม่คืนแล้ว' })
    throw error
  }
})
