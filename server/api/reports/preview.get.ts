import { buildReportData } from '../../services/reports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = String(query.type || 'assets')
  const report = await buildReportData(usePrisma(event), type, query)
  return { title: report.title, count: report.rows.length, totalValue: report.totalValue, criteria: report.criteria, headers: report.headers, rows: report.rows.slice(0, 20) }
})
