export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const person = await usePrisma(event).person.findUnique({ where: { id } })
  if (!person) throw createError({ statusCode: 404, statusMessage: 'ไม่พบข้อมูลบุคคล' })
  return person
})
