import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  const id = requiredRouteParam(event)
  const asset = await usePrisma(event).asset.findUnique({ where: { id }, select: { publicId: true, assetNumber: true } })
  if (!asset) throw createError({ statusCode: 404, statusMessage: 'ไม่พบครุภัณฑ์' })
  const baseUrl = useRuntimeConfig(event).public.appBaseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/assets/${asset.publicId}`
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
  setResponseHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `inline; filename="asset-${asset.assetNumber.replace(/[^a-zA-Z0-9.-]/g, '_')}.svg"`)
  return svg
})
