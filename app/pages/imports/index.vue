<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, vue/no-multiple-template-root */
const step = ref(1)
const file = ref<File | null>(null)
const pending = ref(false)
const errorMessage = ref('')
const toast = useToast()
const batch = ref<any>(null)
const mapping = reactive<Record<string, string>>({})
const systemFields = [
  ['assetNumber', 'หมายเลขครุภัณฑ์'], ['name', 'ชื่อ'], ['receivedDate', 'วันที่รับ'], ['price', 'ราคา'],
  ['quantity', 'จำนวน'], ['unit', 'หน่วยนับ'], ['location', 'สถานที่'], ['category', 'หมวด'],
]
const pick = (event: Event) => { file.value = (event.target as HTMLInputElement).files?.[0] || null }
const previewFile = async () => {
  const body = new FormData()
  body.append('file', file.value as File)
  body.append('mapping', JSON.stringify(mapping))
  return $fetch('/api/imports/preview', { method: 'POST', body })
}
const upload = async () => {
  if (pending.value) { toast.add({ title: 'กำลังอ่านไฟล์', description: 'กรุณารอให้คำขอปัจจุบันเสร็จสิ้น', color: 'warning' }); return }
  if (!file.value) { toast.add({ title: 'ยังไม่ได้เลือกไฟล์', description: 'กรุณาเลือกไฟล์ .xlsx หรือ .csv ก่อนดำเนินการ', color: 'warning' }); return }
  pending.value = true; errorMessage.value = ''
  try {
    batch.value = await previewFile()
    for (const header of batch.value?.headers || []) mapping[header] = batch.value?.suggestedMapping?.[header] || ''
    step.value = 2
  } catch (error: any) { errorMessage.value = error?.data?.message || 'อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบชนิดและรูปแบบไฟล์' }
  finally { pending.value = false }
}
const applyMapping = async () => {
  if (pending.value) { toast.add({ title: 'กำลังตรวจสอบ', description: 'กรุณารอให้คำขอปัจจุบันเสร็จสิ้น', color: 'warning' }); return }
  pending.value = true; errorMessage.value = ''
  try {
    batch.value = await $fetch(`/api/imports/${batch.value.id}/validate`, { method: 'POST', body: { mapping } })
    step.value = 3
  }
  catch (error: any) { errorMessage.value = error?.data?.message || 'ตรวจสอบข้อมูลไม่สำเร็จ' }
  finally { pending.value = false }
}
const confirmImport = async () => {
  if (pending.value) { toast.add({ title: 'กำลังนำเข้าข้อมูล', description: 'กรุณารอให้คำขอปัจจุบันเสร็จสิ้น', color: 'warning' }); return }
  if (!batch.value?.summary?.valid) { toast.add({ title: 'ไม่มีแถวที่พร้อมนำเข้า', description: 'แก้ไขการจับคู่หรือข้อมูลต้นฉบับก่อนยืนยัน', color: 'warning' }); return }
  pending.value = true; errorMessage.value = ''
  try {
    const result: any = await $fetch(`/api/imports/${batch.value.id}/confirm`, { method: 'POST' })
    batch.value = result
    step.value = 4
  }
  catch (error: any) { errorMessage.value = error?.data?.message || 'นำเข้าข้อมูลไม่สำเร็จ ไม่มีข้อมูลถูกบันทึก' }
  finally { pending.value = false }
}
</script>

