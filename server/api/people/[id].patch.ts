import { personInputSchema } from '../../../shared/schemas/person'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const result = await personInputSchema.partial().refine(input => Object.keys(input).length > 0, { message: 'ต้องระบุข้อมูลที่ต้องการแก้ไข' }).safeParseAsync(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: result.error.flatten() })
  return usePrisma(event).$transaction(async (tx) => {
    const before = await tx.person.findUniqueOrThrow({ where: { id } })
    const person = await tx.person.update({ where: { id }, data: result.data })
    await writeAudit(tx, { actorId: admin.id, action: 'UPDATE', entityType: 'Person', entityId: id, before, after: person })
    return person
  })
})
