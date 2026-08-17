<script setup lang="ts">
const props = defineProps<{ value?: string | null }>()
const labels: Record<string, string> = {
  ACTIVE: 'ใช้งาน', PROPOSED_FOR_DISPOSAL: 'เสนอจำหน่าย', DISPOSED: 'จำหน่ายแล้ว',
  AVAILABLE: 'พร้อมใช้', BORROWED: 'ถูกยืม', IN_REPAIR: 'กำลังซ่อม', MISSING: 'ไม่พบ',
  NORMAL: 'ปกติ', DAMAGED_USABLE: 'ชำรุดแต่ใช้ได้', UNUSABLE: 'ใช้งานไม่ได้',
  OPEN: 'เปิดอยู่', CLOSED: 'ปิดแล้ว', OVERDUE: 'เกินกำหนด', RETURNED: 'คืนแล้ว',
  PENDING: 'รอดำเนินการ', COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก',
}
const tone = computed(() => {
  if (['AVAILABLE', 'ACTIVE', 'NORMAL', 'COMPLETED', 'RETURNED'].includes(props.value || '')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  if (['OVERDUE', 'UNUSABLE', 'MISSING', 'CANCELLED'].includes(props.value || '')) return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
  if (['BORROWED', 'IN_REPAIR', 'DAMAGED_USABLE', 'PENDING', 'PROPOSED_FOR_DISPOSAL'].includes(props.value || '')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
})
</script>

<template><span class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold" :class="tone">{{ labels[value || ''] || value || '—' }}</span></template>
