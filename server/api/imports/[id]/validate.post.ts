import { readFile } from 'node:fs/promises'
import type { Prisma } from '@prisma/client'
import { parseTabularFile, validateImportRows, type ColumnMapping } from '../../../services/import-parser'
import { importBatchResponse } from '../../../services/import-response'

export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const body = await readBody<{ mapping?: Record<string, string>, sheet?: string }>(event)
  if (!body.mapping) throw createError({ statusCode: 422, statusMessage: 'กรุณาจับคู่คอลัมน์' })
  const prisma = usePrisma(event)
  const batch = await prisma.importBatch.findUniqueOrThrow({ where: { id } })
  if (batch.status !== 'REVIEWING') throw createError({ statusCode: 409, statusMessage: 'ชุดนำเข้าไม่อยู่ระหว่างตรวจทาน' })
  const fieldAliases: Record<string, string> = { unit: 'unitId', location: 'locationId', category: 'categoryId' }
  const mapping = Object.fromEntries(Object.entries(body.mapping).filter(([, field]) => field).map(([header, field]) => [fieldAliases[field] || field, header])) as ColumnMapping
  const parsed = await parseTabularFile(await readFile(batch.storedPath), batch.originalFilename, body.sheet)
  const rows = validateImportRows(parsed.rows, mapping)
  const references = await prisma.$transaction([
    prisma.unit.findMany({ select: { id: true, code: true, name: true } }),
    prisma.location.findMany({ select: { id: true, code: true, name: true } }),
    prisma.category.findMany({ select: { id: true, code: true, name: true } }),
  ])
  const resolveReference = (items: Array<{ id: string, code: string, name: string }>, source: unknown) => items.find(item => [item.id, item.code, item.name].some(value => value.toLocaleLowerCase('th-TH') === String(source || '').trim().toLocaleLowerCase('th-TH')))?.id
  for (const row of rows) {
    for (const [field, items] of [['unitId', references[0]], ['locationId', references[1]], ['categoryId', references[2]]] as const) {
      const resolved = resolveReference(items, row.normalized[field])
      if (resolved) row.normalized[field] = resolved
      else {
        row.status = 'INVALID'
        row.errors.push(`ไม่พบ${field.replace('Id', '')}ที่ตรงกับข้อมูล`)
      }
    }
  }
  const existingNumbers = new Set((await prisma.asset.findMany({ where: { assetNumber: { in: rows.map(row => String(row.normalized.assetNumber)) } }, select: { assetNumber: true } })).map(asset => asset.assetNumber.toLocaleLowerCase('th-TH')))
  for (const row of rows) {
    if (row.status === 'READY' && existingNumbers.has(String(row.normalized.assetNumber).toLocaleLowerCase('th-TH'))) {
      row.status = 'DUPLICATE_DATABASE'
      row.errors.push('หมายเลขครุภัณฑ์ซ้ำกับฐานข้อมูล')
    }
  }
  const readyRows = rows.filter(row => row.status === 'READY').length
  const updated = await prisma.$transaction(async (tx) => {
    await tx.importRow.deleteMany({ where: { batchId: id } })
    return tx.importBatch.update({
      where: { id },
      data: {
        sheetName: parsed.sheet,
        columnMapping: mapping as Prisma.InputJsonValue,
        totalRows: rows.length,
        readyRows,
        errorRows: rows.length - readyRows,
        rows: { create: rows.map(row => ({ rowNumber: row.rowNumber, rawData: row.raw as Prisma.InputJsonValue, normalizedData: JSON.parse(JSON.stringify(row.normalized)) as Prisma.InputJsonValue, status: row.status, errors: row.errors as Prisma.InputJsonValue })) },
      },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    })
  })
  return importBatchResponse(updated, { headers: parsed.headers })
})
