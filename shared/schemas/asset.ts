import { z } from 'zod'
import { conditionStatuses, custodyStatuses, lifecycleStatuses } from '../types/domain'

const optionalText = z.string().trim().max(255).optional().nullable()

export const assetInputSchema = z.object({
  assetNumber: z.string().trim().min(1).max(100),
  internalCode: optionalText,
  name: z.string().trim().min(1).max(255),
  categoryId: z.string().trim().min(1),
  unitId: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  fundingSourceId: z.string().trim().min(1).optional().nullable(),
  responsiblePersonId: z.string().trim().min(1).optional().nullable(),
  quantity: z.coerce.number().int().positive().default(1),
  brand: optionalText,
  model: optionalText,
  serialNumber: optionalText,
  receivedDate: z.coerce.date(),
  price: z.coerce.number().nonnegative().multipleOf(0.01),
  lifecycleStatus: z.enum(lifecycleStatuses).default('ACTIVE'),
  custodyStatus: z.enum(custodyStatuses).default('AVAILABLE'),
  conditionStatus: z.enum(conditionStatuses).default('NORMAL'),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export type AssetInput = z.infer<typeof assetInputSchema>
