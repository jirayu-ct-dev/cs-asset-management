import { Prisma } from '@prisma/client'

type AuditClient = Pick<Prisma.TransactionClient, 'auditLog'>

const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (value === undefined || value === null) return Prisma.JsonNull
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export const writeAudit = async (
  tx: AuditClient,
  input: {
    actorId: string
    action: string
    entityType: string
    entityId: string
    before?: unknown
    after?: unknown
    reason?: string | null
  },
) => {
  return tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: toJson(input.before),
      after: toJson(input.after),
      reason: input.reason,
    },
  })
}
