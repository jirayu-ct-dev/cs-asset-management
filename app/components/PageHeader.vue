<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <header class="mb-7 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
    <div>
      <p class="m-0 text-xs font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-400">ระบบจัดการครุภัณฑ์</p>
      <h1 class="my-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ title }}</h1>
      <p v-if="description" class="m-0 text-sm text-slate-500 dark:text-slate-400">{{ description }}</p>
    </div>
    <div class="flex w-full flex-wrap items-center gap-2 md:w-auto"><slot /></div>
  </header>
</template>
