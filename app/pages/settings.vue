<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const tabs = ['locations', 'categories', 'units', 'funding-sources', 'admins', 'password'] as const
const labels: Record<string, string> = { locations: 'ห้อง/สถานที่', categories: 'หมวด', units: 'หน่วยนับ', 'funding-sources': 'แหล่งงบประมาณ', admins: 'บัญชีผู้ดูแล', password: 'เปลี่ยนรหัสผ่าน' }
const active = ref<typeof tabs[number]>('locations')
const toast = useToast()
const { data: references, status, error, refresh } = useFetch<any>('/api/references')
const { data: admins, refresh: refreshAdmins } = useFetch<any>('/api/settings/admins')
const items = computed<any[]>(() => {
  if (active.value === 'admins') return admins.value?.items || admins.value || []
  if (active.value === 'password') return []
  const key = active.value === 'funding-sources' ? 'fundingSources' : active.value
  return references.value?.[key] || []
})
const password = reactive({ currentPassword: '', newPassword: '' })
const admin = reactive({ name: '', email: '', password: '' })
const reference = reactive({ code: '', name: '', sortOrder: 0, isActive: true })
const changePassword = async () => {
  if (!password.currentPassword || password.newPassword.length < 12) { toast.add({ title: 'ยังเปลี่ยนรหัสผ่านไม่ได้', description: 'กรอกรหัสเดิมและรหัสใหม่อย่างน้อย 12 ตัวอักษร', color: 'warning' }); return }
  try { await $fetch('/api/auth/password', { method: 'PATCH', body: password }); password.currentPassword = ''; password.newPassword = ''; toast.add({ title: 'เปลี่ยนรหัสผ่านแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const createAdmin = async () => {
  if (!admin.name || !admin.email || admin.password.length < 12) { toast.add({ title: 'ข้อมูลยังไม่ครบ', description: 'กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 12 ตัวอักษร', color: 'warning' }); return }
  try { await $fetch('/api/settings/admins', { method: 'POST', body: admin }); Object.assign(admin, { name: '', email: '', password: '' }); await refreshAdmins(); toast.add({ title: 'เพิ่มผู้ดูแลแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'เพิ่มผู้ดูแลไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const toggleAdmin = async (item: any) => {
  try { await $fetch(`/api/settings/admins/${item.id}`, { method: 'PATCH', body: { isActive: !item.isActive } }); await refreshAdmins(); toast.add({ title: 'อัปเดตสถานะแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'อัปเดตไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const createReference = async () => {
  if (!reference.code.trim() || !reference.name.trim()) { toast.add({ title: 'ข้อมูลยังไม่ครบ', description: 'กรอกรหัสและชื่อก่อนบันทึก', color: 'warning' }); return }
  try { await $fetch(`/api/references/${active.value}`, { method: 'POST', body: reference }); Object.assign(reference, { code: '', name: '', sortOrder: 0, isActive: true }); await refresh(); toast.add({ title: 'เพิ่มข้อมูลอ้างอิงแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'เพิ่มข้อมูลไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const editReference = async (item: any) => {
  const name = window.prompt('ชื่อ', item.name)?.trim()
  const code = window.prompt('รหัส', item.code)?.trim()
  if (!name || !code) { toast.add({ title: 'ยังแก้ไขไม่ได้', description: 'รหัสและชื่อต้องไม่ว่าง', color: 'warning' }); return }
  try { await $fetch(`/api/references/${active.value}/${item.id}`, { method: 'PATCH', body: { name, code } }); await refresh(); toast.add({ title: 'แก้ไขข้อมูลแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'แก้ไขไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const deactivateReference = async (item: any) => {
  if (!item.isActive) { toast.add({ title: 'รายการปิดใช้งานอยู่แล้ว', color: 'warning' }); return }
  try { await $fetch(`/api/references/${active.value}/${item.id}`, { method: 'PATCH', body: { isActive: false } }); await refresh(); toast.add({ title: 'ปิดใช้งานแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'ปิดใช้งานไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
</script>

<template>
  <div>
    <PageHeader title="ตั้งค่า" description="จัดการข้อมูลอ้างอิง บัญชีผู้ดูแล และความปลอดภัย" />
    <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 p-5 dark:border-slate-800"><button v-for="tab in tabs" :key="tab" class="inline-flex min-h-10 items-center rounded-lg border px-3 py-2 font-bold" :class="active === tab ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 dark:border-slate-700'" @click="active = tab">{{ labels[tab] }}</button></div>
      <form v-if="active === 'password'" class="grid gap-4 p-5 md:max-w-xl" @submit.prevent="changePassword"><label>รหัสผ่านปัจจุบัน<input v-model="password.currentPassword" type="password" autocomplete="current-password"></label><label>รหัสผ่านใหม่<input v-model="password.newPassword" type="password" autocomplete="new-password"></label><button class="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-4 font-bold text-white">เปลี่ยนรหัสผ่าน</button></form>
      <div v-else-if="active === 'admins'" class="grid gap-5 p-5"><form class="grid gap-3 md:grid-cols-4" @submit.prevent="createAdmin"><label>ชื่อ<input v-model="admin.name" required></label><label>อีเมล<input v-model="admin.email" type="email" required></label><label>รหัสผ่านเริ่มต้น<input v-model="admin.password" type="password" required></label><button class="mt-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-4 font-bold text-white">เพิ่มผู้ดูแล</button></form><div class="overflow-x-auto"><table><thead><tr><th>ชื่อ</th><th>อีเมล</th><th>สถานะ</th><th>ดำเนินการ</th></tr></thead><tbody><tr v-for="item in items" :key="item.id"><td>{{ item.name }}</td><td>{{ item.email }}</td><td><StatusBadge :value="item.isActive ? 'ACTIVE' : 'CANCELLED'" /></td><td><button class="rounded-lg border border-slate-300 px-3 py-2 font-bold dark:border-slate-700" @click="toggleAdmin(item)">{{ item.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}</button></td></tr></tbody></table></div></div>
      <div v-else><form class="grid gap-3 border-b border-slate-200 p-5 md:grid-cols-4 dark:border-slate-800" @submit.prevent="createReference"><label>รหัส<input v-model="reference.code" required></label><label>ชื่อ<input v-model="reference.name" required></label><label>ลำดับ<input v-model.number="reference.sortOrder" type="number"></label><button class="mt-auto min-h-10 rounded-lg bg-teal-700 px-4 font-bold text-white">เพิ่มข้อมูล</button></form><AppState :status="status" :error="error" :empty="!items.length" :empty-title="`ยังไม่มี${labels[active]}`" @retry="refresh"><div class="overflow-x-auto"><table><thead><tr><th>ชื่อ</th><th>รหัส</th><th>สถานะ</th><th>ดำเนินการ</th></tr></thead><tbody><tr v-for="item in items" :key="item.id"><td><strong>{{ item.name }}</strong></td><td>{{ item.code || '—' }}</td><td><StatusBadge :value="item.isActive === false ? 'CANCELLED' : 'ACTIVE'" /></td><td><div class="flex gap-2"><button class="rounded-lg border border-slate-300 px-3 py-2 font-bold" @click="editReference(item)">แก้ไข</button><button class="rounded-lg border border-red-200 px-3 py-2 font-bold text-red-700" @click="deactivateReference(item)">ปิดใช้งาน</button></div></td></tr></tbody></table></div></AppState></div>
    </section>
  </div>
</template>
