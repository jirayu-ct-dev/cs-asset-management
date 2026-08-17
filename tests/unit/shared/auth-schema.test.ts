import { describe, expect, it } from 'vitest'
import { loginSchema, passwordChangeSchema } from '../../../shared/schemas/auth'

describe('authentication schemas', () => {
  it('normalizes the login email without changing the password', () => {
    expect(loginSchema.parse({
      email: ' ADMIN@Example.COM ',
      password: ' pass word ',
    })).toEqual({
      email: 'admin@example.com',
      password: ' pass word ',
    })
  })

  it.each([
    { email: 'invalid', password: 'valid-password' },
    { email: 'admin@example.com', password: 'short' },
  ])('rejects invalid credentials: $email', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false)
  })

  it('requires a stronger new password than the current password minimum', () => {
    expect(passwordChangeSchema.safeParse({
      currentPassword: 'old-pass',
      newPassword: 'too-short',
    }).success).toBe(false)
  })
})

