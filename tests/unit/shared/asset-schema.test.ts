import { describe, expect, it } from 'vitest'
import { assetInputSchema } from '../../../shared/schemas/asset'

const validAsset = {
  assetNumber: ' CS-2569/001 ',
  name: ' Notebook ',
  categoryId: 'category-1',
  unitId: 'unit-1',
  locationId: 'location-1',
  receivedDate: '2026-08-17',
  price: '12500.50',
}

describe('assetInputSchema', () => {
  it('normalizes a valid asset and applies initial statuses', () => {
    const result = assetInputSchema.parse(validAsset)

    expect(result).toMatchObject({
      assetNumber: 'CS-2569/001',
      name: 'Notebook',
      quantity: 1,
      price: 12500.5,
      lifecycleStatus: 'ACTIVE',
      custodyStatus: 'AVAILABLE',
      conditionStatus: 'NORMAL',
    })
    expect(result.receivedDate).toBeInstanceOf(Date)
  })

  it.each([
    ['blank asset number', { assetNumber: ' ' }],
    ['zero quantity', { quantity: 0 }],
    ['negative price', { price: -1 }],
    ['fractional satang', { price: 10.001 }],
    ['unknown custody status', { custodyStatus: 'LOST_FOREVER' }],
  ])('rejects %s', (_label, override) => {
    expect(() => assetInputSchema.parse({ ...validAsset, ...override })).toThrow()
  })
})

