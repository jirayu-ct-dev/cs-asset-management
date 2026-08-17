<template><ResourceList
endpoint="/api/disposals" title="การจำหน่าย" description="ข้อเสนอ หลักฐาน และรายการที่จำหน่ายแล้ว" create-label="เสนอจำหน่าย" create-to="/workflows/disposals/create" empty-title="ยังไม่มีรายการจำหน่าย" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์', sortable: true }, { key: 'asset.name', label: 'รายการ', sortable: true }, { key: 'proposedAt', label: 'วันที่เสนอ', type: 'date', sortable: true }, { key: 'reason', label: 'เหตุผล', sortable: true }, { key: 'method', label: 'วิธีจำหน่าย', sortable: true }, { key: 'status', label: 'สถานะ', type: 'status', sortable: true },
]" /></template>
