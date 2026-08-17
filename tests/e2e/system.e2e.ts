import { expect, test, type APIRequestContext } from '@playwright/test'

interface ReferenceItem { id: string, code: string }
interface ReferencesResponse {
  categories: ReferenceItem[]
  units: ReferenceItem[]
  locations: ReferenceItem[]
}
interface EntityResponse { id: string }
interface EntityWithAttachments extends EntityResponse { attachments?: EntityResponse[] }
interface ListResponse { total: number, items: EntityWithAttachments[] }
interface ImportResponse {
  id: string
  status: string
  summary: { total: number, valid: number, imported: number }
}
interface ReportPreview { count: number, totalValue: number, rows: Array<Array<unknown>> }

const requiredReference = (items: ReferenceItem[], code: string): ReferenceItem => {
  const item = items.find(candidate => candidate.code === code)
  if (!item) throw new Error(`Missing seeded reference ${code}`)
  return item
}

const uploadOwnerAttachment = async (request: APIRequestContext, ownerType: string, ownerId: string, name: string) => {
  const bytes = Buffer.from(`%PDF-1.4\n% ${ownerType} ${ownerId}\n`)
  const response = await request.post('/api/attachments', {
    multipart: {
      ownerType,
      ownerId,
      file: { name, mimeType: 'application/pdf', buffer: bytes },
    },
  })
  expect(response.status()).toBe(200)
  const attachment = await response.json() as EntityResponse
  const download = await request.get(`/api/attachments/${attachment.id}`)
  expect(download.status()).toBe(200)
  expect(await download.body()).toEqual(bytes)
  return attachment
}

const expectListedAttachment = async (request: APIRequestContext, endpoint: string, ownerId: string, attachmentId: string) => {
  const response = await request.get(endpoint)
  expect(response.status()).toBe(200)
  const data = await response.json() as ListResponse
  const owner = data.items.find(item => item.id === ownerId)
  expect(owner?.attachments?.some(attachment => attachment.id === attachmentId)).toBe(true)
}

