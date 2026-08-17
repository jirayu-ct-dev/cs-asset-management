import { z } from 'zod'

export const referenceInputSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})
