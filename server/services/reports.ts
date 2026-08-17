import type { PrismaClient } from '@prisma/client'
import { parseReportQuery, reportTypes, type ReportQuery, type ReportType } from '../../shared/schemas/report'

export interface ReportData {
  title: string
  headers: string[]
  rows: Array<Array<string | number | Date | null>>
  criteria: string
  totalValue: number
}

const decimalValue = (input: { toString(): string } | null | undefined) => input == null ? 0 : Number(input.toString())

export const bangkokDateRange = (query: ReportQuery) => {
  const from = query.from ? new Date(`${query.from}T00:00:00+07:00`) : undefined
  const to = query.to ? new Date(new Date(`${query.to}T00:00:00+07:00`).getTime() + 86_400_000) : undefined
  return from || to ? { ...(from && { gte: from }), ...(to && { lt: to }) } : undefined
}

const criteriaText = (query: ReportQuery) => {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== '')
  return entries.length ? entries.map(([key, value]) => `${key}=${String(value)}`).join(', ') : 'ทั้งหมด'
}

export const buildReportData = async (prisma: PrismaClient, type: string, query: Record<string, unknown>): Promise<ReportData> => {
  if (!reportTypes.includes(type as ReportType)) throw createError({ statusCode: 404, statusMessage: 'ไม่พบประเภทรายงาน' })
  let parsed: ReportQuery
  try {
    parsed = parseReportQuery(type as ReportType, query)
  } catch (error) {
    throw createError({ statusCode: 422, statusMessage: error instanceof Error ? error.message : 'เงื่อนไขรายงานไม่ถูกต้อง' })
  }
  const range = bangkokDateRange(parsed)
  const criteria = criteriaText(parsed)
  const assetId = parsed.assetId
  const status = parsed.status

  switch (type) {
    case 'assets': {
      const locationId = parsed.locationId
      const categoryId = parsed.categoryId
      const items = await prisma.asset.findMany({
        where: {
          ...(assetId ? { id: assetId } : {}),
          ...(locationId ? { locationId } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(range ? { acquisitionDate: range } : {}),
          ...(status ? { lifecycleStatus: status as 'ACTIVE' | 'PROPOSED_FOR_DISPOSAL' | 'DISPOSED' } : {}),
        },
        include: { category: true, unit: true, location: true, responsiblePerson: true },
        orderBy: { assetNumber: 'asc' },
      })
      return {
        title: 'ทะเบียนครุภัณฑ์', criteria,
        headers: ['หมายเลข', 'ชื่อ', 'หมวด', 'ห้อง', 'ผู้รับผิดชอบ', 'วันที่รับ', 'จำนวน', 'ราคา', 'วงจรชีวิต', 'การครอบครอง', 'สภาพ'],
        rows: items.map(item => [item.assetNumber, item.name, item.category.name, item.location?.name || '', item.responsiblePerson?.name || '', item.acquisitionDate, item.quantity, decimalValue(item.price), item.lifecycleStatus, item.custodyStatus, item.conditionStatus]),
        totalValue: items.reduce((total, item) => total + item.quantity * decimalValue(item.price), 0),
      }
    }
    case 'loans': {
      const loanStatus = status === 'OVERDUE' ? undefined : status
      const items = await prisma.loan.findMany({ where: { ...(range && { loanedAt: range }), ...(assetId && { assetId }), ...(loanStatus && { status: loanStatus as 'ACTIVE' | 'RETURNED' | 'CANCELLED' }), ...(status === 'OVERDUE' && { status: 'ACTIVE', dueAt: { lt: new Date() } }) }, include: { asset: true, borrower: true }, orderBy: { loanedAt: 'desc' } })
      return { title: 'รายงานยืม–คืน', criteria, totalValue: 0, headers: ['หมายเลข', 'ครุภัณฑ์', 'ผู้ยืม', 'วันยืม', 'กำหนดคืน', 'คืนจริง', 'สถานะ'], rows: items.map(item => [item.asset.assetNumber, item.asset.name, item.borrower.name, item.loanedAt, item.dueAt, item.returnedAt, item.status]) }
    }
    case 'repairs': {
      const items = await prisma.repairJob.findMany({ where: { ...(range && { reportedAt: range }), ...(assetId && { assetId }), ...(status && { status: status as 'REPORTED' | 'SENT' | 'COMPLETED' | 'CANCELLED' }) }, include: { asset: true }, orderBy: { reportedAt: 'desc' } })
      return { title: 'รายงานชำรุดและซ่อม', criteria, totalValue: items.reduce((total, item) => total + decimalValue(item.cost), 0), headers: ['หมายเลข', 'ครุภัณฑ์', 'อาการ', 'ร้าน', 'วันแจ้ง', 'วันปิด', 'ผล', 'ค่าซ่อม'], rows: items.map(item => [item.asset.assetNumber, item.asset.name, item.issue, item.vendor || '', item.reportedAt, item.completedAt, item.outcome || item.status, decimalValue(item.cost)]) }
    }
    case 'transfers': {
      const items = await prisma.transfer.findMany({ where: { ...(range && { transferredAt: range }), ...(assetId && { assetId }) }, include: { asset: true, fromLocation: true, toLocation: true, fromResponsible: true, toResponsible: true }, orderBy: { transferredAt: 'desc' } })
      return { title: 'ประวัติการย้าย', criteria, totalValue: 0, headers: ['หมายเลข', 'ครุภัณฑ์', 'จากห้อง', 'ไปห้อง', 'ผู้รับผิดชอบใหม่', 'วันที่', 'เหตุผล'], rows: items.map(item => [item.asset.assetNumber, item.asset.name, item.fromLocation?.name || '', item.toLocation?.name || '', item.toResponsible?.name || '', item.transferredAt, item.reason]) }
    }
    case 'inspections': {
      const roundId = parsed.roundId
      const items = await prisma.inspectionItem.findMany({ where: { ...(roundId && { roundId }), ...(assetId && { assetId }), ...(range && { round: { openedAt: range } }), ...(status && { result: status as 'FOUND_OK' | 'FOUND_DAMAGED' | 'REPAIR_REQUESTED' | 'MISSING' | 'DISPOSAL_REQUESTED' | 'OTHER' }) }, include: { round: true, actualLocation: true }, orderBy: [{ round: { openedAt: 'desc' } }, { snapshotAssetNumber: 'asc' }] })
      return { title: 'ผลการตรวจนับ', criteria, totalValue: 0, headers: ['รอบ', 'หมายเลข', 'ชื่อตอนเปิดรอบ', 'ผลตรวจ', 'สถานที่จริง', 'วันตรวจ'], rows: items.map(item => [item.round.name, item.snapshotAssetNumber, item.snapshotName, item.result || 'ยังไม่ตรวจ', item.actualLocation?.name || '', item.inspectedAt]) }
    }
    case 'disposals': {
      const items = await prisma.disposal.findMany({ where: { ...(range && { proposedAt: range }), ...(assetId && { assetId }), ...(status && { status: status as 'PROPOSED' | 'COMPLETED' | 'CANCELLED' }) }, include: { asset: true }, orderBy: { proposedAt: 'desc' } })
      return { title: 'รายงานการจำหน่าย', criteria, totalValue: 0, headers: ['หมายเลข', 'ครุภัณฑ์', 'วันเสนอ', 'เหตุผล', 'สถานะ', 'วันจำหน่าย', 'วิธี', 'เลขที่เอกสาร'], rows: items.map(item => [item.asset.assetNumber, item.asset.name, item.proposedAt, item.reason, item.status, item.completedAt, item.method || '', item.documentNumber || '']) }
    }
    case 'asset-history': {
      if (!assetId) throw createError({ statusCode: 422, statusMessage: 'กรุณาระบุ assetId' })
      const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId }, include: { events: { where: range ? { occurredAt: range } : {}, orderBy: { occurredAt: 'asc' } } } })
      return { title: `ประวัติครุภัณฑ์ ${asset.assetNumber}`, criteria, totalValue: 0, headers: ['วันเวลา', 'ประเภท', 'รายละเอียด'], rows: asset.events.map(item => [item.occurredAt, item.type, item.summary]) }
    }
    default: throw createError({ statusCode: 404, statusMessage: 'ไม่พบประเภทรายงาน' })
  }
}

export const reportTotals = (report: ReportData) => ({ count: report.rows.length, totalValue: report.totalValue })
