import { assetInputSchema } from '../../../shared/schemas/asset'
import { normalizeAssetNumber } from '../../../shared/utils/normalize'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const result = await assetInputSchema.omit({
    locationId: true,
    responsiblePersonId: true,
    lifecycleStatus: true,
    custodyStatus: true,
    conditionStatus: true,
  }).partial().safeParseAsync(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  const input = result.data
  const { receivedDate, ...assetData } = input
  const prisma = usePrisma(event)
  const before = await prisma.asset.findUnique({ where: { id } })
  if (!before) throw createError({ statusCode: 404, statusMessage: 'ไม่พบครุภัณฑ์' })
  try {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          ...assetData,
          ...(input.assetNumber && { assetNumber: normalizeAssetNumber(input.assetNumber) }),
          ...(receivedDate && { acquisitionDate: receivedDate }),
        },
      })
      await tx.assetEvent.create({ data: { assetId: id, type: 'UPDATED', summary: 'แก้ไขข้อมูลทะเบียน', actorId: admin.id } })
      await writeAudit(tx, { actorId: admin.id, action: 'UPDATE', entityType: 'Asset', entityId: id, before, after: asset })
      return asset
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'หมายเลขครุภัณฑ์ซ้ำ' })
    throw error
  }
})