<template>
  <PageHeader title="นำเข้าข้อมูล" description="อัปโหลด Map คอลัมน์ ตรวจทาน และยืนยันก่อนบันทึกจริง" />
  <div class="mb-6 flex overflow-x-auto"><div v-for="(label, index) in ['อัปโหลด', 'Map คอลัมน์', 'ตรวจทาน', 'เสร็จสิ้น']" :key="label" class="flex min-w-28 flex-1 items-center gap-2 text-xs font-bold" :class="step >= index + 1 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'"><span class="grid size-7 place-items-center rounded-full bg-slate-200 dark:bg-slate-800">{{ index + 1 }}</span>{{ label }}</div></div>
  <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5">
    <div v-if="errorMessage" class="rounded-lg p-3 text-sm bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 mb-4" role="alert">{{ errorMessage }}</div>
    <template v-if="step === 1"><h2>เลือกไฟล์ Excel หรือ CSV</h2><p class="text-sm text-slate-500 dark:text-slate-400">รองรับ .xlsx และ .csv UTF-8 ระบบจะแสดงทุกแถวให้ตรวจสอบก่อนบันทึก</p><label class="my-6"><span class="text-slate-700 after:text-red-600 after:content-['*']">ไฟล์ข้อมูล</span><input type="file" accept=".xlsx,.csv" required @change="pick"></label><div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" @click="upload">{{ pending ? 'กำลังอ่านไฟล์…' : 'อัปโหลดและตรวจสอบ' }}</button></div></template>
    <template v-else-if="step === 2"><h2>จับคู่คอลัมน์</h2><p class="text-sm text-slate-500 dark:text-slate-400">เลือกฟิลด์ระบบให้ตรงกับหัวคอลัมน์จากไฟล์</p><div class="grid grid-cols-1 gap-4 md:grid-cols-2 mt-5"><label v-for="header in batch?.headers" :key="header">{{ header }}<select v-model="mapping[header]"><option value="">ไม่ต้องนำเข้า</option><option v-for="field in systemFields" :key="field[0]" :value="field[0]">{{ field[1] }}</option></select></label></div><div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" @click="step = 1">ย้อนกลับ</button><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" @click="applyMapping">ตรวจสอบข้อมูล</button></div></template>
    <template v-else-if="step === 3"><div class="flex flex-wrap items-center gap-2 justify-between"><div><h2>ตรวจทานก่อนนำเข้า</h2><p class="text-sm text-slate-500 dark:text-slate-400">พร้อม {{ batch?.summary?.valid || 0 }} · ผิดพลาด {{ batch?.summary?.invalid || 0 }} · ซ้ำ {{ batch?.summary?.duplicate || 0 }}</p></div><StatusBadge :value="batch?.summary?.invalid ? 'PENDING' : 'COMPLETED'" /></div><div class="overflow-x-auto mt-5"><table><thead><tr><th>แถว</th><th>หมายเลข</th><th>ชื่อ</th><th>สถานะ</th><th>ข้อผิดพลาด</th></tr></thead><tbody><tr v-for="row in batch?.rows" :key="row.rowNumber"><td>{{ row.rowNumber }}</td><td>{{ row.data?.assetNumber || '—' }}</td><td>{{ row.data?.name || '—' }}</td><td><StatusBadge :value="row.valid ? 'COMPLETED' : 'CANCELLED'" /></td><td>{{ row.errors?.join(', ') || '—' }}</td></tr></tbody></table></div><div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" @click="step = 2">แก้การจับคู่</button><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" @click="confirmImport">ยืนยันนำเข้า {{ batch?.summary?.valid || 0 }} รายการ</button></div></template>
    <template v-else><div class="flex min-h-44 items-center justify-center gap-3 p-8 text-center text-slate-500"><span class="grid size-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"><UIcon name="i-lucide-circle-check" class="size-6 text-teal-700 dark:text-teal-400" /></span><div><strong>นำเข้าข้อมูลเสร็จแล้ว</strong><p>สำเร็จ {{ batch?.summary?.imported || 0 }} · ข้าม {{ batch?.summary?.skipped || 0 }} · ผิดพลาด {{ batch?.summary?.invalid || 0 }}</p><NuxtLink to="/assets" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"><UIcon name="i-lucide-package" class="size-4" />ดูทะเบียนครุภัณฑ์</NuxtLink></div></div></template>
  </section>
</template>
