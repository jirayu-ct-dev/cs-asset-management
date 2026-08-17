import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

interface Entity { id: string }
interface ReferenceItem { id: string, code: string }
interface ReferencesResponse {
  categories: ReferenceItem[]
  units: ReferenceItem[]
  locations: ReferenceItem[]
}

const loginAsAdmin = async (page: Page) => {
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || 'admin@example.test',
      password: process.env.E2E_ADMIN_PASSWORD || 'ci-admin-password-1234',
    },
  })
  expect(response.status()).toBe(200)
  await page.goto('/')
  await expect(page).toHaveURL('/')
}

const requiredReference = (items: ReferenceItem[], code: string): ReferenceItem => {
  const item = items.find(candidate => candidate.code === code)
  if (!item) throw new Error(`Missing seeded reference ${code}`)
  return item
}

const createAsset = async (
  request: APIRequestContext,
  references: ReferencesResponse,
  assetNumber: string,
): Promise<Entity> => {
  const response = await request.post('/api/assets', {
    data: {
      assetNumber,
      name: `Regression ${assetNumber}`,
      categoryId: requiredReference(references.categories, 'COMPUTER').id,
      unitId: requiredReference(references.units, 'ITEM').id,
      locationId: requiredReference(references.locations, 'STORAGE').id,
      quantity: 1,
      receivedDate: '2026-08-17',
      price: 100,
    },
  })
  expect(response.status()).toBe(200)
  return response.json() as Promise<Entity>
}

test('regression: person edit action opens the form and saves changes', async ({ page }) => {
  const unique = Date.now().toString(36)
  await loginAsAdmin(page)

  const createResponse = await page.request.post('/api/people', {
    data: { code: `EDIT-${unique}`, name: `ผู้แก้ไข ${unique}`, type: 'STAFF' },
  })
  expect(createResponse.status()).toBe(200)
  const person = await createResponse.json() as Entity

  await page.goto('/people')
  await page.getByPlaceholder('ค้นหาบุคคล…').fill(`EDIT-${unique}`)
  await page.getByRole('button', { name: 'ค้นหา' }).click()
  const row = page.locator('tbody tr').filter({ hasText: `EDIT-${unique}` })
  await expect(row).toHaveCount(1)
  await row.getByRole('link', { name: 'แก้ไขบุคคล' }).click()
  await expect(page).toHaveURL(`/edit/people/${person.id}`)
  await expect(page.getByRole('heading', { name: 'แก้ไขข้อมูลบุคคล' })).toBeVisible()
  await page.waitForLoadState('networkidle')

  const editedName = `ผู้แก้ไขแล้ว ${unique}`
  await page.getByLabel('ชื่อ–นามสกุล').fill(editedName)
  await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click()
  await expect(page).toHaveURL('/people')
  await expect(page.getByText('แก้ไขข้อมูลบุคคลแล้ว', { exact: true })).toBeVisible()
  const saved = await page.request.get(`/api/people/${person.id}`)
  expect(saved.status()).toBe(200)
  expect(await saved.json()).toMatchObject({ name: editedName })
})

