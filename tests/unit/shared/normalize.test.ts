import { describe, expect, it } from 'vitest'
import { normalizeAssetNumber, parseDecimal, parseLocalizedDate } from '../../../shared/utils/normalize'

describe('import normalization utilities', () => {
  it('normalizes Unicode width and repeated whitespace in asset numbers', () => {
    expect(normalizeAssetNumber('  ＡＢＣ  12/3 ')).toBe('ABC 12/3')
  })

  it.each([
    ['17/08/2569', '2026-08-17'],
    ['17.08.2026', '2026-08-17'],
    ['17-08-2569', '2026-08-17'],
  ])('parses localized date %s', (input, expected) => {
    expect(parseLocalizedDate(input)?.toISOString().slice(0, 10)).toBe(expected)
  })

  it.each(['31/02/2569', '', 'not-a-date'])('rejects invalid date %s', (input) => {
    expect(parseLocalizedDate(input)).toBeNull()
  })

  it('parses grouped decimal amounts', () => {
    expect(parseDecimal('1,234.50')).toBe(1234.5)
    expect(parseDecimal('-1')).toBeNull()
    expect(parseDecimal('Infinity')).toBeNull()
  })
})
