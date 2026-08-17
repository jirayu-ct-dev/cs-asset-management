<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const route = useRoute()
const id = String(route.params.id)
const toast = useToast()
const { data: person, status, error, refresh } = useFetch<any>(`/api/people/${id}`)
const form = reactive({ code: '', name: '', type: 'STAFF', department: '', phone: '', email: '', isActive: true })
const pending = ref(false)
const submitError = ref('')

watch(person, (value) => {
  if (!value) return
  Object.assign(form, {
    code: value.code || '',
    name: value.name || '',
    type: value.type || 'STAFF',
    department: value.department || '',
    phone: value.phone || '',
    email: value.email || '',
    isActive: value.isActive !== false,
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
    await $fetch(`/api/people/${id}`, {
      method: 'PATCH',
      body: {
        ...form,
        code: form.code || null,
        department: form.department || null,
        phone: form.phone || null,
        email: form.email || null,
      },
    })
    toast.add({ title: 'แก้ไขข้อมูลบุคคลแล้ว', color: 'success' })
    await navigateTo('/people')
  } catch (error: any) {
    submitError.value = error?.data?.message || error?.statusMessage || 'บันทึกการแก้ไขไม่สำเร็จ'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="แก้ไขข้อมูลบุคคล" :description="person?.name" />
    <AppState :status="status" :error="error" @retry="refresh">
      <form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" @submit.prevent="submit">
        <div v-if="submitError" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{{ submitError }}</div>
        <div class="grid gap-4 md:grid-cols-2">
          <label>ชื่อ–นามสกุล<input v-model.trim="form.name" required maxlength="255"></label>
          <label>รหัส<input v-model.trim="form.code" maxlength="100"></label>
          <label>ประเภท<select v-model="form.type" required><option value="STUDENT">นักศึกษา</option><option value="STAFF">บุคลากร</option><option value="EXTERNAL">บุคคลภายนอก</option></select></label>
          <label>หน่วยงาน<input v-model.trim="form.department" maxlength="255"></label>
          <label>โทรศัพท์<input v-model.trim="form.phone" maxlength="50"></label>
          <label>อีเมล<input v-model.trim="form.email" type="email" maxlength="254"></label>
        </div>
        <div class="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
          <NuxtLink to="/people" class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700"><UIcon name="i-lucide-x" class="size-4" />ยกเลิก</NuxtLink>
          <button class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 font-bold text-white hover:bg-teal-800" type="submit"><UIcon name="i-lucide-save" class="size-4" />{{ pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข' }}</button>
        </div>
      </form>
    </AppState>
  </div>
</template>
