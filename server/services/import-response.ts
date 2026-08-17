type ImportRowView = {
  rowNumber: number
  normalizedData: unknown
  status: string
  errors: unknown
}

type ImportBatchView = {
  id: string
  publicId: string
  originalFilename: string
  status: string
  totalRows: number
  readyRows: number
  importedRows: number
  errorRows: number
  rows: ImportRowView[]
}

export const importBatchResponse = (batch: ImportBatchView, extra: Record<string, unknown> = {}) => ({
  id: batch.id,
  publicId: batch.publicId,
  originalFilename: batch.originalFilename,
  status: batch.status,
  headers: [],
  rows: batch.rows.map(row => ({
    rowNumber: row.rowNumber,
    data: row.normalizedData,
    valid: row.status === 'READY' || row.status === 'IMPORTED',
    status: row.status,
    errors: Array.isArray(row.errors) ? row.errors : [],
  })),
  summary: {
    total: batch.totalRows,
    valid: batch.readyRows,
    invalid: batch.errorRows,
    duplicate: batch.rows.filter(row => row.status.startsWith('DUPLICATE')).length,
    imported: batch.importedRows,
    skipped: Math.max(0, batch.totalRows - batch.importedRows - batch.errorRows),
  },
  ...extra,
})
