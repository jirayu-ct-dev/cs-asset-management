import { createReadStream } from 'node:fs'
import { resolve, sep } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const attachment = await usePrisma(event).attachment.findUnique({ where: { id } })
  if (!attachment) throw createError({ statusCode: 404, statusMessage: 'ไม่พบไฟล์แนบ' })
  const uploadRoot = resolve(String(useRuntimeConfig(event).uploadDir))
  const path = resolve(uploadRoot, attachment.storagePath)
  if (!path.startsWith(`${uploadRoot}${sep}`)) throw createError({ statusCode: 500, statusMessage: 'ตำแหน่งไฟล์ไม่ถูกต้อง' })
  setResponseHeader(event, 'Content-Type', attachment.mimeType)
  setResponseHeader(event, 'Content-Length', Number(attachment.sizeBytes))
  setResponseHeader(event, 'Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`)
  return sendStream(event, createReadStream(path))
})
