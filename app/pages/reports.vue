<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const type = ref('assets')
const format = ref('pdf')
const filters = reactive({ from: '', to: '', locationId: '', categoryId: '', status: '', roundId: '', assetId: '' })
const pending = ref(false)
const errorMessage = ref('')
const preview = ref<any>(null)
const toast = useToast()
const assetSearch = ref('')
const roundSearch = ref('')
const { data: references } = useFetch<any>('/api/references')
const { data: roundsData } = useFetch<any>('/api/inspections', { query: computed(() => ({ pageSize: 50, search: roundSearch.value || undefined })) })
const { data: assetsData } = useFetch<any>('/api/assets', { query: computed(() => ({ pageSize: 50, search: assetSearch.value || undefined })) })
const rounds = computed(() => roundsData.value?.items || [])
const assets = computed(() => assetsData.value?.items || [])
const statusOptions = computed(() => {
  if (type.value === 'assets') return [['ACTIVE', 'ใช้งาน'], ['PROPOSED_FOR_DISPOSAL', 'เสนอจำหน่าย'], ['DISPOSED', 'จำหน่ายแล้ว']]
  if (type.value === 'loans') return [['ACTIVE', 'กำลังยืม'], ['OVERDUE', 'เกินกำหนด'], ['RETURNED', 'คืนแล้ว'], ['CANCELLED', 'ยกเลิก']]
  if (type.value === 'repairs') return [['REPORTED', 'แจ้งแล้ว'], ['SENT', 'ส่งซ่อม'], ['COMPLETED', 'เสร็จสิ้น'], ['CANCELLED', 'ยกเลิก']]
  if (type.value === 'inspections') return [['FOUND_OK', 'พบ ใช้งานได้'], ['FOUND_DAMAGED', 'พบ ชำรุด'], ['REPAIR_REQUESTED', 'ขอซ่อม'], ['MISSING', 'ไม่พบ'], ['DISPOSAL_REQUESTED', 'ขอจำหน่าย'], ['OTHER', 'อื่น ๆ']]
  if (type.value === 'disposals') return [['PROPOSED', 'เสนอแล้ว'], ['COMPLETED', 'จำหน่ายแล้ว'], ['CANCELLED', 'ยกเลิก']]
  return []
})
const reportQuery = computed(() => {
  const allowed: Record<string, Array<keyof typeof filters>> = {
    assets: ['from', 'to', 'locationId', 'categoryId', 'status'],
    loans: ['from', 'to', 'assetId', 'status'], repairs: ['from', 'to', 'assetId', 'status'],
    transfers: ['from', 'to', 'assetId'], inspections: ['from', 'to', 'assetId', 'roundId', 'status'],
    disposals: ['from', 'to', 'assetId', 'status'], 'asset-history': ['from', 'to', 'assetId'],
  }
  return Object.fromEntries([['type', type.value], ...(allowed[type.value] || []).map(key => [key, filters[key]])].filter(([, value]) => value))
})
watch(type, () => { Object.assign(filters, { locationId: '', categoryId: '', status: '', roundId: '', assetId: '' }) })
watch([type, format, ...Object.keys(filters).map(key => () => filters[key as keyof typeof filters])], () => { preview.value = null; errorMessage.value = '' })
const loadPreview = async () => {
  if (pending.value) { toast.add({ title: 'กำลังสร้างตัวอย่าง', description: 'กรุณารอคำขอปัจจุบัน', color: 'warning' }); return }
  if (type.value === 'asset-history' && !filters.assetId) { toast.add({ title: 'ยังสร้างรายงานไม่ได้', description: 'กรุณาเลือกครุภัณฑ์', color: 'warning' }); return }
  pending.value = true
  try { preview.value = await $fetch('/api/reports/preview', { query: reportQuery.value }); errorMessage.value = '' }
  catch (error: any) { preview.value = null; errorMessage.value = error?.data?.message || 'สร้างตัวอย่างรายงานไม่สำเร็จ' }
  finally { pending.value = false }
}
const download = () => {
  if (!preview.value) { toast.add({ title: 'ยังดาวน์โหลดไม่ได้', description: 'ดูตัวอย่างด้วยเงื่อนไขปัจจุบันก่อน', color: 'warning' }); return }
  const query = new URLSearchParams({ ...reportQuery.value, format: format.value })
  window.location.href = `/api/reports/export?${query}`
}
</script>

