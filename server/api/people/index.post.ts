import { personInputSchema } from '../../../shared/schemas/person'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, personInputSchema)
  const prisma = usePrisma(event)
  return prisma.$transaction(async (tx) => {
    const person = await tx.person.create({ data: input })
    await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'Person', entityId: person.id, after: person })
    return person
  })
})