test('regression: workflow reversals preserve snapshots and reject stale writes', async ({ page }) => {
  test.setTimeout(120_000)
  const unique = Date.now().toString(36)
  await loginAsAdmin(page)

  const referencesResponse = await page.request.get('/api/references')
  expect(referencesResponse.status()).toBe(200)
  const references = await referencesResponse.json() as ReferencesResponse
  const storage = requiredReference(references.locations, 'STORAGE')
  const unassigned = requiredReference(references.locations, 'UNASSIGNED')

  const repairAsset = await createAsset(page.request, references, `REG-R-${unique}`)
  const repairResponse = await page.request.post('/api/repairs', {
    data: { assetId: repairAsset.id, reportedAt: '2026-08-17T00:00:00.000Z', symptom: 'ทดสอบคืน snapshot' },
  })
  expect(repairResponse.status()).toBe(200)
  const repair = await repairResponse.json() as Entity
  expect((await page.request.post(`/api/repairs/${repair.id}/send`, {
    data: { vendor: 'ร้านทดสอบ', sentAt: '2026-08-18T00:00:00.000Z' },
  })).status()).toBe(200)
  expect((await page.request.post(`/api/repairs/${repair.id}/cancel`, {
    data: { reason: 'ยกเลิกเพื่อทดสอบ snapshot' },
  })).status()).toBe(200)
  const restoredAsset = await page.request.get(`/api/assets/${repairAsset.id}`)
  expect(await restoredAsset.json()).toMatchObject({ custodyStatus: 'AVAILABLE', conditionStatus: 'NORMAL' })
  expect((await page.request.post(`/api/repairs/${repair.id}/cancel`, {
    data: { reason: 'ห้ามยกเลิกซ้ำ' },
  })).status()).toBe(409)

  const transferAsset = await createAsset(page.request, references, `REG-T-${unique}`)
  const firstTransferResponse = await page.request.post('/api/transfers', {
    data: {
      assetId: transferAsset.id,
      destinationLocationId: unassigned.id,
      transferredAt: '2026-08-19T00:00:00.000Z',
      reason: 'ย้ายครั้งแรก',
    },
  })
  expect(firstTransferResponse.status()).toBe(200)
  const firstTransfer = await firstTransferResponse.json() as Entity
  const latestTransferResponse = await page.request.post('/api/transfers', {
    data: {
      assetId: transferAsset.id,
      destinationLocationId: storage.id,
      transferredAt: '2026-08-20T00:00:00.000Z',
      reason: 'ย้ายครั้งล่าสุด',
    },
  })
  expect(latestTransferResponse.status()).toBe(200)
  const latestTransfer = await latestTransferResponse.json() as Entity
  expect((await page.request.post(`/api/transfers/${firstTransfer.id}/reverse`, {
    data: { reason: 'รายการเก่าต้องย้อนกลับไม่ได้' },
  })).status()).toBe(409)
  const reverseTransfer = await page.request.post(`/api/transfers/${latestTransfer.id}/reverse`, {
    data: { reason: 'สร้างรายการชดเชย' },
  })
  expect(reverseTransfer.status()).toBe(200)
  expect(await reverseTransfer.json()).toMatchObject({
    assetId: transferAsset.id,
    fromLocationId: storage.id,
    toLocationId: unassigned.id,
  })
  expect((await page.request.get(`/api/assets/${transferAsset.id}`).then(response => response.json()))).toMatchObject({
    locationId: unassigned.id,
  })
  expect((await page.request.post(`/api/transfers/${latestTransfer.id}/reverse`, {
    data: { reason: 'ห้ามย้อนกลับซ้ำ' },
  })).status()).toBe(409)

  const borrowerResponse = await page.request.post('/api/people', {
    data: { code: `BORROW-${unique}`, name: `ผู้ยืม ${unique}`, type: 'STAFF' },
  })
  expect(borrowerResponse.status()).toBe(200)
  const borrower = await borrowerResponse.json() as Entity
  const borrowedTransferAsset = await createAsset(page.request, references, `REG-TB-${unique}`)
  const borrowedTransferResponse = await page.request.post('/api/transfers', {
    data: {
      assetId: borrowedTransferAsset.id,
      destinationLocationId: unassigned.id,
      transferredAt: '2026-08-20T01:00:00.000Z',
      reason: 'ย้ายก่อนนำไปยืม',
    },
  })
  expect(borrowedTransferResponse.status()).toBe(200)
  const borrowedTransfer = await borrowedTransferResponse.json() as Entity
  expect((await page.request.post('/api/loans', {
    data: {
      assetId: borrowedTransferAsset.id,
      borrowerId: borrower.id,
      purpose: 'ทดสอบห้ามย้อนการย้ายระหว่างถูกยืม',
      borrowedAt: '2026-08-21T00:00:00.000Z',
      dueAt: '2026-08-22T00:00:00.000Z',
      conditionBefore: 'NORMAL',
    },
  })).status()).toBe(200)
  expect((await page.request.post(`/api/transfers/${borrowedTransfer.id}/reverse`, {
    data: { reason: 'ต้องถูกปฏิเสธเพราะกำลังถูกยืม' },
  })).status()).toBe(409)

  const disposedTransferAsset = await createAsset(page.request, references, `REG-TD-${unique}`)
  const disposedTransferResponse = await page.request.post('/api/transfers', {
    data: {
      assetId: disposedTransferAsset.id,
      destinationLocationId: unassigned.id,
      transferredAt: '2026-08-22T01:00:00.000Z',
      reason: 'ย้ายก่อนเสนอจำหน่าย',
    },
  })
  expect(disposedTransferResponse.status()).toBe(200)
  const disposedTransfer = await disposedTransferResponse.json() as Entity
  const disposedProposalResponse = await page.request.post('/api/disposals', {
    data: { assetId: disposedTransferAsset.id, proposedAt: '2026-08-23T00:00:00.000Z', reason: 'ทดสอบ guard หลังจำหน่าย' },
  })
  expect(disposedProposalResponse.status()).toBe(200)
  const disposedProposal = await disposedProposalResponse.json() as Entity
  expect((await page.request.post(`/api/disposals/${disposedProposal.id}/complete`, {
    data: { disposedAt: '2026-08-24T00:00:00.000Z', method: 'ขายทอดตลาด', documentNumber: `DOC-TD-${unique}` },
  })).status()).toBe(200)
  expect((await page.request.post(`/api/transfers/${disposedTransfer.id}/reverse`, {
    data: { reason: 'ต้องถูกปฏิเสธเพราะจำหน่ายแล้ว' },
  })).status()).toBe(409)

  const inspectionAsset = await createAsset(page.request, references, `REG-I-${unique}`)
  const inspectionResponse = await page.request.post('/api/inspections', {
    data: { fiscalYear: 2569, name: `Reset regression ${unique}`, locationId: storage.id },
  })
  expect(inspectionResponse.status()).toBe(200)
  const inspection = await inspectionResponse.json() as Entity
  const recordedInspection = await page.request.put(`/api/inspections/${inspection.id}/items/${inspectionAsset.id}`, {
    data: { result: 'FOUND_DAMAGED', actualLocationId: storage.id, observedCondition: 'DAMAGED_USABLE', notes: 'ต้องล้าง' },
  })
  expect(recordedInspection.status()).toBe(200)
  expect((await page.request.post(`/api/inspections/${inspection.id}/items/${inspectionAsset.id}/reset`, {
    data: { reason: '   ' },
  })).status()).toBe(422)
  const resetResponse = await page.request.post(`/api/inspections/${inspection.id}/items/${inspectionAsset.id}/reset`, {
    data: { reason: 'บันทึกผิดรายการ' },
  })
  expect(resetResponse.status()).toBe(200)
  expect(await resetResponse.json()).toMatchObject({
    snapshotAssetNumber: `REG-I-${unique}`,
    snapshotCondition: 'NORMAL',
    result: null,
    actualLocationId: null,
    actualCondition: null,
    notes: null,
    inspectedAt: null,
    inspectedById: null,
  })
  expect((await page.request.put(`/api/inspections/${inspection.id}/items/${inspectionAsset.id}`, {
    data: { result: 'FOUND_OK', actualLocationId: storage.id, observedCondition: 'NORMAL', notes: 'พร้อมปิดรอบ' },
  })).status()).toBe(200)
  expect((await page.request.post(`/api/inspections/${inspection.id}/close`, {
    data: { confirm: true },
  })).status()).toBe(200)
  expect((await page.request.post(`/api/inspections/${inspection.id}/items/${inspectionAsset.id}/reset`, {
    data: { reason: 'รอบปิดแล้ว' },
  })).status()).toBe(409)

  const disposalAsset = await createAsset(page.request, references, `REG-D-${unique}`)
  const proposals = await Promise.all([
    page.request.post('/api/disposals', {
      data: { assetId: disposalAsset.id, proposedAt: '2026-08-21T00:00:00.000Z', reason: 'ข้อเสนอ A' },
    }),
    page.request.post('/api/disposals', {
      data: { assetId: disposalAsset.id, proposedAt: '2026-08-21T00:00:00.000Z', reason: 'ข้อเสนอ B' },
    }),
  ])
  expect(proposals.map(response => response.status()).sort()).toEqual([200, 409])
  const proposal = proposals.find(response => response.status() === 200)
  if (!proposal) throw new Error('Expected one disposal proposal to win the row lock')
  const disposal = await proposal.json() as Entity
  const completions = await Promise.all([
    page.request.post(`/api/disposals/${disposal.id}/complete`, {
      data: { disposedAt: '2026-08-22T00:00:00.000Z', method: 'ขายทอดตลาด', documentNumber: `DOC-A-${unique}` },
    }),
    page.request.post(`/api/disposals/${disposal.id}/complete`, {
      data: { disposedAt: '2026-08-22T00:00:00.000Z', method: 'ขายทอดตลาด', documentNumber: `DOC-B-${unique}` },
    }),
  ])
  expect(completions.map(response => response.status()).sort()).toEqual([200, 409])
  expect((await page.request.get(`/api/assets/${disposalAsset.id}`).then(response => response.json()))).toMatchObject({
    lifecycleStatus: 'DISPOSED',
  })
  const reversals = await Promise.all([
    page.request.post(`/api/disposals/${disposal.id}/reverse`, { data: { reason: 'คืนสถานะ A' } }),
    page.request.post(`/api/disposals/${disposal.id}/reverse`, { data: { reason: 'คืนสถานะ B' } }),
  ])
  expect(reversals.map(response => response.status()).sort()).toEqual([200, 409])
  expect((await page.request.post(`/api/disposals/${disposal.id}/reverse`, {
    data: { reason: 'ห้ามย้อนกลับซ้ำ' },
  })).status()).toBe(409)
  expect((await page.request.get(`/api/assets/${disposalAsset.id}`).then(response => response.json()))).toMatchObject({
    lifecycleStatus: 'ACTIVE',
  })
})
