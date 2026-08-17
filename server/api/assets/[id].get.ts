const idWhere = (value: string) => {
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value) ? { id: value } : { publicId: value }
}

export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const asset = await usePrisma(event).asset.findUnique({
    where: idWhere(id),
    include: {
      category: true,
      unit: true,
      fundingSource: true,
      location: true,
      responsiblePerson: true,
      attachments: true,
      events: { include: { actor: { select: { id: true, name: true } } }, orderBy: { occurredAt: 'desc' } },
    },
  })
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'ไม่พบครุภัณฑ์' })
  return { ...asset, attachments: asset.attachments.map(file => ({ ...file, sizeBytes: file.sizeBytes.toString() })) }
})
