<script setup lang="ts">
defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  error?: unknown
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
}>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="status === 'pending'" class="flex min-h-44 items-center justify-center gap-3 p-8 text-center text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
    <UIcon name="i-lucide-loader-circle" class="size-7 animate-spin text-teal-700" aria-hidden="true" />
    <p>กำลังโหลดข้อมูล…</p>
  </div>
  <div v-else-if="status === 'error'" class="flex min-h-44 items-center justify-center gap-3 p-8 text-center text-red-700 dark:text-red-400" role="alert">
    <span class="grid size-10 place-items-center rounded-full bg-red-50 dark:bg-red-950"><UIcon name="i-lucide-circle-alert" class="size-6" /></span>
    <div>
      <strong>ไม่สามารถโหลดข้อมูลได้</strong>
      <p>{{ (error as any)?.data?.message || (error as any)?.message || 'กรุณาลองใหม่อีกครั้ง' }}</p>
      <button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" type="button" @click="$emit('retry')"><UIcon name="i-lucide-refresh-cw" class="size-4" />ลองใหม่</button>
    </div>
  </div>
  <div v-else-if="empty" class="flex min-h-44 items-center justify-center gap-3 p-8 text-center text-slate-500 dark:text-slate-400">
    <span class="grid size-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"><UIcon name="i-lucide-inbox" class="size-6" /></span>
    <div>
      <strong>{{ emptyTitle || 'ยังไม่มีข้อมูล' }}</strong>
      <p>{{ emptyDescription || 'เมื่อมีข้อมูล รายการจะแสดงที่นี่' }}</p>
      <slot name="action" />
    </div>
  </div>
  <slot v-else />
</template>
