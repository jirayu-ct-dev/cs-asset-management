<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Column { key: string, label: string, type?: 'date' | 'status' | 'money' }
const props = defineProps<{
  endpoint: string
  title: string
  description: string
  columns: Column[]
  createLabel?: string
  createTo?: string
  emptyTitle?: string
}>()
const { formatThaiDate } = useThaiDate()
const { query, items, total, status, error, reload } = useResourceList<Record<string, any>>(props.endpoint)
const getValue = (row: Record<string, any>, path: string): any => path.split('.').reduce<any>((value, part) => value?.[part], row)
const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 })
const toast = useToast()
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
const runAction = async (row: Record<string, any>, action: string) => {
  const today = new Date().toISOString().slice(0, 10)
  let body: Record<string, any> = {}
  if (action === 'return') body = { returnedAt: today, conditionAfter: 'NORMAL', notes: null, openRepair: false }
  if (action === 'immutable-edit') {
    toast.add({ title: 'แก้ไขธุรกรรมโดยตรงไม่ได้', description: 'รายการนี้เป็นประวัติ Audit กรุณายกเลิกหรือย้อนกลับพร้อมเหตุผล แล้วสร้างรายการที่ถูกต้องใหม่', color: 'warning' })
    return
  }
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
    <div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 flex flex-wrap items-center gap-2">
      <div class="relative min-w-0 flex-1 md:min-w-56"><UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input v-model="query" class="pl-10" type="search" :placeholder="`ค้นหา${title}…`" @keyup.enter="reload"></div>
      <button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" type="button" @click="reload"><UIcon name="i-lucide-search" class="size-4" />ค้นหา</button>
      <span class="text-sm text-slate-500 dark:text-slate-400">{{ total.toLocaleString('th-TH') }} รายการ</span>
    </div>
    <AppState :status="status" :error="error" :empty="items.length === 0" :empty-title="emptyTitle" @retry="reload">
      <div class="overflow-x-auto">
        <table>
          <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th><th v-if="hasActions" class="w-px whitespace-nowrap text-center">ดำเนินการ</th></tr></thead>
          <tbody>
            <tr v-for="row in items" :key="row.id">
              <td v-for="(column, index) in columns" :key="column.key">
                <StatusBadge v-if="column.type === 'status'" :value="getValue(row, column.key)" />
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
                <template v-if="endpoint === '/api/loans'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" title="แก้ไข" aria-label="แก้ไข" @click="runAction(row, 'immutable-edit')"><UIcon name="i-lucide-pencil" class="size-4" /></button><template v-if="row.status === 'ACTIVE'"><button class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="รับคืน" aria-label="รับคืน" @click="runAction(row, 'return')"><UIcon name="i-lucide-rotate-ccw" class="size-4" /></button><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ยกเลิก" aria-label="ยกเลิก" @click="runAction(row, 'cancel')"><UIcon name="i-lucide-x" class="size-4" /></button></template></template>
                <template v-if="endpoint === '/api/repairs'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไข" aria-label="แก้ไข" @click="runAction(row, 'immutable-edit')"><UIcon name="i-lucide-pencil" class="size-4" /></button><button v-if="row.status === 'REPORTED'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="ส่งซ่อม" aria-label="ส่งซ่อม" @click="runAction(row, 'send')"><UIcon name="i-lucide-send" class="size-4" /></button><button v-if="row.status === 'SENT'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="รับกลับ" aria-label="รับกลับ" @click="runAction(row, 'close-repair')"><UIcon name="i-lucide-package-check" class="size-4" /></button><button v-if="['REPORTED', 'SENT'].includes(row.status)" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ยกเลิกงานซ่อม" aria-label="ยกเลิกงานซ่อม" @click="runAction(row, 'cancel')"><UIcon name="i-lucide-x" class="size-4" /></button></template>
                <template v-if="endpoint === '/api/transfers'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไข" aria-label="แก้ไข" @click="runAction(row, 'immutable-edit')"><UIcon name="i-lucide-pencil" class="size-4" /></button><button v-if="row.status !== 'REVERSED'" class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ย้อนกลับรายการย้าย" aria-label="ย้อนกลับรายการย้าย" @click="runAction(row, 'reverse')"><UIcon name="i-lucide-undo-2" class="size-4" /></button></template>
                <template v-if="endpoint === '/api/disposals'"><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700" title="แก้ไข" aria-label="แก้ไข" @click="runAction(row, 'immutable-edit')"><UIcon name="i-lucide-pencil" class="size-4" /></button><template v-if="row.status !== 'CANCELLED'"><button v-if="row.status === 'PROPOSED'" class="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800" title="จำหน่ายแล้ว" aria-label="จำหน่ายแล้ว" @click="runAction(row, 'complete-disposal')"><UIcon name="i-lucide-trash-2" class="size-4" /></button><button class="grid size-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" title="ย้อนกลับรายการจำหน่าย" aria-label="ย้อนกลับรายการจำหน่าย" @click="runAction(row, 'reverse')"><UIcon name="i-lucide-undo-2" class="size-4" /></button></template></template>
                <label v-if="ownerTypes[endpoint]" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" title="แนบหลักฐาน"><UIcon name="i-lucide-paperclip" class="size-4" /><span class="sr-only">แนบหลักฐาน</span><input class="hidden" type="file" @change="uploadAttachment($event, row)"></label>
                <a v-for="file in ownerTypes[endpoint] ? (row.attachments || []) : []" :key="file.id" :href="`/api/attachments/${file.id}`" class="grid size-9 shrink-0 place-items-center rounded-lg text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950" :title="file.originalName || file.filename || 'ดาวน์โหลดไฟล์'" :aria-label="`ดาวน์โหลด ${file.originalName || file.filename || 'ไฟล์'}`"><UIcon name="i-lucide-download" class="size-4" /></a>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppState>
  </section>
</template>
