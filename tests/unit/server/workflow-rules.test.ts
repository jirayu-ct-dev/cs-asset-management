import { describe, expect, it } from 'vitest'
import {
  assertBorrowable,
  assertTransferable,
  repairResultState,
  returnState,
} from '../../../server/services/workflow-rules'

const availableAsset = {
  lifecycleStatus: 'ACTIVE',
  custodyStatus: 'AVAILABLE',
  conditionStatus: 'NORMAL',
} as const

describe('workflow state rules', () => {
  it('allows only active, available, usable assets to be borrowed', () => {
    expect(() => assertBorrowable(availableAsset)).not.toThrow()
    expect(() => assertBorrowable({ ...availableAsset, lifecycleStatus: 'PROPOSED_FOR_DISPOSAL' })).toThrow()
    expect(() => assertBorrowable({ ...availableAsset, custodyStatus: 'BORROWED' })).toThrow()
    expect(() => assertBorrowable({ ...availableAsset, conditionStatus: 'UNUSABLE' })).toThrow()
  })

  it('requires a borrowed asset to be returned before transfer', () => {
    expect(() => assertTransferable(availableAsset)).not.toThrow()
    expect(() => assertTransferable({ ...availableAsset, custodyStatus: 'BORROWED' })).toThrow()
    expect(() => assertTransferable({ ...availableAsset, lifecycleStatus: 'DISPOSED' })).toThrow()
  })

  it('derives return and repair result states', () => {
    expect(returnState('DAMAGED_USABLE')).toEqual({
      custodyStatus: 'AVAILABLE',
      conditionStatus: 'DAMAGED_USABLE',
    })
    expect(repairResultState(true)).toEqual({ custodyStatus: 'AVAILABLE', conditionStatus: 'NORMAL' })
    expect(repairResultState(false)).toEqual({ custodyStatus: 'AVAILABLE', conditionStatus: 'UNUSABLE' })
  })
})

