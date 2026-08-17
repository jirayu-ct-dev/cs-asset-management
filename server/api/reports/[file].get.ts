import ExcelJS from 'exceljs'
import { chromium } from 'playwright-core'
import { buildReportData, reportTotals } from '../../services/reports'

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character)
const displayValue = (value: string | number | Date | null) => value instanceof Date ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' }).format(value) : escapeHtml(value)

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const file = requiredRouteParam(event, 'file')
  const match = /^(.+)\.(pdf|xlsx)$/.exec(file)
  if (!match?.[1] || !match[2]) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรูปแบบรายงาน' })
  const [, type, format] = match
  const report = await buildReportData(usePrisma(event), type, getQuery(event))
  const totals = reportTotals(report)

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = admin.name
    workbook.created = new Date()
    const sheet = workbook.addWorksheet(report.title.slice(0, 31))
    sheet.addRow([report.title])
    sheet.mergeCells(1, 1, 1, report.headers.length)
    sheet.getRow(1).font = { bold: true, size: 16 }
    sheet.addRow([`จัดทำโดย ${admin.name} • ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date())} • เงื่อนไข ${report.criteria}`])
    sheet.mergeCells(2, 1, 2, report.headers.length)
    sheet.addRow(report.headers)
    sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
    for (const row of report.rows) sheet.addRow(row)
    sheet.columns.forEach((column) => { column.width = 18 })
    sheet.views = [{ state: 'frozen', ySplit: 3 }]
    sheet.addRow([`รวม ${totals.count} รายการ`, `มูลค่ารวม ${totals.totalValue.toFixed(2)} บาท`])
    const buffer = await workbook.xlsx.writeBuffer()
    setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`)
    return new Uint8Array(buffer)
  }

  const generatedAt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date())
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>
    @page { size: A4 landscape; margin: 12mm; } body { font-family: "Noto Sans Thai", "Sarabun", sans-serif; color: #0f172a; font-size: 9pt; }
    h1 { font-size: 16pt; margin: 0 0 4px; } p { color: #475569; margin: 0 0 12px; } table { width: 100%; border-collapse: collapse; }
    th { background: #0f766e; color: white; } th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; } tr:nth-child(even) { background: #f8fafc; }
  </style></head><body><h1>${escapeHtml(report.title)}</h1><p>จัดทำโดย ${escapeHtml(admin.name)} • ${escapeHtml(generatedAt)} • เงื่อนไข ${escapeHtml(report.criteria)}</p>
  <table><thead><tr>${report.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row => `<tr>${row.map(cell => `<td>${displayValue(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table><p>รวม ${totals.count} รายการ • มูลค่ารวม ${totals.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p></body></html>`
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true })
    setResponseHeader(event, 'Content-Type', 'application/pdf')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.pdf"`)
    return pdf
  } finally {
    await browser.close()
  }
})
