import ExcelJS from 'exceljs'
import { parse } from 'csv-parse/sync'
import { assetInputSchema } from '../../shared/schemas/asset'
import { normalizeAssetNumber, parseDecimal, parseLocalizedDate } from '../../shared/utils/normalize'

export const importFields = ['assetNumber', 'name', 'receivedDate', 'price', 'quantity', 'unitId', 'locationId', 'categoryId'] as const
export type ImportField = typeof importFields[number]
export type ColumnMapping = Partial<Record<ImportField, string>>

export interface ParsedImportRow {
  rowNumber: number
  raw: Record<string, unknown>
  normalized: Record<string, unknown>
  status: 'READY' | 'INVALID' | 'DUPLICATE_FILE' | 'DUPLICATE_DATABASE'
  errors: string[]
}

const normalizeRow = (raw: Record<string, unknown>, mapping: ColumnMapping) => {
  const read = (field: ImportField) => raw[mapping[field] || field]
  return {
    assetNumber: normalizeAssetNumber(read('assetNumber')),
    name: String(read('name') ?? '').trim(),
    receivedDate: parseLocalizedDate(read('receivedDate')),
    price: parseDecimal(read('price')),
    quantity: Number(read('quantity') || 1),
    unitId: String(read('unitId') ?? '').trim(),
    locationId: String(read('locationId') ?? '').trim(),
    categoryId: String(read('categoryId') ?? '').trim(),
  }
}

export const validateImportRows = (rows: Record<string, unknown>[], mapping: ColumnMapping): ParsedImportRow[] => {
  const seen = new Set<string>()
  return rows.map((raw, index) => {
    const normalized = normalizeRow(raw, mapping)
    const result = assetInputSchema.safeParse(normalized)
    const errors = result.success
      ? []
      : result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    let status: ParsedImportRow['status'] = result.success ? 'READY' : 'INVALID'
    const duplicateKey = normalized.assetNumber.toLocaleLowerCase('th-TH')
    if (duplicateKey && seen.has(duplicateKey)) {
      status = 'DUPLICATE_FILE'
      errors.push('หมายเลขครุภัณฑ์ซ้ำภายในไฟล์')
    }
    seen.add(duplicateKey)
    return { rowNumber: index + 2, raw, normalized, status, errors }
  })
}

export const parseTabularFile = async (data: Buffer, filename: string, sheetName?: string) => {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(data as unknown as ExcelJS.Buffer)
    const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0]
    if (!sheet) throw createError({ statusCode: 422, statusMessage: 'ไม่พบ Sheet ที่เลือก' })
    const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(value => String(value ?? '').trim())
    const rows: Record<string, unknown>[] = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const values = (row.values as unknown[]).slice(1)
      if (values.every(value => value === null || value === undefined || value === '')) return
      rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index]])))
    })
    return { sheet: sheet.name, sheets: workbook.worksheets.map(item => item.name), headers, rows }
  }
  if (lower.endsWith('.csv')) {
    const candidates = [',', ';', '\t'].map((delimiter) => {
      const rows = parse(data, { columns: true, delimiter, bom: true, skip_empty_lines: true, relax_column_count: true }) as Record<string, unknown>[]
      return { delimiter, rows, columns: Object.keys(rows[0] || {}).length }
    })
    const selected = candidates.sort((left, right) => right.columns - left.columns)[0]
    const rows = selected?.rows || []
    return { sheet: null, sheets: [], delimiter: selected?.delimiter || ',', headers: Object.keys(rows[0] || {}), rows }
  }
  throw createError({ statusCode: 415, statusMessage: 'รองรับเฉพาะไฟล์ .xlsx และ .csv' })
}
