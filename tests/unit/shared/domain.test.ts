import { describe, expect, it } from 'vitest'
import {
  conditionStatuses,
  custodyStatuses,
  inspectionResults,
  lifecycleStatuses,
} from '../../../shared/types/domain'

describe('domain status dimensions', () => {
  it('keeps lifecycle, custody, and condition independent', () => {
    expect(lifecycleStatuses).toEqual(['ACTIVE', 'PROPOSED_FOR_DISPOSAL', 'DISPOSED'])
    expect(custodyStatuses).toEqual(['AVAILABLE', 'BORROWED', 'IN_REPAIR', 'MISSING'])
    expect(conditionStatuses).toEqual(['NORMAL', 'DAMAGED_USABLE', 'UNUSABLE'])
  })

  it('does not classify an uninspected item as missing', () => {
    expect(inspectionResults).not.toContain('NOT_INSPECTED')
    expect(inspectionResults).toContain('MISSING')
  })
})

