import { describe, expect, it } from 'vitest'
import { hasValidAttachmentSignature } from '../../../server/services/attachments'

describe('attachment signatures', () => {
  it('accepts matching image and PDF signatures', () => {
    expect(hasValidAttachmentSignature('image/jpeg', 'photo.jpg', Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe(true)
    expect(hasValidAttachmentSignature('image/png', 'scan.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true)
    expect(hasValidAttachmentSignature('application/pdf', 'evidence.pdf', Buffer.from('%PDF-1.7'))).toBe(true)
  })

  it('rejects spoofed MIME types and mismatched extensions', () => {
    expect(hasValidAttachmentSignature('application/pdf', 'evidence.pdf', Buffer.from('plain text'))).toBe(false)
    expect(hasValidAttachmentSignature('image/jpeg', 'photo.png', Buffer.from([0xff, 0xd8, 0xff]))).toBe(false)
  })

  it('distinguishes OOXML document containers', () => {
    const prefix = Buffer.from([0x50, 0x4b, 0x03, 0x04])
    const docx = Buffer.concat([prefix, Buffer.from('[Content_Types].xml word/document.xml')])
    const xlsx = Buffer.concat([prefix, Buffer.from('[Content_Types].xml xl/workbook.xml')])
    expect(hasValidAttachmentSignature('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'report.docx', docx)).toBe(true)
    expect(hasValidAttachmentSignature('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'report.xlsx', xlsx)).toBe(true)
    expect(hasValidAttachmentSignature('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'report.xlsx', docx)).toBe(false)
  })
})
