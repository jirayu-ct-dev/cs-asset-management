export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  await usePrisma(event).auditLog.create({
    data: { actorId: user.id, action: 'LOGOUT', entityType: 'User', entityId: user.id },
  })
  await clearUserSession(event)
  return { success: true }
})
