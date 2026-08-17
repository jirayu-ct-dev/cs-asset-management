import type { Prisma } from '@prisma/client'
import { importBatchResponse } from '../../../services/import-response'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  return usePrisma(event).$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM import_batches WHERE id = ${id}::uuid FOR UPDATE`
    const batch = await tx.importBatch.findUniqueOrThrow({ where: { id }, include: { rows: { where: { status: 'READY' }, orderBy: { rowNumber: 'asc' } } } })
    if (batch.status !== 'REVIEWING') throw createError({ statusCode: 409, statusMessage: 'ชุดนำเข้าถูกยืนยันหรือยกเลิกแล้ว' })
    let importedRows = 0
    for (const row of batch.rows) {
      const data = row.normalizedData as Prisma.JsonObject
      const assetData = {
        assetNumber: String(data.assetNumber),
        name: String(data.name),
        acquisitionDate: new Date(String(data.receivedDate)),
        price: Number(data.price),
        quantity: Number(data.quantity),
        unitId: String(data.unitId),
        locationId: String(data.locationId),
        categoryId: String(data.categoryId),
      }
      const inserted = await tx.asset.createMany({ data: assetData, skipDuplicates: true })
      if (inserted.count === 0) {
        await tx.importRow.update({ where: { id: row.id }, data: { status: 'DUPLICATE_DATABASE', errors: ['ข้อมูลซ้ำขณะยืนยัน'] } })
        continue
      }
      const asset = await tx.asset.findUniqueOrThrow({ where: { assetNumber: assetData.assetNumber } })
      await tx.importRow.update({ where: { id: row.id }, data: { status: 'IMPORTED', assetId: asset.id } })
      await tx.assetEvent.create({ data: { assetId: asset.id, type: 'IMPORTED', summary: `นำเข้าจาก ${batch.originalFilename}`, entityType: 'ImportBatch', entityId: batch.id, actorId: admin.id } })
      importedRows += 1
    }
    const updated = await tx.importBatch.update({ where: { id }, data: { status: 'IMPORTED', importedRows, confirmedAt: new Date(), errorRows: batch.totalRows - importedRows } })
    await writeAudit(tx, { actorId: admin.id, action: 'CONFIRM', entityType: 'ImportBatch', entityId: id, after: updated })
    const rows = await tx.importRow.findMany({ where: { batchId: id }, orderBy: { rowNumber: 'asc' } })
    return importBatchResponse({ ...updated, rows })
  })
})
