<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const route = useRoute()
const type = String(route.params.type)
const toast = useToast()
const today = new Date().toISOString().slice(0, 10)
const meta: Record<string, { title: string, back: string }> = {
  people: { title: 'เพิ่มบุคคล', back: '/people' }, loans: { title: 'บันทึกการยืม', back: '/loans' },
  repairs: { title: 'แจ้งชำรุด', back: '/repairs' }, transfers: { title: 'ย้ายครุภัณฑ์', back: '/transfers' },
  inspections: { title: 'เปิดรอบตรวจนับ', back: '/inspections' }, disposals: { title: 'เสนอจำหน่าย', back: '/disposals' },
}
const current = meta[type]
if (!current) throw createError({ statusCode: 404, statusMessage: 'ไม่พบแบบฟอร์ม' })
const form = reactive<any>({
  name: '', code: '', type: 'STAFF', department: '', phone: '', email: '', assetId: String(route.query.assetId || ''),
  borrowerId: '', purpose: '', borrowedAt: today, dueAt: today, conditionBefore: 'NORMAL', reportedAt: today, symptom: '',
  destinationLocationId: '', newResponsiblePersonId: '', transferredAt: today, reason: '', fiscalYear: new Date().getFullYear() + 543,
  locationId: '', proposedAt: today,
})
const { data: assetsData } = useFetch<any>('/api/assets', { query: { pageSize: 100 } })
const { data: peopleData } = useFetch<any>('/api/people', { query: { pageSize: 100 } })
const { data: references } = useFetch<any>('/api/references')
const assets = computed(() => assetsData.value?.items || [])
const people = computed(() => peopleData.value?.items || [])
const pending = ref(false)
const submit = async () => {
  if (pending.value) { toast.add({ title: 'กำลังบันทึก', description: 'กรุณารอคำขอปัจจุบัน', color: 'warning' }); return }
  pending.value = true
  try {
    const result: any = await ($fetch as any)(`/api/${type}`, { method: 'POST', body: form })
    toast.add({ title: 'บันทึกข้อมูลแล้ว', color: 'success' })
    await navigateTo(type === 'inspections' ? `/inspections/${result.id}` : current.back)
  } catch (error: any) { toast.add({ title: 'บันทึกไม่สำเร็จ', description: error?.data?.message || error?.statusMessage || 'กรุณาตรวจสอบข้อมูล', color: 'error' }) }
  finally { pending.value = false }
}
</script>

<template>
  <div>
    <PageHeader :title="current.title" description="กรอกข้อมูลที่จำเป็น แล้วตรวจสอบก่อนบันทึก"><NuxtLink :to="current.back" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">ยกเลิก</NuxtLink></PageHeader>
    <form class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5" @submit.prevent="submit">
      <div v-if="type === 'people'" class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">ชื่อ–นามสกุล</span><input v-model="form.name" required></label><label>รหัส<input v-model="form.code"></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">ประเภท</span><select v-model="form.type"><option value="STUDENT">นักศึกษา</option><option value="STAFF">บุคลากร</option><option value="EXTERNAL">บุคคลภายนอก</option></select></label><label>หน่วยงาน<input v-model="form.department"></label><label>โทรศัพท์<input v-model="form.phone"></label><label>อีเมล<input v-model="form.email" type="email"></label>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label v-if="type !== 'inspections'"><span class="text-slate-700 after:text-red-600 after:content-['*']">ครุภัณฑ์</span><select v-model="form.assetId" required><option value="">เลือกครุภัณฑ์</option><option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.assetNumber }} — {{ asset.name }}</option></select></label>
        <template v-if="type === 'loans'"><label><span class="text-slate-700 after:text-red-600 after:content-['*']">ผู้ยืม</span><select v-model="form.borrowerId" required><option value="">เลือกผู้ยืม</option><option v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</option></select></label><label>วันที่ยืม<input v-model="form.borrowedAt" type="date" required></label><label>กำหนดคืน<input v-model="form.dueAt" type="date" required></label><label class="md:col-span-2">วัตถุประสงค์<textarea v-model="form.purpose" required /></label><label>สภาพก่อนยืม<select v-model="form.conditionBefore"><option value="NORMAL">ปกติ</option><option value="DAMAGED_USABLE">ชำรุดแต่ใช้ได้</option></select></label></template>
        <template v-else-if="type === 'repairs'"><label>วันที่แจ้ง<input v-model="form.reportedAt" type="date" required></label><label class="md:col-span-2">อาการชำรุด<textarea v-model="form.symptom" required /></label></template>
        <template v-else-if="type === 'transfers'"><label><span class="text-slate-700 after:text-red-600 after:content-['*']">สถานที่ปลายทาง</span><select v-model="form.destinationLocationId" required><option value="">เลือกสถานที่</option><option v-for="item in references?.locations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>ผู้รับผิดชอบใหม่<select v-model="form.newResponsiblePersonId"><option value="">ไม่ระบุ</option><option v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</option></select></label><label>วันที่ย้าย<input v-model="form.transferredAt" type="date" required></label><label class="md:col-span-2">เหตุผล<textarea v-model="form.reason" required /></label></template>
        <template v-else-if="type === 'inspections'"><label>ชื่อรอบ<input v-model="form.name" required></label><label>ปีงบประมาณ<input v-model.number="form.fiscalYear" type="number" min="2500" max="2800" required></label><label class="md:col-span-2">ขอบเขตสถานที่<select v-model="form.locationId"><option value="">ทุกสถานที่</option><option v-for="item in references?.locations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label></template>
        <template v-else-if="type === 'disposals'"><label>วันที่เสนอ<input v-model="form.proposedAt" type="date" required></label><label class="md:col-span-2">เหตุผล<textarea v-model="form.reason" required /></label></template>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><NuxtLink :to="current.back" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">ยกเลิก</NuxtLink><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" type="submit">{{ pending ? 'กำลังบันทึก…' : 'บันทึก' }}</button></div>
    </form>
  </div>
</template>
