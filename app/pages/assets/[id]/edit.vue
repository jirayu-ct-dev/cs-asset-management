<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const route = useRoute()
const id = String(route.params.id)
const { data: asset, status, error, refresh } = useFetch<any>(`/api/assets/${id}`)
const form = reactive({ name: '', brand: '', model: '', serialNumber: '', notes: '' })
watch(asset, value => { if (value) Object.assign(form, { name: value.name || '', brand: value.brand || '', model: value.model || '', serialNumber: value.serialNumber || '', notes: value.notes || '' }) }, { immediate: true })
const pending = ref(false)
const submitError = ref('')
const toast = useToast()
const submit = async () => {
  if (pending.value) { toast.add({ title: 'กำลังบันทึกข้อมูล', description: 'กรุณารอคำขอปัจจุบัน', color: 'warning' }); return }
  pending.value = true; submitError.value = ''
  try { await $fetch(`/api/assets/${id}`, { method: 'PATCH', body: form }); await navigateTo(`/assets/${id}`) }
  catch (error: any) { submitError.value = error?.data?.message || 'บันทึกการแก้ไขไม่สำเร็จ' }
  finally { pending.value = false }
}
</script>

<template><div><PageHeader title="แก้ไขครุภัณฑ์" :description="asset?.assetNumber"><NuxtLink :to="`/workflows/transfers/create?assetId=${id}`" class="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700">ย้ายสถานที่/ผู้รับผิดชอบ</NuxtLink></PageHeader><AppState :status="status" :error="error" @retry="refresh"><form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" @submit.prevent="submit"><div v-if="submitError" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{{ submitError }}</div><div class="grid gap-4 md:grid-cols-2"><label class="md:col-span-2">ชื่อครุภัณฑ์<input v-model.trim="form.name" required maxlength="255"></label><label>ยี่ห้อ<input v-model.trim="form.brand"></label><label>รุ่น<input v-model.trim="form.model"></label><label>Serial number<input v-model.trim="form.serialNumber"></label><label class="md:col-span-2">หมายเหตุ<textarea v-model.trim="form.notes" maxlength="2000" /></label></div><div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800"><NuxtLink :to="`/assets/${id}`" class="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700">ยกเลิก</NuxtLink><button class="inline-flex min-h-10 items-center rounded-lg bg-teal-700 px-4 font-bold text-white">{{ pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข' }}</button></div></form></AppState></div></template>
