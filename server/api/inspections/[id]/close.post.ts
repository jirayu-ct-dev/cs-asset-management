export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = requiredRouteParam(event)
  const body = await readBody<{ confirm?: boolean }>(event)
  return usePrisma(event).$transaction(async (tx) => {
    const round = await tx.inspectionRound.findUniqueOrThrow({ where: { id } })
    if (round.status !== 'OPEN') throw createError({ statusCode: 409, statusMessage: 'รอบตรวจปิดอยู่แล้ว' })
    const [unchecked, abnormal] = await Promise.all([
      tx.inspectionItem.count({ where: { roundId: id, result: null } }),
      tx.inspectionItem.count({ where: { roundId: id, result: { notIn: ['FOUND_OK'] } } }),
    ])
    if ((unchecked || abnormal) && !body.confirm) {
      throw createError({ statusCode: 409, statusMessage: 'ต้องยืนยันรายการยังไม่ตรวจและผิดปกติก่อนปิดรอบ', data: { unchecked, abnormal, confirmationRequired: true } })
    }
    const closed = await tx.inspectionRound.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closedById: admin.id } })
    await writeAudit(tx, { actorId: admin.id, action: 'CLOSE', entityType: 'InspectionRound', entityId: id, before: round, after: closed })
    return { round: closed, summary: { unchecked, abnormal } }
  })
})
