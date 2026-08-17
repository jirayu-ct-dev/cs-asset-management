import { describe, expect, it } from 'vitest'
import { personInputSchema } from '../../../shared/schemas/person'

describe('personInputSchema', () => {
  it('normalizes name and email', () => {
    expect(personInputSchema.parse({
      name: ' สมชาย ใจดี ',
      type: 'STAFF',
      email: ' USER@EXAMPLE.COM ',
    })).toMatchObject({ name: 'สมชาย ใจดี', email: 'user@example.com' })
  })

  it('rejects a blank name and malformed email', () => {
    expect(personInputSchema.safeParse({ name: ' ', type: 'STAFF', email: 'not-an-email' }).success).toBe(false)
  })
})
