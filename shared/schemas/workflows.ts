import { z } from 'zod'
import { conditionStatuses, inspectionResults } from '../types/domain'

const id = z.string().trim().min(1)
const date = z.coerce.date()
const reason = z.string().trim().min(1).max(2000)

export const loanInputSchema = z.object({
  assetId: id,
  borrowerId: id,
  purpose: reason,
  borrowedAt: date,
  dueAt: date,
  conditionBefore: z.enum(conditionStatuses),
}).refine(input => input.dueAt >= input.borrowedAt, {
  message: 'dueAt must not be before borrowedAt',
  path: ['dueAt'],
})

export const loanReturnSchema = z.object({
  returnedAt: date,
  conditionAfter: z.enum(conditionStatuses),
  notes: z.string().trim().max(2000).optional().nullable(),
  openRepair: z.boolean().default(false),
  damageDescription: z.string().trim().max(2000).optional().nullable(),
})

export const repairInputSchema = z.object({
  assetId: id,
  reporterId: id.optional().nullable(),
  reportedAt: date,
  symptom: reason,
})

export const repairSendSchema = z.object({
  vendor: z.string().trim().min(1).max(255),
  sentAt: date,
  documentNumber: z.string().trim().max(100).optional().nullable(),
  expectedAt: date.optional().nullable(),
})

export const repairCloseSchema = z.object({
  receivedAt: date,
  successful: z.boolean(),
  result: reason,
  cost: z.coerce.number().nonnegative().multipleOf(0.01),
})

export const transferInputSchema = z.object({
  assetId: id,
  destinationLocationId: id,
  newResponsiblePersonId: id.optional().nullable(),
  transferredAt: date,
  reason,
})

export const inspectionRoundSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2500).max(2800),
  name: z.string().trim().min(1).max(255),
  locationId: id.optional().nullable(),
})

export const inspectionItemSchema = z.object({
  result: z.enum(inspectionResults),
  actualLocationId: id.optional().nullable(),
  observedCondition: z.enum(conditionStatuses).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export const disposalInputSchema = z.object({
  assetId: id,
  proposedAt: date,
  reason,
})

export const disposalCompleteSchema = z.object({
  disposedAt: date,
  method: z.string().trim().min(1).max(255),
  documentNumber: z.string().trim().min(1).max(100),
})

export const cancellationSchema = z.object({ reason })
