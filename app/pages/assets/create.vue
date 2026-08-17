<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, vue/no-multiple-template-root */
interface Option { id: string, name: string }
const form = reactive({ assetNumber: '', internalCode: '', name: '', categoryId: '', unitId: '', locationId: '', fundingSourceId: '', responsiblePersonId: '', quantity: 1, brand: '', model: '', serialNumber: '', receivedDate: '', price: 0, notes: '' })
const pending = ref(false)
const submitError = ref('')
const toast = useToast()
const { data: references, status, error, refresh } = useFetch<Record<string, Option[]>>('/api/references')
const submit = async () => {
  if (pending.value) {
    toast.add({ title: 'กำลังบันทึกข้อมูล', description: 'กรุณารอให้คำขอปัจจุบันเสร็จสิ้น', color: 'warning' })
    return
  }
  pending.value = true; submitError.value = ''
  try {
    const result = await $fetch<{ id: string }>('/api/assets', { method: 'POST', body: form })
    await navigateTo(`/assets/${result.id}`)
  } catch (error: any) { submitError.value = error?.data?.message || 'บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูล' }
  finally { pending.value = false }
}
</script>

<template>
  <PageHeader title="เพิ่มครุภัณฑ์" description="กรอกข้อมูลทะเบียนปัจจุบันให้ครบถ้วน"><NuxtLink to="/assets" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">ยกเลิก</NuxtLink></PageHeader>
  <AppState :status="status" :error="error" @retry="refresh">
    <form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 [&_input]:h-11 [&_select]:h-11" @submit.prevent="submit">
      <div v-if="submitError" class="rounded-lg p-3 text-sm bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 md:col-span-2" role="alert">{{ submitError }}</div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">หมายเลขครุภัณฑ์</span><input v-model.trim="form.assetNumber" required maxlength="100" placeholder="เช่น 7440-001-0001"></label>
        <label>รหัสภายใน<input v-model.trim="form.internalCode" maxlength="255" placeholder="ถ้ามี"></label>
        <label class="md:col-span-2"><span class="text-slate-700 after:text-red-600 after:content-['*']">ชื่อครุภัณฑ์</span><input v-model.trim="form.name" required maxlength="255"></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">หมวด</span><select v-model="form.categoryId" required><option value="" disabled>เลือกหมวด</option><option v-for="item in references?.categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">หน่วยนับ</span><select v-model="form.unitId" required><option value="" disabled>เลือกหน่วย</option><option v-for="item in references?.units" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">สถานที่</span><select v-model="form.locationId" required><option value="" disabled>เลือกสถานที่</option><option v-for="item in references?.locations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label>ผู้รับผิดชอบ<select v-model="form.responsiblePersonId"><option value="">ไม่ระบุ</option><option v-for="item in references?.people" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label>แหล่งงบประมาณ<select v-model="form.fundingSourceId"><option value="">ไม่ระบุ</option><option v-for="item in references?.fundingSources" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">จำนวน</span><input v-model.number="form.quantity" type="number" min="1" step="1" required></label>
        <label>ยี่ห้อ<input v-model.trim="form.brand" maxlength="255"></label><label>รุ่น<input v-model.trim="form.model" maxlength="255"></label>
        <label>Serial number<input v-model.trim="form.serialNumber" maxlength="255"></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">วันที่รับ</span><input v-model="form.receivedDate" type="date" required></label>
        <label><span class="text-slate-700 after:text-red-600 after:content-['*']">ราคา (บาท)</span><input v-model.number="form.price" type="number" min="0" step="0.01" required></label>
        <label class="md:col-span-2">หมายเหตุ<textarea v-model.trim="form.notes" maxlength="2000" /></label>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><NuxtLink to="/assets" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">ยกเลิก</NuxtLink><button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" type="submit">{{ pending ? 'กำลังบันทึก…' : 'บันทึกครุภัณฑ์' }}</button></div>
    </form>
  </AppState>
</template>
