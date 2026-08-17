import { describe, expect, it } from 'vitest'
import {
  inspectionRoundSchema,
  loanInputSchema,
  repairCloseSchema,
} from '../../../shared/schemas/workflows'

describe('workflow schemas', () => {
  it('accepts a loan whose due date is the borrowed date', () => {
    const result = loanInputSchema.parse({
      assetId: 'asset-1',
      borrowerId: 'person-1',
      purpose: 'ใช้สอน',
      borrowedAt: '2026-08-17',
      dueAt: '2026-08-17',
      conditionBefore: 'NORMAL',
    })
    expect(result.dueAt).toEqual(result.borrowedAt)
  })

  it('rejects a due date before the borrowed date', () => {
    const result = loanInputSchema.safeParse({
      assetId: 'asset-1',
      borrowerId: 'person-1',
      purpose: 'ใช้สอน',
      borrowedAt: '2026-08-18',
      dueAt: '2026-08-17',
      conditionBefore: 'NORMAL',
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero repair cost and rejects fractional satang', () => {
    const base = { receivedAt: '2026-08-17', successful: true, result: 'ซ่อมสำเร็จ' }
    expect(repairCloseSchema.parse({ ...base, cost: 0 }).cost).toBe(0)
    expect(repairCloseSchema.safeParse({ ...base, cost: 1.001 }).success).toBe(false)
  })

  it('requires a Thai fiscal year in the supported range', () => {
    expect(inspectionRoundSchema.safeParse({ fiscalYear: 2569, name: 'รอบปี 2569' }).success).toBe(true)
    expect(inspectionRoundSchema.safeParse({ fiscalYear: 2026, name: 'wrong calendar' }).success).toBe(false)
  })
})

