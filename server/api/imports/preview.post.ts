import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { extname, join, resolve } from 'node:path'
import type { Prisma } from '@prisma/client'
import { parseTabularFile, validateImportRows, type ColumnMapping } from '../../services/import-parser'
import { importBatchResponse } from '../../services/import-response'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file?.filename || !file.type) throw createError({ statusCode: 422, statusMessage: 'กรุณาเลือกไฟล์' })
  const config = useRuntimeConfig(event)
  if (file.data.byteLength > Number(config.maxUploadSize)) throw createError({ statusCode: 413, statusMessage: 'ไฟล์มีขนาดใหญ่เกินกำหนด' })
  const mappingText = parts?.find(part => part.name === 'mapping')?.data.toString('utf8') || '{}'
  const sheetName = parts?.find(part => part.name === 'sheet')?.data.toString('utf8') || undefined
  let mapping: ColumnMapping
  try { mapping = JSON.parse(mappingText) as ColumnMapping } catch { throw createError({ statusCode: 422, statusMessage: 'รูปแบบ mapping ไม่ถูกต้อง' }) }
  const parsed = await parseTabularFile(file.data, file.filename, sheetName)
  const rows = validateImportRows(parsed.rows, mapping)
  const prisma = usePrisma(event)
  const numbers = rows.filter(row => row.status === 'READY').map(row => String(row.normalized.assetNumber))
  const existing = new Set((await prisma.asset.findMany({ where: { assetNumber: { in: numbers } }, select: { assetNumber: true } })).map(asset => asset.assetNumber.toLocaleLowerCase('th-TH')))
  for (const row of rows) {
    if (row.status === 'READY' && existing.has(String(row.normalized.assetNumber).toLocaleLowerCase('th-TH'))) {
      row.status = 'DUPLICATE_FILE'
      row.errors.push('หมายเลขครุภัณฑ์ซ้ำกับข้อมูลในระบบ')
    }
  }
  const uploadRoot = resolve(String(config.uploadDir))
  const directory = join(uploadRoot, 'imports')
  await mkdir(directory, { recursive: true })
  const storedPath = join(directory, `${randomUUID()}${extname(file.filename).toLowerCase()}`)
  await writeFile(storedPath, file.data, { flag: 'wx' })
  const readyRows = rows.filter(row => row.status === 'READY').length
  const batch = await prisma.importBatch.create({
    data: {
      originalFilename: file.filename,
      storedPath,
      mimeType: file.type,
      sheetName: parsed.sheet,
      delimiter: 'delimiter' in parsed ? parsed.delimiter : null,
      columnMapping: mapping as Prisma.InputJsonValue,
      totalRows: rows.length,
      readyRows,
      errorRows: rows.length - readyRows,
      createdById: admin.id,
      rows: { create: rows.map(row => ({ rowNumber: row.rowNumber, rawData: row.raw as Prisma.InputJsonValue, normalizedData: JSON.parse(JSON.stringify(row.normalized)) as Prisma.InputJsonValue, status: row.status === 'DUPLICATE_FILE' && row.errors.some(error => error.includes('ในระบบ')) ? 'DUPLICATE_DATABASE' : row.status, errors: row.errors as Prisma.InputJsonValue })) },
    },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  })
  const suggestedMapping = Object.fromEntries(parsed.headers.map((header) => {
    const normalized = header.toLocaleLowerCase('th-TH').replace(/\s+/g, '')
    const aliases: Record<string, string> = { assetnumber: 'assetNumber', 'หมายเลขครุภัณฑ์': 'assetNumber', name: 'name', 'ชื่อ': 'name', receiveddate: 'receivedDate', 'วันที่รับ': 'receivedDate', price: 'price', 'ราคา': 'price', quantity: 'quantity', 'จำนวน': 'quantity', unit: 'unit', 'หน่วยนับ': 'unit', location: 'location', 'สถานที่': 'location', category: 'category', 'หมวด': 'category' }
    return [header, aliases[normalized] || '']
  }))
  return importBatchResponse(batch, { sheets: parsed.sheets, headers: parsed.headers, suggestedMapping })
})
