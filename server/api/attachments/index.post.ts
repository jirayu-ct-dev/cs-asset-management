import { attachmentOwnerTypes, persistAttachment, type AttachmentOwnerType } from '../../services/attachments'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  const ownerType = parts?.find(part => part.name === 'ownerType')?.data.toString('utf8') as AttachmentOwnerType | undefined
  const ownerId = parts?.find(part => part.name === 'ownerId')?.data.toString('utf8')
  if (!file) throw createError({ statusCode: 422, statusMessage: 'กรุณาเลือกไฟล์' })
  if (!ownerType || !attachmentOwnerTypes.includes(ownerType) || !ownerId) throw createError({ statusCode: 422, statusMessage: 'ประเภทหรือรหัสรายการเจ้าของไฟล์ไม่ถูกต้อง' })
  return persistAttachment(event, file, ownerType, ownerId, admin.id)
})
