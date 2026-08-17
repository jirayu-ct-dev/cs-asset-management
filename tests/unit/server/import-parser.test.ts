import { describe, expect, it } from 'vitest'
import { parseTabularFile, validateImportRows } from '../../../server/services/import-parser'

describe('tabular import parser', () => {
  it('normalizes Thai dates and marks duplicate asset numbers before persistence', () => {
    const rows = validateImportRows([
      {
        number: ' CS-001 ',
        title: 'คอมพิวเตอร์',
        date: '17/08/2569',
        amount: '12,500.00',
        quantity: 1,
        unit: 'unit-1',
        location: 'location-1',
        category: 'category-1',
      },
      {
        number: 'cs-001',
        title: 'คอมพิวเตอร์สำรอง',
        date: '17/08/2569',
        amount: 100,
        quantity: 1,
        unit: 'unit-1',
        location: 'location-1',
        category: 'category-1',
      },
    ], {
      assetNumber: 'number',
      name: 'title',
      receivedDate: 'date',
      price: 'amount',
      quantity: 'quantity',
      unitId: 'unit',
      locationId: 'location',
      categoryId: 'category',
    })

    expect(rows[0]).toMatchObject({ rowNumber: 2, status: 'READY' })
    expect(rows[0]?.normalized).toMatchObject({ assetNumber: 'CS-001', price: 12500 })
    expect(rows[1]).toMatchObject({ rowNumber: 3, status: 'DUPLICATE_FILE' })
  })

  it('parses UTF-8 CSV with Thai text', async () => {
    const result = await parseTabularFile(
      Buffer.from('assetNumber,name\nCS-001,เครื่องคอมพิวเตอร์\n'),
      'assets.csv',
    )
    expect(result.headers).toEqual(['assetNumber', 'name'])
    expect(result.rows).toEqual([{ assetNumber: 'CS-001', name: 'เครื่องคอมพิวเตอร์' }])
  })

  it.each([
    ['semicolon', ';'],
    ['tab', '\t'],
  ])('detects the %s CSV delimiter', async (_label, delimiter) => {
    const result = await parseTabularFile(
      Buffer.from(`assetNumber${delimiter}name\nCS-002${delimiter}อุปกรณ์เครือข่าย\n`),
      'localized.csv',
    )
    expect(result.headers).toEqual(['assetNumber', 'name'])
    expect(result.rows).toEqual([{ assetNumber: 'CS-002', name: 'อุปกรณ์เครือข่าย' }])
  })
})
