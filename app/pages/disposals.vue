<template><ResourceList
endpoint="/api/disposals" title="การจำหน่าย" description="ข้อเสนอ หลักฐาน และรายการที่จำหน่ายแล้ว" create-label="เสนอจำหน่าย" create-to="/workflows/disposals/create" empty-title="ยังไม่มีรายการจำหน่าย" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์' }, { key: 'asset.name', label: 'รายการ' }, { key: 'proposedAt', label: 'วันที่เสนอ', type: 'date' }, { key: 'reason', label: 'เหตุผล' }, { key: 'method', label: 'วิธีจำหน่าย' }, { key: 'status', label: 'สถานะ', type: 'status' },
]" /></template>
