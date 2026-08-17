import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import type { H3Event, MultiPartData } from 'h3'

export const attachmentOwnerTypes = ['asset', 'loan', 'repair', 'transfer', 'inspection', 'disposal'] as const
export type AttachmentOwnerType = typeof attachmentOwnerTypes[number]

const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const allowedExtensions: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

const startsWith = (data: Buffer, bytes: number[]) => bytes.every((byte, index) => data[index] === byte)

export const hasValidAttachmentSignature = (mimeType: string, filename: string, data: Buffer) => {
  const extension = extname(filename).toLowerCase()
  if (!allowedExtensions[mimeType]?.includes(extension)) return false
  if (mimeType === 'image/jpeg') return startsWith(data, [0xff, 0xd8, 0xff])
  if (mimeType === 'image/png') return startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (mimeType === 'image/webp') return data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP'
  if (mimeType === 'application/pdf') return data.subarray(0, 5).toString('ascii') === '%PDF-'
  const isZip = startsWith(data, [0x50, 0x4b, 0x03, 0x04]) && data.includes(Buffer.from('[Content_Types].xml'))
  if (mimeType.endsWith('wordprocessingml.document')) return isZip && data.includes(Buffer.from('word/'))
  if (mimeType.endsWith('spreadsheetml.sheet')) return isZip && data.includes(Buffer.from('xl/'))
  return false
}

const assertOwnerExists = async (event: H3Event, ownerType: AttachmentOwnerType, ownerId: string) => {
  const prisma = usePrisma(event)
  const owner = await (async () => {
    switch (ownerType) {
      case 'asset': return prisma.asset.findUnique({ where: { id: ownerId }, select: { id: true } })
      case 'loan': return prisma.loan.findUnique({ where: { id: ownerId }, select: { id: true } })
      case 'repair': return prisma.repairJob.findUnique({ where: { id: ownerId }, select: { id: true } })
      case 'transfer': return prisma.transfer.findUnique({ where: { id: ownerId }, select: { id: true } })
      case 'inspection': return prisma.inspectionRound.findUnique({ where: { id: ownerId }, select: { id: true } })
      case 'disposal': return prisma.disposal.findUnique({ where: { id: ownerId }, select: { id: true } })
    }
  })()
  if (!owner) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรายการเจ้าของไฟล์' })
}

export const persistAttachment = async (event: H3Event, file: MultiPartData, ownerType: AttachmentOwnerType, ownerId: string, actorId: string) => {
  if (!file.filename || !file.type) throw createError({ statusCode: 422, statusMessage: 'กรุณาเลือกไฟล์' })
  const config = useRuntimeConfig(event)
  if (file.data.byteLength > Number(config.maxUploadSize)) throw createError({ statusCode: 413, statusMessage: 'ไฟล์มีขนาดใหญ่เกินกำหนด' })
  if (!allowedTypes.has(file.type)) throw createError({ statusCode: 415, statusMessage: 'ชนิดไฟล์ไม่ได้รับอนุญาต' })
  if (!hasValidAttachmentSignature(file.type, file.filename, file.data)) throw createError({ statusCode: 415, statusMessage: 'เนื้อหาไฟล์ไม่ตรงกับชนิดหรือส่วนขยาย' })
  await assertOwnerExists(event, ownerType, ownerId)

  const uploadRoot = resolve(String(config.uploadDir))
  const relativePath = join(ownerType, ownerId, `${randomUUID()}${extname(file.filename).toLowerCase()}`)
  const storagePath = resolve(uploadRoot, relativePath)
  await mkdir(dirname(storagePath), { recursive: true })
  await writeFile(storagePath, file.data, { flag: 'wx' })

  const ownerData = {
    asset: { assetId: ownerId },
    loan: { loanId: ownerId },
    repair: { repairJobId: ownerId },
    transfer: { transferId: ownerId },
    inspection: { inspectionId: ownerId },
    disposal: { disposalId: ownerId },
  }[ownerType]
  try {
    const attachment = await usePrisma(event).$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          ...ownerData,
          originalName: file.filename!,
          storedName: basename(relativePath),
          storagePath: relativePath,
          mimeType: file.type!,
          sizeBytes: file.data.byteLength,
          checksumSha256: createHash('sha256').update(file.data).digest('hex'),
        },
      })
      await writeAudit(tx, { actorId, action: 'ATTACH', entityType: ownerType, entityId: ownerId, after: { attachmentId: created.id, filename: file.filename } })
      return created
    })
    return { ...attachment, sizeBytes: attachment.sizeBytes.toString() }
  } catch (error) {
    await unlink(storagePath).catch(() => undefined)
    throw error
  }
}
