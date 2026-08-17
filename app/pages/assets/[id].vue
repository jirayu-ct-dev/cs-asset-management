<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, vue/no-multiple-template-root */
const route = useRoute()
const id = String(route.params.id)
const { data: asset, status, error, refresh } = useFetch<any>(`/api/assets/${id}`)
const timeline = computed(() => asset.value?.events || [])
const { formatThaiDate } = useThaiDate()
const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
const toast = useToast()
const uploadAttachment = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !asset.value?.id) { toast.add({ title: 'ยังแนบไฟล์ไม่ได้', description: 'เลือกไฟล์และรอข้อมูลครุภัณฑ์ให้พร้อม', color: 'warning' }); return }
  const body = new FormData(); body.append('file', file)
  try { await $fetch(`/api/assets/${asset.value.id}/attachments`, { method: 'POST', body }); await refresh(); toast.add({ title: 'แนบไฟล์แล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'แนบไฟล์ไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const printQr = () => {
  if (!asset.value?.id) {
    toast.add({ title: 'ยังพิมพ์ QR ไม่ได้', description: 'กรุณารอข้อมูลครุภัณฑ์ให้โหลดเสร็จก่อน', color: 'warning' })
    return
  }
  window.print()
}
const quickAction = async (action: 'loan' | 'loan-state' | 'repair' | 'transfer' | 'disposal' | 'inspection') => {
  const current = asset.value
  if (!current) { toast.add({ title: 'ข้อมูลยังไม่พร้อม', description: 'กรุณารอให้โหลดข้อมูลเสร็จ', color: 'warning' }); return }
  const unavailable = (description: string) => toast.add({ title: 'ยังทำรายการไม่ได้', description, color: 'warning' })
  if (action === 'loan') {
    if (current.lifecycleStatus !== 'ACTIVE') return unavailable('ครุภัณฑ์ไม่ได้อยู่ในวงจรใช้งาน')
    if (current.custodyStatus !== 'AVAILABLE') return unavailable(`สถานะการครอบครองคือ ${current.custodyStatus}`)
    if (current.conditionStatus === 'UNUSABLE') return unavailable('ครุภัณฑ์อยู่ในสภาพใช้งานไม่ได้')
    return navigateTo(`/workflows/loans/create?assetId=${id}`)
  }
  if (action === 'loan-state') return navigateTo(`/loans?assetId=${id}`)
  if (action === 'repair') {
    if (current.lifecycleStatus === 'DISPOSED') return unavailable('ครุภัณฑ์จำหน่ายแล้ว')
    if (current.custodyStatus === 'BORROWED') return unavailable('ต้องรับคืนก่อนแจ้งซ่อม')
    if (current.custodyStatus === 'IN_REPAIR') return unavailable('มีงานซ่อมที่ยังไม่ปิดอยู่แล้ว')
    return navigateTo(`/workflows/repairs/create?assetId=${id}`)
  }
  if (action === 'transfer') {
    if (current.custodyStatus === 'BORROWED') return unavailable('ต้องรับคืนก่อนย้าย')
    if (current.lifecycleStatus === 'DISPOSED') return unavailable('ครุภัณฑ์จำหน่ายแล้วจึงย้ายไม่ได้')
    return navigateTo(`/workflows/transfers/create?assetId=${id}`)
  }
  if (action === 'disposal') {
    if (current.lifecycleStatus !== 'ACTIVE') return unavailable('รายการนี้ถูกเสนอจำหน่ายหรือจำหน่ายแล้ว')
    if (current.custodyStatus !== 'AVAILABLE') return unavailable('ต้องรับคืนหรือปิดงานซ่อมก่อนเสนอจำหน่าย')
    return navigateTo(`/workflows/disposals/create?assetId=${id}`)
  }
  if (current.lifecycleStatus === 'DISPOSED') return unavailable('ครุภัณฑ์จำหน่ายแล้วไม่อยู่ในขอบเขตตรวจนับ')
  return navigateTo('/inspections')
}
</script>

<template>
  <PageHeader :title="asset?.name || 'รายละเอียดครุภัณฑ์'" :description="asset?.assetNumber">
    <button class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" type="button" @click="printQr"><UIcon name="i-lucide-qr-code" class="size-4" />พิมพ์ QR</button><NuxtLink :to="`/assets/edit/${id}`" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 font-bold border-transparent bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"><UIcon name="i-lucide-pencil" class="size-4" />แก้ไข</NuxtLink>
  </PageHeader>
  <AppState :status="status" :error="error" @retry="refresh">
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_.8fr]">
      <div class="grid gap-4">
        <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>ข้อมูลปัจจุบัน</h2><div class="flex flex-wrap items-center gap-2"><StatusBadge :value="asset?.lifecycleStatus" /><StatusBadge :value="asset?.custodyStatus" /><StatusBadge :value="asset?.conditionStatus" /></div></div>
          <dl class="p-5 grid grid-cols-1 gap-5 md:grid-cols-2"><div><dt>หมายเลขครุภัณฑ์</dt><dd>{{ asset?.assetNumber }}</dd></div><div><dt>รหัสภายใน</dt><dd>{{ asset?.internalCode || '—' }}</dd></div><div><dt>หมวด</dt><dd>{{ asset?.category?.name || '—' }}</dd></div><div><dt>สถานที่</dt><dd>{{ asset?.location?.name || '—' }}</dd></div><div><dt>ผู้รับผิดชอบ</dt><dd>{{ asset?.responsiblePerson?.name || '—' }}</dd></div><div><dt>ยี่ห้อ / รุ่น</dt><dd>{{ [asset?.brand, asset?.model].filter(Boolean).join(' / ') || '—' }}</dd></div><div><dt>Serial number</dt><dd>{{ asset?.serialNumber || '—' }}</dd></div><div><dt>วันที่รับ</dt><dd>{{ formatThaiDate(asset?.acquisitionDate) }}</dd></div><div><dt>จำนวน</dt><dd>{{ asset?.quantity }} {{ asset?.unit?.name }}</dd></div><div><dt>ราคา</dt><dd>{{ money.format(Number(asset?.price || 0)) }}</dd></div></dl>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>ประวัติและ Timeline</h2></div><div class="p-5"><AppState status="success" :empty="!timeline.length" empty-title="ยังไม่มีประวัติ"><ol class="relative grid list-none gap-4 p-0"><li v-for="event in timeline" :key="event.id"><strong>{{ event.title || event.type }}</strong><p>{{ event.summary || event.description }}</p><time>{{ formatThaiDate(event.occurredAt || event.createdAt, true) }} · {{ event.actor?.name || 'ระบบ' }}</time></li></ol></AppState></div></section>
      </div>
      <aside class="grid content-start gap-4"><section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>QR Code</h2></div><div class="p-5"><div class="grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950"><img v-if="asset?.id" :src="`/api/assets/${asset.id}/qr`" :alt="`QR ${asset.assetNumber}`" class="max-w-44"><span v-else>กำลังเตรียม QR Code</span></div></div></section><section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><h2>งานด่วน</h2></div><div class="grid gap-2 p-5"><button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200" @click="quickAction(asset?.custodyStatus === 'BORROWED' ? 'loan-state' : 'loan')"><UIcon name="i-lucide-handshake" class="size-4" />{{ asset?.custodyStatus === 'BORROWED' ? 'รับคืน / ดูสถานะยืม' : 'บันทึกการยืม' }}</button><button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200" @click="quickAction('repair')"><UIcon name="i-lucide-wrench" class="size-4" />แจ้งชำรุด / ซ่อม</button><button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200" @click="quickAction('transfer')"><UIcon name="i-lucide-map-pin" class="size-4" />ย้ายสถานที่</button><button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200" @click="quickAction('disposal')"><UIcon name="i-lucide-trash-2" class="size-4" />เสนอจำหน่าย</button><button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200" @click="quickAction('inspection')"><UIcon name="i-lucide-clipboard-check" class="size-4" />ตรวจนับ</button></div></section><section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="border-b border-slate-200 p-5 font-bold dark:border-slate-800">ไฟล์แนบ</div><div class="grid gap-3 p-5"><input type="file" @change="uploadAttachment"><a v-for="file in asset?.attachments" :key="file.id" :href="`/api/attachments/${file.id}`" class="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:underline"><UIcon name="i-lucide-download" class="size-4" />{{ file.originalName }}</a><p v-if="!asset?.attachments?.length" class="text-sm text-slate-500">ยังไม่มีไฟล์แนบ</p></div></section></aside>
    </div>
  </AppState>
</template>
