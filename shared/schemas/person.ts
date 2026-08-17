import { z } from 'zod'

export const personInputSchema = z.object({
  code: z.string().trim().max(100).optional().nullable(),
  name: z.string().trim().min(1).max(255),
  type: z.enum(['STUDENT', 'STAFF', 'EXTERNAL']),
  department: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().toLowerCase().email().max(254).optional().nullable(),
  isActive: z.boolean().default(true),
})
