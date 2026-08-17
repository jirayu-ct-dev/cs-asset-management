<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Option { id: string, name: string }

const route = useRoute()
const id = String(route.params.id)
const toast = useToast()
const { data: asset, status, error, refresh } = useFetch<any>(`/api/assets/${id}`)
const { data: references } = useFetch<Record<string, Option[]>>('/api/references')
const form = reactive({
  assetNumber: '',
  internalCode: '',
  name: '',
  categoryId: '',
  unitId: '',
  fundingSourceId: '',
  quantity: 1,
  brand: '',
  model: '',
  serialNumber: '',
  receivedDate: '',
  price: 0,
  notes: '',
})
const pending = ref(false)
const submitError = ref('')

watch(asset, (value) => {
  if (!value) return
  Object.assign(form, {
    assetNumber: value.assetNumber || '',
    internalCode: value.internalCode || '',
    name: value.name || '',
    categoryId: value.categoryId || '',
    unitId: value.unitId || '',
    fundingSourceId: value.fundingSourceId || '',
    quantity: value.quantity || 1,
    brand: value.brand || '',
    model: value.model || '',
    serialNumber: value.serialNumber || '',
    receivedDate: value.acquisitionDate ? new Date(value.acquisitionDate).toISOString().slice(0, 10) : '',
    price: Number(value.price || 0),
    notes: value.notes || '',
  })
}, { immediate: true })

const submit = async () => {
  if (pending.value) {
    toast.add({ title: 'กำลังบันทึกข้อมูล', description: 'กรุณารอคำขอปัจจุบัน', color: 'warning' })
    return
  }
  pending.value = true
  submitError.value = ''
  try {
    await $fetch(`/api/assets/${id}`, { method: 'PATCH', body: form })
    toast.add({ title: 'แก้ไขครุภัณฑ์แล้ว', color: 'success' })
    await navigateTo(`/assets/${id}`)
  } catch (error: any) {
    submitError.value = error?.data?.message || error?.statusMessage || 'บันทึกการแก้ไขไม่สำเร็จ'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="แก้ไขครุภัณฑ์" :description="asset?.assetNumber">
      <NuxtLink :to="`/workflows/transfers/create?assetId=${id}`" class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700"><UIcon name="i-lucide-route" class="size-4" />ย้ายสถานที่/ผู้รับผิดชอบ</NuxtLink>
    </PageHeader>
    <AppState :status="status" :error="error" @retry="refresh">
      <form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" @submit.prevent="submit">
        <div v-if="submitError" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{{ submitError }}</div>
        <div class="grid gap-4 md:grid-cols-2">
          <label>หมายเลขครุภัณฑ์<input v-model.trim="form.assetNumber" required maxlength="100"></label>
          <label>รหัสภายใน<input v-model.trim="form.internalCode" maxlength="255"></label>
          <label class="md:col-span-2">ชื่อครุภัณฑ์<input v-model.trim="form.name" required maxlength="255"></label>
          <label>หมวด<select v-model="form.categoryId" required><option value="">เลือกหมวด</option><option v-for="item in references?.categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>หน่วยนับ<select v-model="form.unitId" required><option value="">เลือกหน่วย</option><option v-for="item in references?.units" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>แหล่งงบประมาณ<select v-model="form.fundingSourceId"><option value="">ไม่ระบุ</option><option v-for="item in references?.fundingSources" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label>จำนวน<input v-model.number="form.quantity" type="number" min="1" step="1" required></label>
          <label>ยี่ห้อ<input v-model.trim="form.brand" maxlength="255"></label>
          <label>รุ่น<input v-model.trim="form.model" maxlength="255"></label>
          <label>Serial number<input v-model.trim="form.serialNumber" maxlength="255"></label>
          <label>วันที่รับ<input v-model="form.receivedDate" type="date" required></label>
          <label>ราคา (บาท)<input v-model.number="form.price" type="number" min="0" step="0.01" required></label>
          <label class="md:col-span-2">หมายเหตุ<textarea v-model.trim="form.notes" maxlength="2000" /></label>
        </div>
        <div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          <NuxtLink :to="`/assets/${id}`" class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700"><UIcon name="i-lucide-x" class="size-4" />ยกเลิก</NuxtLink>
          <button class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 font-bold text-white hover:bg-teal-800" type="submit"><UIcon name="i-lucide-save" class="size-4" />{{ pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข' }}</button>
        </div>
      </form>
    </AppState>
  </div>
</template>