<template><div><PageHeader title="รายงาน" description="ตัวอย่างและไฟล์ส่งออกใช้เงื่อนไขชุดเดียวกัน" /><div class="grid gap-4 xl:grid-cols-[1.5fr_.8fr]"><section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="grid gap-4 md:grid-cols-2"><label class="md:col-span-2">ประเภทรายงาน<select v-model="type"><option value="assets">ทะเบียนครุภัณฑ์</option><option value="loans">ยืม–คืน</option><option value="repairs">ซ่อม</option><option value="transfers">ย้าย</option><option value="inspections">ตรวจนับ</option><option value="disposals">จำหน่าย</option><option value="asset-history">ประวัติครุภัณฑ์รายชิ้น</option></select></label><label>ตั้งแต่วันที่<input v-model="filters.from" type="date"></label><label>ถึงวันที่<input v-model="filters.to" type="date"></label><label v-if="type === 'assets'">สถานที่<select v-model="filters.locationId"><option value="">ทั้งหมด</option><option v-for="item in references?.locations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label v-if="type === 'assets'">หมวด<select v-model="filters.categoryId"><option value="">ทั้งหมด</option><option v-for="item in references?.categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label v-if="statusOptions.length">สถานะ<select v-model="filters.status"><option value="">ทั้งหมด</option><option v-for="item in statusOptions" :key="item[0]" :value="item[0]">{{ item[1] }}</option></select></label><template v-if="type === 'inspections'"><label>ค้นหารอบตรวจ<input v-model="roundSearch" type="search" placeholder="ชื่อรอบหรือปีงบประมาณ"></label><label>รอบตรวจ<select v-model="filters.roundId"><option value="">ทุกรอบ</option><option v-for="round in rounds" :key="round.id" :value="round.id">{{ round.name }}</option></select></label></template><template v-if="['loans','repairs','transfers','inspections','disposals','asset-history'].includes(type)"><label>ค้นหาครุภัณฑ์<input v-model="assetSearch" type="search" placeholder="หมายเลข ชื่อ หรือ Serial"></label><label>ครุภัณฑ์<select v-model="filters.assetId"><option value="">ทั้งหมด</option><option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.assetNumber }} — {{ asset.name }}</option></select></label></template><label>รูปแบบ<select v-model="format"><option value="pdf">PDF</option><option value="xlsx">Excel</option></select></label></div><div v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{{ errorMessage }}</div><div class="mt-6 flex justify-end gap-2"><button class="rounded-lg border border-slate-300 px-4 py-2 font-bold" @click="loadPreview">{{ pending ? 'กำลังคำนวณ…' : 'ดูตัวอย่าง' }}</button><button class="rounded-lg bg-teal-700 px-4 py-2 font-bold text-white" @click="download">ดาวน์โหลด</button></div></section><section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="border-b border-slate-200 p-5 font-bold">สรุปตัวอย่าง</div><AppState status="success" :empty="!preview" empty-title="ยังไม่มีตัวอย่าง"><div class="grid grid-cols-2 gap-4 p-5"><article><span class="text-sm text-slate-500">จำนวนรายการ</span><strong class="mt-2 block text-3xl">{{ preview?.count?.toLocaleString('th-TH') }}</strong></article><article><span class="text-sm text-slate-500">มูลค่ารวม</span><strong class="mt-2 block text-xl">{{ Number(preview?.totalValue || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }) }}</strong></article></div></AppState></section></div></div></template>
