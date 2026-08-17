import { persistAttachment } from '../../../services/attachments'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const assetId = requiredRouteParam(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 422, statusMessage: 'กรุณาเลือกไฟล์' })
  return persistAttachment(event, file, 'asset', assetId, admin.id)
})
