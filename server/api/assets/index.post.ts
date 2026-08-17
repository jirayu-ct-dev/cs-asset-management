import { assetInputSchema } from '../../../shared/schemas/asset'
import { normalizeAssetNumber } from '../../../shared/utils/normalize'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, assetInputSchema)
  const createInput = assetInputSchema.omit({ lifecycleStatus: true, custodyStatus: true, conditionStatus: true }).parse(input)
  const { receivedDate, ...assetData } = createInput
  const prisma = usePrisma(event)
  try {
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          ...assetData,
          assetNumber: normalizeAssetNumber(input.assetNumber),
          acquisitionDate: receivedDate,
          lifecycleStatus: 'ACTIVE',
          custodyStatus: 'AVAILABLE',
          conditionStatus: 'NORMAL',
        },
        include: { category: true, unit: true, location: true, responsiblePerson: true },
      })
      await tx.assetEvent.create({ data: { assetId: asset.id, type: 'CREATED', summary: 'สร้างทะเบียนครุภัณฑ์', actorId: admin.id } })
      await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'Asset', entityId: asset.id, after: asset })
      return asset
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'หมายเลขครุภัณฑ์หรือรหัสภายในซ้ำ' })
    }
    throw error
  }
})
