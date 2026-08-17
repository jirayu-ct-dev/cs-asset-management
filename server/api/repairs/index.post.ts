import { repairInputSchema } from '../../../shared/schemas/workflows'
import { assertRepairable } from '../../services/workflow-rules'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, repairInputSchema)
  const prisma = usePrisma(event)
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM assets WHERE id = ${input.assetId}::uuid FOR UPDATE`
      const asset = await tx.asset.findUniqueOrThrow({ where: { id: input.assetId } })
      assertRepairable(asset)
      const repair = await tx.repairJob.create({
        data: {
          assetId: input.assetId,
          reportedAt: input.reportedAt,
          reportedBy: admin.name,
          issue: input.symptom,
          conditionBefore: asset.conditionStatus,
          custodyBefore: asset.custodyStatus,
          createdById: admin.id,
        },
      })
      await tx.asset.update({ where: { id: input.assetId }, data: { conditionStatus: asset.conditionStatus === 'UNUSABLE' ? 'UNUSABLE' : 'DAMAGED_USABLE' } })
      await tx.assetEvent.create({ data: { assetId: input.assetId, type: 'REPAIR_REPORTED', summary: `แจ้งชำรุด: ${input.symptom}`, entityType: 'RepairJob', entityId: repair.id, actorId: admin.id } })
      await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'RepairJob', entityId: repair.id, after: repair })
      return repair
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์มีงานซ่อมที่ยังไม่ปิดแล้ว' })
    throw error
  }
})
