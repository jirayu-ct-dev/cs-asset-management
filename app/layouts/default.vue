<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)
const toast = useToast()
const colorMode = useColorMode()
const colorModeLabel = computed(() => colorMode.value === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด')
const toggleColorMode = () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' }
watch(() => route.fullPath, () => { mobileOpen.value = false })
const logout = async () => {
  try { await $fetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/login') }
  catch { toast.add({ title: 'ออกจากระบบไม่สำเร็จ', description: 'กรุณาลองใหม่', color: 'error' }) }
}
const nav: Array<[string, string, string]> = [
  ['ภาพรวม', '/', '▦'], ['ครุภัณฑ์', '/assets', '▣'], ['บุคคล', '/people', '♙'],
  ['ยืม–คืน', '/loans', '⇄'], ['แจ้งซ่อม', '/repairs', '⌁'], ['ย้าย', '/transfers', '↗'],
  ['ตรวจนับ', '/inspections', '✓'], ['จำหน่าย', '/disposals', '⊘'], ['นำเข้าข้อมูล', '/imports', '⇧'],
  ['รายงาน', '/reports', '▤'], ['Audit log', '/audit', '◷'], ['ตั้งค่า', '/settings', '⚙'],
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <aside class="fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 md:translate-x-0" :class="{ '!translate-x-0': mobileOpen }">
      <NuxtLink to="/" class="flex items-center gap-3"><span class="grid size-11 place-items-center rounded-xl bg-teal-700 font-extrabold text-white">CS</span><span><strong>Asset</strong><small>ครุภัณฑ์วิทยาการคอมพิวเตอร์</small></span></NuxtLink>
      <nav class="grid gap-1 overflow-y-auto" aria-label="เมนูหลัก">
        <NuxtLink v-for="item in nav" :key="item[1]" :to="item[1]" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" :class="{ '!bg-teal-50 !text-teal-800 dark:!bg-teal-950 dark:!text-teal-300': item[1] === '/' ? route.path === '/' : route.path.startsWith(item[1]) }">
          <span class="w-5 text-center text-lg">{{ item[2] }}</span>{{ item[0] }}
        </NuxtLink>
      </nav>
      <div class="mt-auto flex items-center gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800"><span class="grid size-9 place-items-center rounded-full bg-teal-100 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">ผด</span><span><strong class="block">ผู้ดูแลระบบ</strong><small class="block text-slate-500">Admin</small></span><button class="ml-auto rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" :title="colorModeLabel" :aria-label="colorModeLabel" @click="toggleColorMode">{{ colorMode.value === 'dark' ? '☀' : '☾' }}</button><button class="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="ออกจากระบบ" @click="logout">↪</button></div>
    </aside>
    <div v-if="mobileOpen" class="fixed inset-0 z-20 bg-slate-950/40 md:hidden" @click="mobileOpen = false" />
    <main class="min-h-screen px-4 pb-16 pt-20 md:ml-64 md:px-10 md:pt-10 xl:px-16">
      <div class="fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden"><button class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label="เปิดเมนู" @click="mobileOpen = true">☰</button><strong>CS Asset</strong><div class="flex gap-1"><button class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" :aria-label="colorModeLabel" @click="toggleColorMode">{{ colorMode.value === 'dark' ? '☀' : '☾' }}</button><NuxtLink to="/assets" class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label="ค้นหา">⌕</NuxtLink></div></div>
      <slot />
    </main>
  </div>
</template>
