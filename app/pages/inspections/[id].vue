<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
const route = useRoute()
const id = String(route.params.id)
const query = ref('')
const { data: round, status, error, refresh } = useFetch<any>(`/api/inspections/${id}`)
const { data: references } = useFetch<any>('/api/references')
const items = computed(() => (round.value?.items || []).filter((item: any) => !query.value || `${item.snapshotAssetNumber} ${item.snapshotName}`.toLocaleLowerCase('th-TH').includes(query.value.toLocaleLowerCase('th-TH'))))
const summary = computed(() => {
  const all = round.value?.items || []
  const inspected = all.filter((item: any) => item.result).length
  const abnormal = all.filter((item: any) => item.result && item.result !== 'FOUND_OK').length
  return { total: all.length, inspected, pending: all.length - inspected, abnormal }
})
const progress = computed(() => summary.value.total ? Math.round(summary.value.inspected / summary.value.total * 100) : 0)
const drafts = reactive<Record<string, any>>({})
const toast = useToast()
const closing = ref(false)
const draftFor = (item: any) => drafts[item.id] ||= {
  result: item.result || '', actualLocationId: item.actualLocationId || item.snapshotLocationId || '',
  observedCondition: item.actualCondition || item.snapshotCondition || '', notes: item.notes || '',
}
const saveResult = async (item: any) => {
  const draft = draftFor(item)
  if (round.value?.status === 'CLOSED') { toast.add({ title: 'แก้ไขผลไม่ได้', description: 'รอบตรวจถูกปิดแล้วและเป็นประวัติถาวร', color: 'warning' }); return }
  if (!draft.result) { toast.add({ title: 'ยังบันทึกไม่ได้', description: 'กรุณาเลือกผลตรวจนับก่อน', color: 'warning' }); return }
  try { await $fetch(`/api/inspections/${id}/items/${item.assetId}`, { method: 'PUT', body: draft }); await refresh(); toast.add({ title: 'บันทึกผลตรวจแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'บันทึกผลตรวจไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const resetResult = async (item: any) => {
  if (round.value?.status === 'CLOSED') { toast.add({ title: 'รีเซ็ตผลไม่ได้', description: 'รอบตรวจถูกปิดแล้วและเป็นประวัติถาวร กรุณาเปิดรอบใหม่หากต้องตรวจซ้ำ', color: 'warning' }); return }
  if (!item.result) { toast.add({ title: 'ยังรีเซ็ตไม่ได้', description: 'รายการนี้ยังไม่มีผลตรวจที่บันทึกไว้', color: 'warning' }); return }
  const reason = window.prompt('ระบุเหตุผลที่รีเซ็ตผลตรวจ')?.trim()
  if (!reason) { toast.add({ title: 'ยังรีเซ็ตไม่ได้', description: 'ต้องระบุเหตุผลเพื่อบันทึก Audit log', color: 'warning' }); return }
  try {
    await ($fetch as any)(`/api/inspections/${id}/items/${item.assetId}/reset`, { method: 'POST', body: { reason } })
    drafts[item.id] = { result: '', actualLocationId: item.snapshotLocationId || '', observedCondition: item.snapshotCondition || '', notes: '' }
    await refresh()
    toast.add({ title: 'รีเซ็ตผลตรวจแล้ว', color: 'success' })
  } catch (error: any) { toast.add({ title: 'รีเซ็ตผลตรวจไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
}
const closeRound = async () => {
  if (round.value?.status === 'CLOSED') { toast.add({ title: 'รอบตรวจปิดแล้ว', description: 'รอบที่ปิดแล้วไม่สามารถปิดซ้ำได้', color: 'warning' }); return }
  if (closing.value) { toast.add({ title: 'กำลังปิดรอบตรวจ', description: 'กรุณารอคำขอปัจจุบัน', color: 'warning' }); return }
  let confirm = false
  if (summary.value.pending || summary.value.abnormal) {
    confirm = window.confirm(`ยังไม่ตรวจ ${summary.value.pending} รายการ และผิดปกติ ${summary.value.abnormal} รายการ ยืนยันปิดรอบหรือไม่`)
    if (!confirm) { toast.add({ title: 'ยังไม่ได้ปิดรอบ', description: 'ตรวจสอบรายการคงค้างและผิดปกติก่อน', color: 'warning' }); return }
  }
  closing.value = true
  try { await $fetch(`/api/inspections/${id}/close`, { method: 'POST', body: { confirm } }); await refresh(); toast.add({ title: 'ปิดรอบตรวจแล้ว', color: 'success' }) }
  catch (error: any) { toast.add({ title: 'ปิดรอบตรวจไม่สำเร็จ', description: error?.data?.message || 'กรุณาลองใหม่', color: 'error' }) }
  finally { closing.value = false }
}
</script>

<template>
  <div>
    <PageHeader :title="round?.name || 'รอบตรวจนับ'" :description="round ? `ปีงบประมาณ ${round.fiscalYear}` : ''"><button class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-50 px-4 font-bold text-red-700" @click="closeRound"><UIcon name="i-lucide-lock" class="size-4" />{{ closing ? 'กำลังปิดรอบ…' : 'ปิดรอบตรวจ' }}</button></PageHeader>
    <AppState :status="status" :error="error" @retry="refresh">
      <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><article v-for="entry in [['ทั้งหมด', summary.total], ['ตรวจแล้ว', summary.inspected], ['ยังไม่ตรวจ', summary.pending], ['ความคืบหน้า', `${progress}%`]]" :key="entry[0]" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span class="text-sm text-slate-500">{{ entry[0] }}</span><strong class="mt-2 block text-3xl">{{ entry[1] }}</strong></article></div>
      <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="border-b border-slate-200 p-5 dark:border-slate-800"><input v-model="query" placeholder="สแกน QR หรือค้นหาหมายเลข…"></div>
        <div class="overflow-x-auto"><table><thead><tr><th>หมายเลข/รายการ</th><th>ผลตรวจ</th><th>สถานที่จริง</th><th>สภาพ</th><th>หมายเหตุ</th><th>ดำเนินการ</th></tr></thead><tbody>
          <tr v-for="item in items" :key="item.id">
            <td><strong>{{ item.snapshotAssetNumber }}</strong><br><span class="text-slate-500">{{ item.snapshotName }}</span></td>
            <td><select v-model="draftFor(item).result"><option value="">เลือกผลตรวจ</option><option value="FOUND_OK">พบ ใช้งานได้</option><option value="FOUND_DAMAGED">พบ ชำรุด</option><option value="REPAIR_REQUESTED">ขอซ่อม</option><option value="MISSING">ไม่พบ</option><option value="DISPOSAL_REQUESTED">ขอจำหน่าย</option><option value="OTHER">อื่น ๆ</option></select></td>
            <td><select v-model="draftFor(item).actualLocationId"><option value="">ไม่ระบุ</option><option v-for="location in references?.locations" :key="location.id" :value="location.id">{{ location.name }}</option></select></td>
            <td><select v-model="draftFor(item).observedCondition"><option value="">ไม่ระบุ</option><option value="NORMAL">ปกติ</option><option value="DAMAGED_USABLE">ชำรุดแต่ใช้ได้</option><option value="UNUSABLE">ใช้งานไม่ได้</option></select></td>
            <td><input v-model="draftFor(item).notes" placeholder="หมายเหตุ"></td>
            <td><div class="flex flex-nowrap gap-1"><button class="grid size-9 place-items-center rounded-lg bg-teal-700 text-white" title="บันทึกผล" aria-label="บันทึกผล" @click="saveResult(item)"><UIcon name="i-lucide-save" class="size-4" /></button><button class="grid size-9 place-items-center rounded-lg border border-amber-300 text-amber-700" title="รีเซ็ตผล" aria-label="รีเซ็ตผล" @click="resetResult(item)"><UIcon name="i-lucide-rotate-ccw" class="size-4" /></button></div></td>
          </tr>
        </tbody></table></div>
      </section>
    </AppState>
  </div>
</template>
