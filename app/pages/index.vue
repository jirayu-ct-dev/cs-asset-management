<script setup lang="ts">
/* eslint-disable vue/no-multiple-template-root */
interface DashboardData {
  total?: number
  available?: number
  borrowed?: number
  overdue?: number
  damaged?: number
  inRepair?: number
  counts?: Record<string, number>
  pendingTasks?: Array<{ id: string, title: string, detail?: string, dueDate?: string, type?: string }>
  recentEvents?: Array<{ id: string, title: string, description?: string, createdAt: string }>
}
const { data, status, error, refresh } = useFetch<DashboardData>('/api/dashboard')
const { formatThaiDate } = useThaiDate()
const cards = computed(() => {
  const counts: Record<string, number> = data.value?.counts ?? {
    total: data.value?.total ?? 0,
    available: data.value?.available ?? 0,
    borrowed: data.value?.borrowed ?? 0,
    overdue: data.value?.overdue ?? 0,
    damaged: data.value?.damaged ?? 0,
    inRepair: data.value?.inRepair ?? 0,
  }
  return [
    ['ครุภัณฑ์ทั้งหมด', counts.total ?? 0, 'รายการในทะเบียน'],
    ['พร้อมใช้งาน', counts.available ?? 0, 'พร้อมยืมและใช้งาน'],
    ['กำลังถูกยืม', counts.borrowed ?? 0, `${counts.overdue ?? 0} รายการเกินกำหนด`],
    ['ชำรุด / ซ่อม', (counts.damaged ?? 0) + (counts.inRepair ?? 0), 'รายการที่ต้องติดตาม'],
  ]
})
</script>

<template>
  <PageHeader title="ภาพรวม" description="สถานะทะเบียนและงานที่ต้องดำเนินการล่าสุด">
    <NuxtLink to="/assets/create" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"><UIcon name="i-lucide-plus" class="size-4" />เพิ่มครุภัณฑ์</NuxtLink>
  </PageHeader>
  <AppState :status="status" :error="error" @retry="refresh">
    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article v-for="card in cards" :key="card[0]" class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4"><span class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ card[0] }}</span><strong class="my-2 block text-3xl font-extrabold tracking-tight">{{ Number(card[1]).toLocaleString('th-TH') }}</strong><span class="text-xs text-slate-500 dark:text-slate-400">{{ card[2] }}</span></article>
    </div>
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_.8fr]">
      <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>งานที่ต้องดำเนินการ</h2><NuxtLink to="/loans" class="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline dark:text-teal-400">ดูทั้งหมด<UIcon name="i-lucide-arrow-right" class="size-4" /></NuxtLink></div>
        <AppState status="success" :empty="!data?.pendingTasks?.length" empty-title="ไม่มีงานค้าง"><div class="overflow-x-auto"><table><tbody><tr v-for="task in data?.pendingTasks" :key="task.id"><td><strong>{{ task.title }}</strong><div class="text-sm text-slate-500 dark:text-slate-400">{{ task.detail }}</div></td><td><StatusBadge :value="task.type" /></td><td>{{ formatThaiDate(task.dueDate) }}</td></tr></tbody></table></div></AppState>
      </section>
      <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>กิจกรรมล่าสุด</h2></div><div class="p-5">
        <AppState status="success" :empty="!data?.recentEvents?.length" empty-title="ยังไม่มีกิจกรรม"><ol class="relative grid list-none gap-4 p-0"><li v-for="event in data?.recentEvents" :key="event.id"><strong>{{ event.title }}</strong><p>{{ event.description }}</p><time>{{ formatThaiDate(event.createdAt, true) }}</time></li></ol></AppState>
      </div></section>
    </div>
  </AppState>
</template>
