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
  ['ภาพรวม', '/', 'i-lucide-layout-dashboard'], ['ครุภัณฑ์', '/assets', 'i-lucide-package'], ['บุคคล', '/people', 'i-lucide-users'],
  ['ยืม–คืน', '/loans', 'i-lucide-arrow-left-right'], ['แจ้งซ่อม', '/repairs', 'i-lucide-wrench'], ['ย้าย', '/transfers', 'i-lucide-route'],
  ['ตรวจนับ', '/inspections', 'i-lucide-clipboard-check'], ['จำหน่าย', '/disposals', 'i-lucide-trash-2'], ['นำเข้าข้อมูล', '/imports', 'i-lucide-file-up'],
  ['รายงาน', '/reports', 'i-lucide-file-chart-column'], ['Audit log', '/audit', 'i-lucide-history'], ['ตั้งค่า', '/settings', 'i-lucide-settings'],
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <aside class="fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 md:translate-x-0" :class="{ '!translate-x-0': mobileOpen }">
      <NuxtLink to="/" class="flex items-center gap-3"><span class="grid size-11 place-items-center rounded-xl bg-teal-700 font-extrabold text-white">CS</span><span><strong>Asset</strong><small>ครุภัณฑ์วิทยาการคอมพิวเตอร์</small></span></NuxtLink>
      <nav class="grid gap-1 overflow-y-auto mt-10" aria-label="เมนูหลัก">
        <NuxtLink v-for="item in nav" :key="item[1]" :to="item[1]" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" :class="{ '!bg-teal-50 !text-teal-800 dark:!bg-teal-950 dark:!text-teal-300': item[1] === '/' ? route.path === '/' : route.path.startsWith(item[1]) }">
          <UIcon :name="item[2]" class="size-5 shrink-0" aria-hidden="true" />{{ item[0] }}
        </NuxtLink>
      </nav>
      <div class="mt-auto flex items-center gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800"><span class="grid size-9 place-items-center rounded-full bg-teal-100 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">ผด</span><span><strong class="block">ผู้ดูแลระบบ</strong><small class="block text-slate-500">Admin</small></span><button class="ml-auto grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" :title="colorModeLabel" :aria-label="colorModeLabel" @click="toggleColorMode"><UIcon :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-5" /></button><button class="grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="ออกจากระบบ" aria-label="ออกจากระบบ" @click="logout"><UIcon name="i-lucide-log-out" class="size-5" /></button></div>
    </aside>
    <div v-if="mobileOpen" class="fixed inset-0 z-20 bg-slate-950/40 md:hidden" @click="mobileOpen = false" />
    <main class="min-h-screen px-4 pb-16 pt-20 md:ml-64 md:px-10 md:pt-10 xl:px-16">
      <div class="fixed inset-x-0 top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:hidden"><button class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label="เปิดเมนู" @click="mobileOpen = true"><UIcon name="i-lucide-menu" class="size-5" /></button><strong>CS Asset</strong><div class="flex gap-1"><button class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" :aria-label="colorModeLabel" @click="toggleColorMode"><UIcon :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-5" /></button><NuxtLink to="/assets" class="grid size-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label="ค้นหา"><UIcon name="i-lucide-search" class="size-5" /></NuxtLink></div></div>
      <slot />
    </main>
  </div>
</template>
