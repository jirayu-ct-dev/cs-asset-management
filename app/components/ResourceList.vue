<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Column { key: string, label: string, type?: 'date' | 'status' | 'money' | 'active', sortable?: boolean }
interface FilterOption { label: string, value: string }
interface FilterDefinition { key: string, label: string, options: FilterOption[] }
interface ReferenceItem { id: string, name: string }
interface ReferenceResponse { categories: ReferenceItem[], locations: ReferenceItem[] }
const props = defineProps<{
  endpoint: string
  title: string
  description: string
  columns: Column[]
  createLabel?: string
  createTo?: string
  emptyTitle?: string
}>()
const filterKeys: Record<string, string[]> = {
  '/api/assets': ['categoryId', 'locationId', 'custodyStatus', 'conditionStatus'],
  '/api/people': ['type', 'isActive'],
  '/api/loans': ['status'],
  '/api/repairs': ['status'],
  '/api/transfers': ['locationId'],
  '/api/inspections': ['status', 'locationId'],
  '/api/disposals': ['status'],
  '/api/audit': ['entityType'],
}
const initialFilters = Object.fromEntries((filterKeys[props.endpoint] || []).map(key => [key, '']))
const { formatThaiDate } = useThaiDate()
const { query, filters, page, pageSize, sortBy, sortDirection, items, total, totalPages, firstItem, lastItem, status, error, reload, goToPage, toggleSort } = useResourceList<Record<string, any>>(props.endpoint, initialFilters)
const sortIcon = (key: string) => sortBy.value !== key || !sortDirection.value ? 'i-lucide-arrow-up-down' : sortDirection.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
const sortLabel = (column: Column) => sortBy.value !== column.key || !sortDirection.value ? `${column.label}: ลำดับเริ่มต้น` : `${column.label}: เรียง${sortDirection.value === 'asc' ? 'จากน้อยไปมาก' : 'จากมากไปน้อย'}`
const getValue = (row: Record<string, any>, path: string): any => path.split('.').reduce<any>((value, part) => value?.[part], row)
const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 })
const toast = useToast()
const needsReferences = ['/api/assets', '/api/transfers', '/api/inspections'].includes(props.endpoint)
const { data: references } = useFetch<ReferenceResponse>('/api/references', { immediate: needsReferences })
const options = (items: ReferenceItem[] | undefined): FilterOption[] => (items || []).map(item => ({ label: item.name, value: item.id }))
const statusOptions: Record<string, FilterOption[]> = {
  loans: [{ label: 'กำลังยืม', value: 'ACTIVE' }, { label: 'คืนแล้ว', value: 'RETURNED' }, { label: 'ยกเลิก', value: 'CANCELLED' }],
  repairs: [{ label: 'แจ้งแล้ว', value: 'REPORTED' }, { label: 'ส่งซ่อม', value: 'SENT' }, { label: 'เสร็จสิ้น', value: 'COMPLETED' }, { label: 'ยกเลิก', value: 'CANCELLED' }],
  inspections: [{ label: 'เปิดอยู่', value: 'OPEN' }, { label: 'ปิดแล้ว', value: 'CLOSED' }],
  disposals: [{ label: 'เสนอจำหน่าย', value: 'PROPOSED' }, { label: 'จำหน่ายแล้ว', value: 'COMPLETED' }, { label: 'ยกเลิก', value: 'CANCELLED' }],
}
const filterDefinitions = computed<FilterDefinition[]>(() => {
  if (props.endpoint === '/api/assets') return [
    { key: 'categoryId', label: 'ทุกหมวด', options: options(references.value?.categories) },
    { key: 'locationId', label: 'ทุกสถานที่', options: options(references.value?.locations) },
    { key: 'custodyStatus', label: 'ทุกสถานะ', options: [{ label: 'พร้อมใช้งาน', value: 'AVAILABLE' }, { label: 'ถูกยืม', value: 'BORROWED' }, { label: 'ส่งซ่อม', value: 'IN_REPAIR' }, { label: 'สูญหาย', value: 'MISSING' }] },
    { key: 'conditionStatus', label: 'ทุกสภาพ', options: [{ label: 'ปกติ', value: 'NORMAL' }, { label: 'ชำรุดแต่ใช้ได้', value: 'DAMAGED_USABLE' }, { label: 'ใช้การไม่ได้', value: 'UNUSABLE' }] },
  ]
  if (props.endpoint === '/api/people') return [
    { key: 'type', label: 'ทุกประเภท', options: [{ label: 'นักศึกษา', value: 'STUDENT' }, { label: 'บุคลากร', value: 'STAFF' }, { label: 'บุคคลภายนอก', value: 'EXTERNAL' }] },
    { key: 'isActive', label: 'ทุกสถานะ', options: [{ label: 'เปิดการใช้งาน', value: 'true' }, { label: 'ปิดการใช้งาน', value: 'false' }] },
  ]
  if (props.endpoint === '/api/loans') return [{ key: 'status', label: 'ทุกสถานะ', options: statusOptions.loans! }]
  if (props.endpoint === '/api/repairs') return [{ key: 'status', label: 'ทุกสถานะ', options: statusOptions.repairs! }]
  if (props.endpoint === '/api/transfers') return [{ key: 'locationId', label: 'ทุกสถานที่', options: options(references.value?.locations) }]
  if (props.endpoint === '/api/inspections') return [{ key: 'status', label: 'ทุกสถานะ', options: statusOptions.inspections! }, { key: 'locationId', label: 'ทุกสถานที่', options: options(references.value?.locations) }]
  if (props.endpoint === '/api/disposals') return [{ key: 'status', label: 'ทุกสถานะ', options: statusOptions.disposals! }]
  if (props.endpoint === '/api/audit') return [{ key: 'entityType', label: 'ข้อมูลทุกประเภท', options: ['Asset', 'Person', 'Loan', 'RepairJob', 'Transfer', 'InspectionRound', 'InspectionItem', 'Disposal', 'User', 'ImportBatch'].map(value => ({ label: value, value })) }]
  return []
})
const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, totalPages.value - 4))
  const end = Math.min(totalPages.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})
