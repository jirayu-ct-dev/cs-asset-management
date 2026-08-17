<template><ResourceList
endpoint="/api/repairs" title="แจ้งชำรุดและซ่อม" description="ติดตามอาการ การส่งซ่อม ผลซ่อม และค่าใช้จ่าย" create-label="แจ้งชำรุด" create-to="/workflows/repairs/create" empty-title="ยังไม่มีงานซ่อม" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์' }, { key: 'asset.name', label: 'รายการ' }, { key: 'reportedAt', label: 'วันที่แจ้ง', type: 'date' }, { key: 'vendor', label: 'ร้านซ่อม' }, { key: 'expectedBackAt', label: 'กำหนดรับ', type: 'date' }, { key: 'cost', label: 'ค่าใช้จ่าย', type: 'money' }, { key: 'status', label: 'สถานะ', type: 'status' },
]" /></template>