test('admin can complete core database-backed workflows', async ({ page, context }) => {
  test.setTimeout(120_000)
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@example.test'
  const password = process.env.E2E_ADMIN_PASSWORD || 'ci-admin-password-1234'
  const unique = Date.now().toString(36)

  const invalidLogin = await page.request.post('/api/auth/login', {
    data: { email, password: 'incorrect-password' },
  })
  expect(invalidLogin.status()).toBe(401)

  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('อีเมล').fill(email)
  await page.getByLabel('รหัสผ่าน').fill(password)
  const loginResponsePromise = page.waitForResponse(response => response.url().endsWith('/api/auth/login'))
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
  expect((await loginResponsePromise).status()).toBe(200)
  await expect.poll(async () => (await context.cookies()).some(cookie => cookie.name === 'nuxt-session')).toBe(true)
  await expect(page).toHaveURL('/')

  const referencesResponse = await page.request.get('/api/references')
  expect(referencesResponse.ok()).toBe(true)
  const references = await referencesResponse.json() as ReferencesResponse
  const category = requiredReference(references.categories, 'COMPUTER')
  const unit = requiredReference(references.units, 'ITEM')
  const location = requiredReference(references.locations, 'STORAGE')
  const destination = requiredReference(references.locations, 'UNASSIGNED')
  const assetNumber = `E2E-${unique}`

  const personResponse = await page.request.post('/api/people', {
    data: { code: `E2E-${unique}`, name: 'ผู้ยืมทดสอบ', type: 'STAFF' },
  })
  expect(personResponse.status()).toBe(200)
  const person = await personResponse.json() as EntityResponse

  const assetResponse = await page.request.post('/api/assets', {
    data: {
      assetNumber,
      name: 'ครุภัณฑ์ทดสอบ E2E',
      categoryId: category.id,
      unitId: unit.id,
      locationId: location.id,
      quantity: 1,
      receivedDate: '2026-08-17',
      price: 12500,
    },
  })
  expect(assetResponse.status()).toBe(200)
  const asset = await assetResponse.json() as EntityResponse

  const attachmentBytes = Buffer.from('%PDF-1.4\n% E2E attachment\n')
  const attachmentResponse = await page.request.post(`/api/assets/${asset.id}/attachments`, {
    multipart: {
      file: { name: 'evidence.pdf', mimeType: 'application/pdf', buffer: attachmentBytes },
    },
  })
  expect(attachmentResponse.status()).toBe(200)
  const attachment = await attachmentResponse.json() as EntityResponse
  const downloadedAttachment = await page.request.get(`/api/attachments/${attachment.id}`)
  expect(downloadedAttachment.status()).toBe(200)
  expect(await downloadedAttachment.body()).toEqual(attachmentBytes)
  await page.goto(`/assets/${asset.id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('link', { name: 'evidence.pdf' })).toBeVisible()

  const loanPayload = {
    assetId: asset.id,
    borrowerId: person.id,
    purpose: 'ทดสอบการยืมพร้อมกัน',
    borrowedAt: '2026-08-17T00:00:00.000Z',
    dueAt: '2026-08-18T00:00:00.000Z',
    conditionBefore: 'NORMAL',
  }
  const concurrentLoans = await Promise.all([
    page.request.post('/api/loans', { data: loanPayload }),
    page.request.post('/api/loans', { data: loanPayload }),
  ])
  expect(concurrentLoans.map(response => response.status()).sort()).toEqual([200, 409])
  const successfulLoan = concurrentLoans.find(response => response.status() === 200)
  if (!successfulLoan) throw new Error('Expected one successful concurrent loan')
  const loan = await successfulLoan.json() as EntityResponse

  const fillerAssets = await Promise.all(Array.from({ length: 21 }, async (_, index) => {
    const response = await page.request.post('/api/assets', {
      data: {
        assetNumber: `FILLER-${unique}-${String(index).padStart(2, '0')}`,
        name: `รายการทดสอบ pagination ${index}`,
        categoryId: category.id,
        unitId: unit.id,
        locationId: location.id,
        quantity: 1,
        receivedDate: '2026-08-17',
        price: 1,
      },
    })
    expect(response.status()).toBe(200)
    return response.json() as Promise<EntityResponse>
  }))
  const fillerLoans = await Promise.all(fillerAssets.map(assetItem => page.request.post('/api/loans', {
    data: {
      ...loanPayload,
      assetId: assetItem.id,
      purpose: 'สร้างข้อมูลให้ target อยู่นอกหน้าแรก',
      borrowedAt: '2026-08-18T00:00:00.000Z',
      dueAt: '2026-08-19T00:00:00.000Z',
    },
  })))
  expect(fillerLoans.every(response => response.status() === 200)).toBe(true)
  const firstLoanPage = await page.request.get('/api/loans?pageSize=20')
  const firstLoanPageData = await firstLoanPage.json() as ListResponse
  expect(firstLoanPageData.total).toBeGreaterThanOrEqual(22)
  expect(firstLoanPageData.items.some(item => item.id === loan.id)).toBe(false)

  const filteredLoanApi = await page.request.get(`/api/loans?assetId=${asset.id}`)
  expect(filteredLoanApi.status()).toBe(200)
  const filteredLoanList = await filteredLoanApi.json() as ListResponse
  expect(filteredLoanList.total).toBe(1)
  expect(filteredLoanList.items.map(item => item.id)).toEqual([loan.id])
  expect((await page.request.get('/api/loans?assetId=not-a-uuid')).status()).toBe(422)

  await page.goto(`/assets/${asset.id}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'รับคืน / ดูสถานะยืม' }).click()
  await expect(page).toHaveURL(`/loans?assetId=${asset.id}`)
  const filteredLoanRows = page.locator('tbody tr')
  await expect(filteredLoanRows).toHaveCount(1)
  await expect(filteredLoanRows.first()).toContainText(assetNumber)

  const returned = await page.request.post(`/api/loans/${loan.id}/return`, {
    data: { returnedAt: '2026-08-18T00:00:00.000Z', conditionAfter: 'NORMAL' },
  })
  expect(returned.status()).toBe(200)
  const loanAttachment = await uploadOwnerAttachment(page.request, 'loan', loan.id, `loan-${unique}.pdf`)
  await expectListedAttachment(page.request, '/api/loans?status=RETURNED', loan.id, loanAttachment.id)

  const importNumber = `IMPORT-${unique}`
  const csv = [
    'assetNumber,name,receivedDate,price,quantity,unitId,locationId,categoryId',
    `${importNumber},เครื่องนำเข้าทดสอบ,17/08/2569,2500,1,${unit.id},${location.id},${category.id}`,
  ].join('\n')
  const previewResponse = await page.request.post('/api/imports/preview', {
    multipart: {
      file: { name: 'e2e-assets.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) },
      mapping: JSON.stringify({}),
    },
  })
  expect(previewResponse.status()).toBe(200)
  const preview = await previewResponse.json() as ImportResponse
  expect(preview.summary).toMatchObject({ total: 1, valid: 1 })

  const concurrentConfirms = await Promise.all([
    page.request.post(`/api/imports/${preview.id}/confirm`),
    page.request.post(`/api/imports/${preview.id}/confirm`),
  ])
  expect(concurrentConfirms.map(response => response.status()).sort()).toEqual([200, 409])
  const successfulConfirm = concurrentConfirms.find(response => response.status() === 200)
  if (!successfulConfirm) throw new Error('Expected one successful concurrent import confirmation')
  const confirmed = await successfulConfirm.json() as ImportResponse
  expect(confirmed).toMatchObject({ status: 'IMPORTED' })
  expect(confirmed.summary.imported).toBe(1)

  const uiImportNumber = `UI-IMPORT-${unique}`
  const uiCsv = [
    'assetNumber,name,receivedDate,price,quantity,unit,location,category',
    `${uiImportNumber},เครื่องนำเข้าผ่านหน้าจอ,17/08/2569,3200,1,ITEM,STORAGE,COMPUTER`,
  ].join('\n')
  await page.goto('/imports')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('ไฟล์ข้อมูล').setInputFiles({
    name: 'ui-import.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(uiCsv),
  })
  await page.getByRole('button', { name: 'อัปโหลดและตรวจสอบ' }).click()
  await expect(page.getByRole('heading', { name: 'จับคู่คอลัมน์' })).toBeVisible()
  await page.getByRole('button', { name: 'ตรวจสอบข้อมูล' }).click()
  await expect(page.getByRole('heading', { name: 'ตรวจทานก่อนนำเข้า' })).toBeVisible()
  await expect(page.getByText('พร้อม 1')).toBeVisible()
  await page.getByRole('button', { name: 'ยืนยันนำเข้า 1 รายการ' }).click()
  await expect(page.getByText('นำเข้าข้อมูลเสร็จแล้ว')).toBeVisible()
  const uiImportedAsset = await page.request.get(`/api/assets?search=${encodeURIComponent(uiImportNumber)}`)
  expect(uiImportedAsset.status()).toBe(200)
  const uiImportedList = await uiImportedAsset.json() as ListResponse
  expect(uiImportedList).toMatchObject({ total: 1 })
  const uiAsset = uiImportedList.items[0]
  if (!uiAsset) throw new Error('UI-imported asset was not returned by search')

  const quickLoanResponse = await page.request.post('/api/loans', {
    data: { ...loanPayload, assetId: uiAsset.id, purpose: 'ทดสอบ quick action' },
  })
  expect(quickLoanResponse.status()).toBe(200)
  await page.goto(`/loans?assetId=${uiAsset.id}`)
  await page.waitForLoadState('networkidle')
  const quickLoanRow = page.locator('tbody tr').filter({ hasText: uiImportNumber })
  await expect(quickLoanRow.getByRole('button', { name: 'รับคืน' })).toBeVisible()
  await quickLoanRow.getByRole('button', { name: 'รับคืน' }).click()
  await expect(page.getByText('ดำเนินการสำเร็จ')).toBeVisible()
  await expect(quickLoanRow.getByRole('button', { name: 'รับคืน' })).toHaveCount(0)
  const uiLoanEvidence = `loan-ui-${unique}.pdf`
  await quickLoanRow.locator('input[type=file]').setInputFiles({
    name: uiLoanEvidence,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% loan UI evidence\n'),
  })
  await expect(page.getByText('แนบหลักฐานแล้ว')).toBeVisible()
  await expect(quickLoanRow.getByRole('link', { name: uiLoanEvidence })).toBeVisible()

  const inspectionResponse = await page.request.post('/api/inspections', {
    data: { fiscalYear: 2569, name: `รอบตรวจ E2E ${unique}`, locationId: location.id },
  })
  expect(inspectionResponse.status()).toBe(200)
  const inspection = await inspectionResponse.json() as EntityResponse
  const inspectionAttachment = await uploadOwnerAttachment(page.request, 'inspection', inspection.id, `inspection-${unique}.pdf`)
  const inspectionRoundSearch = await page.request.get(`/api/inspections?search=${encodeURIComponent(unique)}`)
  expect(inspectionRoundSearch.status()).toBe(200)
  expect(await inspectionRoundSearch.json()).toMatchObject({ total: 1 })
  const inspectionAssetSearch = await page.request.get(`/api/inspections/${inspection.id}/items?q=${encodeURIComponent(assetNumber)}`)
  expect(inspectionAssetSearch.status()).toBe(200)
  const inspectionMatches = await inspectionAssetSearch.json() as Array<{ assetId: string }>
  expect(inspectionMatches.map(item => item.assetId)).toEqual([asset.id])
  const missingInspectionSearch = await page.request.get(`/api/inspections/${inspection.id}/items?q=DOES-NOT-EXIST-${unique}`)
  expect(await missingInspectionSearch.json()).toEqual([])
  const abnormalItem = await page.request.put(`/api/inspections/${inspection.id}/items/${asset.id}`, {
    data: { result: 'MISSING', actualLocationId: location.id, observedCondition: 'NORMAL' },
  })
  expect(abnormalItem.status()).toBe(200)
  const unconfirmedClose = await page.request.post(`/api/inspections/${inspection.id}/close`, {
    data: { confirm: false },
  })
  expect(unconfirmedClose.status()).toBe(409)
  expect(await unconfirmedClose.json()).toMatchObject({
    data: { confirmationRequired: true, abnormal: 1 },
  })
  const confirmedClose = await page.request.post(`/api/inspections/${inspection.id}/close`, {
    data: { confirm: true },
  })
  expect(confirmedClose.status()).toBe(200)
  const inspectedAsset = await page.request.get(`/api/assets/${asset.id}`)
  expect(await inspectedAsset.json()).toMatchObject({ custodyStatus: 'AVAILABLE' })

  const renamedAsset = await page.request.patch(`/api/assets/${asset.id}`, {
    data: { name: 'ชื่อปัจจุบันหลังปิดรอบตรวจ' },
  })
  expect(renamedAsset.status()).toBe(200)
  const closedInspectionReport = await page.request.get(`/api/reports/preview?type=inspections&roundId=${inspection.id}`)
  expect(closedInspectionReport.status()).toBe(200)
  const closedReport = await closedInspectionReport.json() as ReportPreview
  const inspectedRow = closedReport.rows.find(row => row[1] === assetNumber)
  expect(inspectedRow?.[2]).toBe('ครุภัณฑ์ทดสอบ E2E')

  const inspectionDetail = await page.request.get(`/api/inspections/${inspection.id}`)
  expect((await inspectionDetail.json() as EntityWithAttachments).attachments?.some(item => item.id === inspectionAttachment.id)).toBe(true)

  const repairResponse = await page.request.post('/api/repairs', {
    data: { assetId: asset.id, reportedAt: '2026-08-19T00:00:00.000Z', symptom: 'ทดสอบงานซ่อม' },
  })
  expect(repairResponse.status()).toBe(200)
  const repair = await repairResponse.json() as EntityResponse
  const repairAttachment = await uploadOwnerAttachment(page.request, 'repair', repair.id, `repair-${unique}.pdf`)
  expect((await page.request.post(`/api/repairs/${repair.id}/send`, { data: { vendor: 'ร้านทดสอบ', sentAt: '2026-08-19T01:00:00.000Z' } })).status()).toBe(200)
  expect((await page.request.post(`/api/repairs/${repair.id}/close`, { data: { receivedAt: '2026-08-20T00:00:00.000Z', successful: true, result: 'ซ่อมสำเร็จ', cost: 500 } })).status()).toBe(200)
  await expectListedAttachment(page.request, '/api/repairs?status=COMPLETED', repair.id, repairAttachment.id)

  const transferResponse = await page.request.post('/api/transfers', {
    data: { assetId: asset.id, destinationLocationId: destination.id, transferredAt: '2026-08-21T00:00:00.000Z', reason: 'ทดสอบย้ายสถานที่' },
  })
  expect(transferResponse.status()).toBe(200)
  const transfer = await transferResponse.json() as EntityResponse
  const transferAttachment = await uploadOwnerAttachment(page.request, 'transfer', transfer.id, `transfer-${unique}.pdf`)
  await expectListedAttachment(page.request, '/api/transfers', transfer.id, transferAttachment.id)

  const disposalResponse = await page.request.post('/api/disposals', {
    data: { assetId: asset.id, proposedAt: '2026-08-22T00:00:00.000Z', reason: 'ทดสอบเสนอจำหน่าย' },
  })
  expect(disposalResponse.status()).toBe(200)
  const disposal = await disposalResponse.json() as EntityResponse
  const disposalAttachment = await uploadOwnerAttachment(page.request, 'disposal', disposal.id, `disposal-${unique}.pdf`)
  await expectListedAttachment(page.request, '/api/disposals?status=PROPOSED', disposal.id, disposalAttachment.id)

  const filteredReports = await Promise.all([
    page.request.get(`/api/reports/preview?type=assets&assetId=${asset.id}`),
    page.request.get(`/api/reports/preview?type=loans&assetId=${asset.id}&status=RETURNED`),
    page.request.get(`/api/reports/preview?type=repairs&assetId=${asset.id}&status=COMPLETED`),
    page.request.get(`/api/reports/preview?type=transfers&assetId=${asset.id}`),
    page.request.get(`/api/reports/preview?type=inspections&roundId=${inspection.id}&status=MISSING`),
    page.request.get(`/api/reports/preview?type=disposals&assetId=${asset.id}&status=PROPOSED`),
  ])
  for (const response of filteredReports) {
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ count: 1 })
  }
  const assetReportFilter = await page.request.get(`/api/reports/preview?type=assets&assetId=${uiAsset.id}`)
  expect(assetReportFilter.status()).toBe(200)
  const filteredAssetReport = await assetReportFilter.json() as ReportPreview
  expect(filteredAssetReport.count).toBe(1)
  expect(filteredAssetReport.rows[0]?.[0]).toBe(uiImportNumber)
  const historyResponse = await page.request.get(`/api/reports/preview?type=asset-history&assetId=${asset.id}`)
  expect(historyResponse.status()).toBe(200)
  const history = await historyResponse.json() as ReportPreview
  expect(history.count).toBeGreaterThanOrEqual(8)
  expect(history.rows.some(row => row[1] === 'LOANED')).toBe(true)
  expect(history.rows.some(row => row[1] === 'TRANSFERRED')).toBe(true)

  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'ห้อง/สถานที่' }).click()
  await expect(page.getByText('ห้องเก็บครุภัณฑ์')).toBeVisible()

  const reportResponse = await page.request.get('/api/reports/preview?type=assets')
  expect(reportResponse.status()).toBe(200)
  const report = await reportResponse.json() as ReportPreview
  expect(report.count).toBeGreaterThanOrEqual(3)
  expect(report.totalValue).toBeGreaterThanOrEqual(18200)

  const exportResponse = await page.request.get('/api/reports/assets.xlsx')
  expect(exportResponse.status()).toBe(200)
  expect(exportResponse.headers()['content-type']).toContain('spreadsheetml.sheet')
  const workbook = await exportResponse.body()
  expect(workbook.subarray(0, 2).toString()).toBe('PK')

  const pdfResponse = await page.request.get('/api/reports/assets.pdf')
  expect(pdfResponse.status()).toBe(200)
  expect(pdfResponse.headers()['content-type']).toContain('application/pdf')
  const pdf = await pdfResponse.body()
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
})
