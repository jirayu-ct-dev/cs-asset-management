import { describe, expect, it } from 'vitest'
import { parseReportQuery } from '../../../shared/schemas/report'
import { bangkokDateRange } from '../../../server/services/reports'

describe('report query', () => {
  it('accepts only statuses belonging to the selected report', () => {
    expect(parseReportQuery('loans', { status: 'ACTIVE' })).toEqual({ status: 'ACTIVE' })
    expect(parseReportQuery('loans', { status: 'OVERDUE' })).toEqual({ status: 'OVERDUE' })
    expect(() => parseReportQuery('loans', { status: 'DISPOSED' })).toThrow()
    expect(() => parseReportQuery('transfers', { status: 'ACTIVE' })).toThrow()
  })

  it('rejects invalid and reversed dates', () => {
    expect(() => parseReportQuery('assets', { from: '2026-02-30' })).toThrow('วันที่ไม่ถูกต้อง')
    expect(() => parseReportQuery('assets', { from: '2026-08-18', to: '2026-08-17' })).toThrow('วันที่เริ่มต้น')
  })

  it('uses Bangkok midnight and an exclusive next-day boundary', () => {
    const range = bangkokDateRange({ from: '2026-08-17', to: '2026-08-17' })
    expect(range?.gte?.toISOString()).toBe('2026-08-16T17:00:00.000Z')
    expect(range?.lt?.toISOString()).toBe('2026-08-17T17:00:00.000Z')
  })
})