const changePage = (target: number) => {
  if (goToPage(target)) return
  toast.add({ title: 'เปลี่ยนหน้าไม่ได้', description: target < 1 ? 'อยู่หน้าแรกแล้ว' : target > totalPages.value ? 'อยู่หน้าสุดท้ายแล้ว' : 'กำลังแสดงหน้านี้อยู่', color: 'warning' })
}
const refreshTable = async () => {
  await reload()
  toast.add({ title: 'รีเฟรชข้อมูลแล้ว', color: 'success' })
}
const explainUnavailableCreate = () => toast.add({
  title: `ยังเพิ่ม${props.title}จากหน้านี้ไม่ได้`,
  description: 'แบบฟอร์มสำหรับรายการนี้ยังไม่พร้อมใช้งาน กรุณาใช้ workflow ที่เกี่ยวข้อง',
  color: 'warning',
})
const hasActions = computed(() => ['/api/assets', '/api/people', '/api/loans', '/api/repairs', '/api/transfers', '/api/disposals', '/api/inspections'].includes(props.endpoint))
const ownerTypes: Record<string, string> = { '/api/loans': 'loan', '/api/repairs': 'repair', '/api/transfers': 'transfer', '/api/inspections': 'inspection', '/api/disposals': 'disposal' }
const uploadAttachment = async (event: Event, row: Record<string, any>) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  const ownerType = ownerTypes[props.endpoint]
  if (!file || !ownerType || !row.id) { toast.add({ title: 'ยังแนบไฟล์ไม่ได้', description: 'กรุณาเลือกไฟล์และตรวจสอบรายการ', color: 'warning' }); return }
  const body = new FormData(); body.append('file', file); body.append('ownerType', ownerType); body.append('ownerId', row.id)
  try { await $fetch('/api/attachments', { method: 'POST', body }); await reload(); toast.add({ title: 'แนบหลักฐานแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'แนบไฟล์ไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const explainAssetDelete = () => toast.add({
  title: 'ลบครุภัณฑ์ไม่ได้',
  description: 'ครุภัณฑ์มีประวัติและ Audit log กรุณาใช้เมนูเสนอจำหน่ายแทนการลบ',
  color: 'warning',
})
const togglePerson = async (row: Record<string, any>) => {
  const nextActive = row.isActive === false
  if (!nextActive && !window.confirm(`ปิดใช้งาน ${row.name || 'บุคคลนี้'} ใช่หรือไม่`)) {
    toast.add({ title: 'ยังไม่ได้ปิดใช้งาน', description: 'ยกเลิกการยืนยันแล้ว', color: 'warning' })
    return
  }
  try {
    await $fetch(`/api/people/${row.id}`, { method: 'PATCH', body: { isActive: nextActive } })
    toast.add({ title: nextActive ? 'เปิดใช้งานบุคคลแล้ว' : 'ปิดใช้งานบุคคลแล้ว', color: 'success' })
    await reload()
  } catch (error: any) {
    toast.add({ title: 'อัปเดตสถานะไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' })
  }
}
const correctionConfig: Record<string, { action: 'cancel' | 'reverse', createPath: string, allowed: (row: Record<string, any>) => boolean, unavailable: string }> = {
  '/api/loans': { action: 'cancel', createPath: '/workflows/loans/create', allowed: row => row.status === 'ACTIVE', unavailable: 'แก้ไขได้เฉพาะรายการที่กำลังยืม รายการที่คืนหรือยกเลิกแล้วเป็นประวัติถาวร' },
  '/api/repairs': { action: 'cancel', createPath: '/workflows/repairs/create', allowed: row => ['REPORTED', 'SENT'].includes(row.status), unavailable: 'แก้ไขได้เฉพาะงานซ่อมที่ยังไม่เสร็จ งานที่ปิดหรือยกเลิกแล้วเป็นประวัติถาวร' },
  '/api/transfers': { action: 'reverse', createPath: '/workflows/transfers/create', allowed: () => true, unavailable: 'ย้อนแก้รายการย้ายนี้ไม่ได้' },
  '/api/disposals': { action: 'reverse', createPath: '/workflows/disposals/create', allowed: row => row.status !== 'CANCELLED', unavailable: 'รายการจำหน่ายนี้ถูกย้อนกลับแล้ว' },
}
const correctionQuery = (row: Record<string, any>): Record<string, string> => {
  const dateValue = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : ''
  if (props.endpoint === '/api/loans') return { assetId: row.assetId, borrowerId: row.borrowerId, purpose: row.purpose, borrowedAt: dateValue(row.loanedAt), dueAt: dateValue(row.dueAt), conditionBefore: row.conditionBefore }
  if (props.endpoint === '/api/repairs') return { assetId: row.assetId, symptom: row.issue, reportedAt: dateValue(row.reportedAt) }
  if (props.endpoint === '/api/transfers') return { assetId: row.assetId, destinationLocationId: row.toLocationId, newResponsiblePersonId: row.toResponsibleId || '', transferredAt: dateValue(row.transferredAt), reason: row.reason }
  if (props.endpoint === '/api/disposals') return { assetId: row.assetId, proposedAt: dateValue(row.proposedAt), reason: row.reason }
  return {}
}
const correctWorkflow = async (row: Record<string, any>) => {
  const config = correctionConfig[props.endpoint]
  if (!config || !config.allowed(row)) {
    toast.add({ title: 'แก้ไขรายการนี้ไม่ได้', description: config?.unavailable || 'ไม่พบขั้นตอนแก้ไขสำหรับรายการนี้', color: 'warning' })
    return
  }
  const reason = window.prompt('ระบุเหตุผลที่แก้ไขรายการ')?.trim()
  if (!reason) {
    toast.add({ title: 'ยังไม่ได้แก้ไขรายการ', description: 'ต้องระบุเหตุผลเพื่อเก็บประวัติการแก้ไข', color: 'warning' })
    return
  }
  try {
    await $fetch(`${props.endpoint}/${row.id}/${config.action}`, { method: 'POST', body: { reason } })
    toast.add({ title: 'ย้อนรายการเดิมแล้ว', description: 'ตรวจสอบข้อมูลในแบบฟอร์มและบันทึกรายการที่ถูกต้อง', color: 'success' })
    await navigateTo({ path: config.createPath, query: correctionQuery(row) })
  } catch (error: any) {
    toast.add({ title: 'ยังแก้ไขรายการไม่ได้', description: error?.data?.message || error?.statusMessage || 'กรุณาตรวจสอบสถานะรายการ', color: 'error' })
  }
}
const runAction = async (row: Record<string, any>, action: string) => {
  const today = new Date().toISOString().slice(0, 10)
  let body: Record<string, any> = {}
  if (action === 'return') body = { returnedAt: today, conditionAfter: 'NORMAL', notes: null, openRepair: false }
  if (action === 'cancel' || action === 'reverse') {
    const reason = window.prompt('ระบุเหตุผล')?.trim()
    if (!reason) { toast.add({ title: 'ยังดำเนินการไม่ได้', description: 'ต้องระบุเหตุผลก่อนยืนยัน', color: 'warning' }); return }
    body = { reason }
  }
  if (action === 'send') {
    const vendor = window.prompt('ชื่อร้าน/ผู้รับซ่อม')?.trim()
    if (!vendor) { toast.add({ title: 'ยังส่งซ่อมไม่ได้', description: 'ต้องระบุร้านหรือผู้รับซ่อม', color: 'warning' }); return }
    body = { vendor, sentAt: today }
  }
  if (action === 'close-repair') body = { receivedAt: today, successful: true, result: 'ซ่อมสำเร็จ', cost: 0 }
  if (action === 'complete-disposal') {
    const documentNumber = window.prompt('เลขที่เอกสารอนุมัติ')?.trim()
    const method = window.prompt('วิธีจำหน่าย')?.trim()
    if (!documentNumber || !method) { toast.add({ title: 'ยังจำหน่ายไม่ได้', description: 'ต้องระบุเลขที่เอกสารและวิธีจำหน่าย', color: 'warning' }); return }
    body = { disposedAt: today, method, documentNumber }
  }
  const path: Record<string, string> = { return: 'return', cancel: 'cancel', send: 'send', 'close-repair': 'close', 'complete-disposal': 'complete', reverse: 'reverse' }
  try { await $fetch(`${props.endpoint}/${row.id}/${path[action]}`, { method: 'POST', body }); toast.add({ title: 'ดำเนินการสำเร็จ', color: 'success' }); await reload() }
  catch (error: any) { toast.add({ title: 'ดำเนินการไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
</script>

<template>
  <PageHeader :title="title" :description="description">
    <NuxtLink v-if="createTo" :to="createTo" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"><UIcon name="i-lucide-plus" class="size-4" />{{ createLabel || 'เพิ่มรายการ' }}</NuxtLink>
    <button v-else-if="createLabel" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" type="button" @click="explainUnavailableCreate"><UIcon name="i-lucide-plus" class="size-4" />{{ createLabel }}</button>
  </PageHeader>
  <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div class="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex w-full min-w-0 items-center gap-2 lg:w-auto lg:min-w-56 lg:max-w-md lg:flex-1">
        <div class="relative min-w-0 flex-1"><UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input v-model="query" class="pl-10" type="search" :placeholder="`ค้นหา${title}ทันที…`"></div>
        <button class="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden" type="button" title="รีเฟรชข้อมูล" aria-label="รีเฟรช" @click="refreshTable"><UIcon name="i-lucide-refresh-cw" class="size-5" /></button>
      </div>
      <div class="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
        <select v-for="filter in filterDefinitions" :key="filter.key" v-model="filters[filter.key]" class="w-auto min-w-36" :aria-label="filter.label"><option value="">{{ filter.label }}</option><option v-for="option in filter.options" :key="option.value" :value="option.value">{{ option.label }}</option></select>
        <button class="hidden min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex" type="button" @click="refreshTable"><UIcon name="i-lucide-refresh-cw" class="size-4" />รีเฟรช</button>
        <span class="hidden text-sm text-slate-500 dark:text-slate-400 lg:ml-2 lg:inline">{{ total.toLocaleString('th-TH') }} รายการ</span>
      </div>
    </div>
    <AppState :status="status" :error="error" :empty="items.length === 0" :empty-title="emptyTitle" @retry="reload">
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th v-for="column in columns" :key="column.key" :aria-sort="column.sortable ? (sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined"><button v-if="column.sortable" class="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-left hover:text-teal-700 dark:hover:text-teal-400" type="button" :aria-label="sortLabel(column)" @click="toggleSort(column.key)">{{ column.label }}<UIcon :name="sortIcon(column.key)" class="size-4 shrink-0" /></button><template v-else>{{ column.label }}</template></th><th v-if="hasActions" class="w-px whitespace-nowrap text-center">ดำเนินการ</th></tr></thead>
          <tbody>
            <tr v-for="row in items" :key="row.id">
              <td v-for="(column, index) in columns" :key="column.key">
                <StatusBadge v-if="column.type === 'status'" :value="getValue(row, column.key)" />
                <span v-else-if="column.type === 'active'" class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold" :class="getValue(row, column.key) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'">{{ getValue(row, column.key) ? 'เปิดการใช้งาน' : 'ปิดการใช้งาน' }}</span>
                <template v-else-if="column.type === 'date'">{{ formatThaiDate(getValue(row, column.key)) }}</template>
                <template v-else-if="column.type === 'money'">{{ money.format(Number(getValue(row, column.key) || 0)) }}</template>
                <NuxtLink v-else-if="index === 0 && row.id && endpoint === '/api/assets'" :to="`/assets/${row.id}`" class="font-bold text-teal-700 hover:underline dark:text-teal-400">{{ getValue(row, column.key) || '—' }}</NuxtLink>
                <template v-else>{{ getValue(row, column.key) || '—' }}</template>
              </td>
              <td v-if="hasActions" class="w-px whitespace-nowrap"><div class="flex flex-nowrap justify-center gap-1">
                <NuxtLink v-if="endpoint === '/api/assets'" :to="`/assets/${row.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" title="ดูรายละเอียด" aria-label="ดูรายละเอียด"><UIcon name="i-lucide-eye" class="size-4" /></NuxtLink>
                <NuxtLink v-if="endpoint === '/api/assets'" :to="`/assets/edit/${row.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" title="แก้ไขครุภัณฑ์" aria-label="แก้ไขครุภัณฑ์"><UIcon name="i-lucide-pencil" class="size-4" /></NuxtLink>
                <button v-if="endpoint === '/api/assets'" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950" title="ลบครุภัณฑ์" aria-label="ลบครุภัณฑ์" @click="explainAssetDelete"><UIcon name="i-lucide-trash-2" class="size-4" /></button>
                <NuxtLink v-if="endpoint === '/api/people'" :to="`/edit/people/${row.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" title="แก้ไขบุคคล" aria-label="แก้ไขบุคคล"><UIcon name="i-lucide-pencil" class="size-4" /></NuxtLink>
                <button v-if="endpoint === '/api/people'" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950" :title="row.isActive === false ? 'เปิดใช้งานบุคคล' : 'ปิดใช้งานบุคคล'" :aria-label="row.isActive === false ? 'เปิดใช้งานบุคคล' : 'ปิดใช้งานบุคคล'" @click="togglePerson(row)"><UIcon :name="row.isActive === false ? 'i-lucide-user-check' : 'i-lucide-user-x'" class="size-4" /></button>
                <NuxtLink v-if="endpoint === '/api/inspections'" :to="`/inspections/${row.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" title="เปิดรอบ" aria-label="เปิดรอบ"><UIcon name="i-lucide-clipboard-check" class="size-4" /></NuxtLink>
                <template v-if="endpoint === '/api/loans'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" title="แก้ไขรายการยืม" aria-label="แก้ไขรายการยืม" @click="correctWorkflow(row)"><UIcon name="i-lucide-pencil" class="size-4" /></button><template v-if="row.status === 'ACTIVE'"><button class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="รับคืน" aria-label="รับคืน" @click="runAction(row, 'return')"><UIcon name="i-lucide-rotate-ccw" class="size-4" /></button><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ยกเลิก" aria-label="ยกเลิก" @click="runAction(row, 'cancel')"><UIcon name="i-lucide-x" class="size-4" /></button></template></template>
                <template v-if="endpoint === '/api/repairs'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไขงานซ่อม" aria-label="แก้ไขงานซ่อม" @click="correctWorkflow(row)"><UIcon name="i-lucide-pencil" class="size-4" /></button><button v-if="row.status === 'REPORTED'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="ส่งซ่อม" aria-label="ส่งซ่อม" @click="runAction(row, 'send')"><UIcon name="i-lucide-send" class="size-4" /></button><button v-if="row.status === 'SENT'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="รับกลับ" aria-label="รับกลับ" @click="runAction(row, 'close-repair')"><UIcon name="i-lucide-package-check" class="size-4" /></button><button v-if="['REPORTED', 'SENT'].includes(row.status)" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ยกเลิกงานซ่อม" aria-label="ยกเลิกงานซ่อม" @click="runAction(row, 'cancel')"><UIcon name="i-lucide-x" class="size-4" /></button></template>
                <template v-if="endpoint === '/api/transfers'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไขรายการย้าย" aria-label="แก้ไขรายการย้าย" @click="correctWorkflow(row)"><UIcon name="i-lucide-pencil" class="size-4" /></button><button v-if="row.status !== 'REVERSED'" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ย้อนกลับรายการย้าย" aria-label="ย้อนกลับรายการย้าย" @click="runAction(row, 'reverse')"><UIcon name="i-lucide-undo-2" class="size-4" /></button></template>
                <template v-if="endpoint === '/api/disposals'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไขรายการจำหน่าย" aria-label="แก้ไขรายการจำหน่าย" @click="correctWorkflow(row)"><UIcon name="i-lucide-pencil" class="size-4" /></button><template v-if="row.status !== 'CANCELLED'"><button v-if="row.status === 'PROPOSED'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="จำหน่ายแล้ว" aria-label="จำหน่ายแล้ว" @click="runAction(row, 'complete-disposal')"><UIcon name="i-lucide-trash-2" class="size-4" /></button><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ย้อนกลับรายการจำหน่าย" aria-label="ย้อนกลับรายการจำหน่าย" @click="runAction(row, 'reverse')"><UIcon name="i-lucide-undo-2" class="size-4" /></button></template></template>
                <label v-if="ownerTypes[endpoint]" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" title="แนบหลักฐาน"><UIcon name="i-lucide-paperclip" class="size-4" /><span class="sr-only">แนบหลักฐาน</span><input class="hidden" type="file" @change="uploadAttachment($event, row)"></label>
                <a v-for="file in ownerTypes[endpoint] ? (row.attachments || []) : []" :key="file.id" :href="`/api/attachments/${file.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950" :title="file.originalName || file.filename || 'ดาวน์โหลดไฟล์'" :aria-label="`ดาวน์โหลด ${file.originalName || file.filename || 'ไฟล์'}`"><UIcon name="i-lucide-download" class="size-4" /></a>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppState>
    <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><span>แสดง {{ firstItem.toLocaleString('th-TH') }}–{{ lastItem.toLocaleString('th-TH') }} จาก {{ total.toLocaleString('th-TH') }}</span><label class="flex items-center gap-2">ต่อหน้า<select v-model.number="pageSize" class="w-auto" aria-label="จำนวนรายการต่อหน้า"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option><option :value="100">100</option></select></label></div>
      <nav class="flex items-center gap-1" aria-label="แบ่งหน้าตาราง">
        <button class="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" type="button" aria-label="หน้าก่อนหน้า" @click="changePage(page - 1)"><UIcon name="i-lucide-chevron-left" class="size-4" /></button>
        <button v-for="number in visiblePages" :key="number" class="grid size-9 place-items-center rounded-lg border text-sm font-bold" :class="number === page ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'" type="button" :aria-label="`หน้า ${number}`" :aria-current="number === page ? 'page' : undefined" @click="changePage(number)">{{ number.toLocaleString('th-TH') }}</button>
        <button class="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" type="button" aria-label="หน้าถัดไป" @click="changePage(page + 1)"><UIcon name="i-lucide-chevron-right" class="size-4" /></button>
      </nav>
    </footer>
  </section>
</template>
