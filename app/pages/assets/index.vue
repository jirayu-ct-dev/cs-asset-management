<template><ResourceList
endpoint="/api/assets" title="ทะเบียนครุภัณฑ์" description="ค้นหา ดูสถานะ และติดตามครุภัณฑ์ทั้งหมด" create-label="เพิ่มครุภัณฑ์" create-to="/assets/create" empty-title="ยังไม่มีครุภัณฑ์ในทะเบียน" :columns="[
  { key: 'assetNumber', label: 'หมายเลขครุภัณฑ์', sortable: true }, { key: 'name', label: 'ชื่อรายการ', sortable: true },
  { key: 'category.name', label: 'หมวด', sortable: true }, { key: 'location.name', label: 'สถานที่', sortable: true },
  { key: 'custodyStatus', label: 'สถานะ', type: 'status', sortable: true }, { key: 'conditionStatus', label: 'สภาพ', type: 'status', sortable: true },
]" /></template>
