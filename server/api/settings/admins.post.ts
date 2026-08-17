import { adminInputSchema } from '../../../shared/schemas/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const input = await readSchemaBody(event, adminInputSchema)
  const prisma = usePrisma(event)
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash: await hashPassword(input.password) }, select: { id: true, email: true, name: true, isActive: true, createdAt: true } })
      await writeAudit(tx, { actorId: admin.id, action: 'CREATE', entityType: 'User', entityId: user.id, after: user })
      return user
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'อีเมลนี้มีบัญชีแล้ว' })
    throw error
  }
})
