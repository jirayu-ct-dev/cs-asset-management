import { z } from 'zod'

export const adminInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(200),
  password: z.string().min(12).max(128),
})

export const adminStatusSchema = z.object({ isActive: z.boolean() })
