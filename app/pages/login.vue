<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
definePageMeta({ layout: 'auth' })
const route = useRoute()
const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const toast = useToast()
const { fetch: refreshSession } = useUserSession()
const login = async () => {
  if (pending.value) {
    toast.add({ title: 'กำลังเข้าสู่ระบบ', description: 'กรุณารอให้คำขอปัจจุบันเสร็จสิ้น', color: 'warning' })
    return
  }
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//') ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  } finally { pending.value = false }
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 w-full max-w-md p-8">
    <div class="flex items-center gap-3"><span class="grid size-11 place-items-center rounded-xl bg-teal-700 font-extrabold text-white">CS</span><span><strong>Asset Management</strong><small>สาขาวิทยาการคอมพิวเตอร์</small></span></div>
    <h1>เข้าสู่ระบบผู้ดูแล</h1><p class="text-sm text-slate-500 dark:text-slate-400">ใช้บัญชีที่ได้รับอนุญาตเพื่อจัดการครุภัณฑ์</p>
    <form @submit.prevent="login">
      <div v-if="errorMessage" class="rounded-lg p-3 text-sm bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">{{ errorMessage }}</div>
      <label><span class="text-slate-700 after:text-red-600 after:content-['*']">อีเมล</span><input v-model="email" type="email" autocomplete="username" required placeholder="admin@example.ac.th"></label>
      <label><span class="text-slate-700 after:text-red-600 after:content-['*']">รหัสผ่าน</span><input v-model="password" type="password" autocomplete="current-password" required placeholder="กรอกรหัสผ่าน"></label>
      <button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500" type="submit">{{ pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}</button>
    </form>
  </section>
</template>
