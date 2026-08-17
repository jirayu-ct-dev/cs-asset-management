import { loanReturnSchema } from '../../../../shared/schemas/workflows'
import { returnState } from '../../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const input = await readSchemaBody(event, loanReturnSchema)
  const prisma = usePrisma(event)
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM loans WHERE id = ${id}::uuid FOR UPDATE`
    const before = await tx.loan.findUniqueOrThrow({ where: { id } })
    if (before.status !== 'ACTIVE') throw createError({ statusCode: 409, statusMessage: 'รายการนี้ไม่ได้อยู่ระหว่างยืม' })
    if (input.returnedAt < before.loanedAt) throw createError({ statusCode: 422, statusMessage: 'วันคืนต้องไม่ก่อนวันยืม' })
    if (input.openRepair && input.conditionAfter === 'NORMAL') throw createError({ statusCode: 422, statusMessage: 'ไม่สามารถเปิดงานซ่อมเมื่อสภาพหลังคืนเป็นปกติ' })
    const loan = await tx.loan.update({
      where: { id },
      data: { status: 'RETURNED', returnedAt: input.returnedAt, conditionAfter: input.conditionAfter, notes: input.notes, returnedById: admin.id },
    })
    await tx.asset.update({ where: { id: before.assetId }, data: returnState(input.conditionAfter) })
    let repairId: string | null = null
    if (input.openRepair) {
      const repair = await tx.repairJob.create({
        data: {
          assetId: before.assetId,
          reportedAt: input.returnedAt,
          reportedBy: admin.name,
          issue: input.damageDescription || 'พบความเสียหายตอนรับคืน',
          createdById: admin.id,
        },
      })
      repairId = repair.id
    }
    await tx.assetEvent.create({ data: { assetId: before.assetId, type: 'RETURNED', summary: input.openRepair ? 'รับคืนและเปิดงานซ่อม' : 'รับคืนครุภัณฑ์', entityType: 'Loan', entityId: id, actorId: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'RETURN', entityType: 'Loan', entityId: id, before, after: loan })
    return { loan, repairId }
  })
})
