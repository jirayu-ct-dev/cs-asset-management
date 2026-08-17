<template><ResourceList
endpoint="/api/repairs" title="แจ้งชำรุดและซ่อม" description="ติดตามอาการ การส่งซ่อม ผลซ่อม และค่าใช้จ่าย" create-label="แจ้งชำรุด" create-to="/workflows/repairs/create" empty-title="ยังไม่มีงานซ่อม" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์', sortable: true }, { key: 'asset.name', label: 'รายการ', sortable: true }, { key: 'reportedAt', label: 'วันที่แจ้ง', type: 'date', sortable: true }, { key: 'vendor', label: 'ร้านซ่อม', sortable: true }, { key: 'expectedBackAt', label: 'กำหนดรับ', type: 'date', sortable: true }, { key: 'cost', label: 'ค่าใช้จ่าย', type: 'money', sortable: true }, { key: 'status', label: 'สถานะ', type: 'status', sortable: true },
]" /></template>
