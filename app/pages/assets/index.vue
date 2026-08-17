<template><ResourceList
endpoint="/api/assets" title="ทะเบียนครุภัณฑ์" description="ค้นหา ดูสถานะ และติดตามครุภัณฑ์ทั้งหมด" create-label="เพิ่มครุภัณฑ์" create-to="/assets/create" empty-title="ยังไม่มีครุภัณฑ์ในทะเบียน" :columns="[
  { key: 'assetNumber', label: 'หมายเลขครุภัณฑ์' }, { key: 'name', label: 'ชื่อรายการ' },
  { key: 'category.name', label: 'หมวด' }, { key: 'location.name', label: 'สถานที่' },
  { key: 'custodyStatus', label: 'สถานะ', type: 'status' }, { key: 'conditionStatus', label: 'สภาพ', type: 'status' },
]" /></template>

