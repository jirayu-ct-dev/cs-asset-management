import { z } from 'zod'
import { inspectionResults, lifecycleStatuses } from '../types/domain'

export const reportTypes = ['assets', 'loans', 'repairs', 'transfers', 'inspections', 'disposals', 'asset-history'] as const

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}, 'วันที่ไม่ถูกต้อง')

const base = {
  from: dateText.optional(),
  to: dateText.optional(),
  assetId: z.string().trim().min(1).optional(),
}

const schemas = {
  assets: z.object({
    ...base,
    locationId: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).optional(),
    status: z.enum(lifecycleStatuses).optional(),
  }).strict(),
  loans: z.object({ ...base, status: z.enum(['ACTIVE', 'OVERDUE', 'RETURNED', 'CANCELLED']).optional() }).strict(),
  repairs: z.object({ ...base, status: z.enum(['REPORTED', 'SENT', 'COMPLETED', 'CANCELLED']).optional() }).strict(),
  transfers: z.object(base).strict(),
  inspections: z.object({
    ...base,
    roundId: z.string().trim().min(1).optional(),
    status: z.enum(inspectionResults).optional(),
  }).strict(),
  disposals: z.object({ ...base, status: z.enum(['PROPOSED', 'COMPLETED', 'CANCELLED']).optional() }).strict(),
  'asset-history': z.object(base).strict(),
} satisfies Record<typeof reportTypes[number], z.ZodType<Record<string, string | undefined>>>

export type ReportType = typeof reportTypes[number]
export type ReportQuery = Record<string, string | undefined>

export const parseReportQuery = (type: ReportType, input: Record<string, unknown>): ReportQuery => {
  const query = Object.fromEntries(Object.entries(input).filter(([key]) => !['type', 'format'].includes(key)))
  const parsed = schemas[type].safeParse(query)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'เงื่อนไขรายงานไม่ถูกต้อง')
  if (parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to) throw new Error('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด')
  return parsed.data
}
