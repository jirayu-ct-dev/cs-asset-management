import { loginSchema } from '../../../shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const input = await readSchemaBody(event, loginSchema)
  const attemptKey = loginAttemptKey(event, input.email)
  assertLoginAllowed(attemptKey)
  const prisma = usePrisma(event)
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, input.password))) {
    recordLoginFailure(attemptKey)
    throw createError({ statusCode: 401, statusMessage: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  }
  clearLoginFailures(attemptKey)

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
    loggedInAt: new Date().toISOString(),
  })

  await prisma.auditLog.create({
    data: { actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id },
  })

  return { user: { id: user.id, email: user.email, name: user.name } }
})
