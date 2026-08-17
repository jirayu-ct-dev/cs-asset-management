<template><ResourceList
endpoint="/api/inspections" title="ตรวจนับประจำปี" description="เปิดรอบ ตรวจรายการผิดปกติ และปิดรอบตรวจนับ" create-label="เปิดรอบตรวจ" create-to="/workflows/inspections/create" empty-title="ยังไม่มีรอบตรวจนับ" :columns="[
  { key: 'fiscalYear', label: 'ปีงบประมาณ', sortable: true }, { key: 'name', label: 'ชื่อรอบ', sortable: true }, { key: 'location.name', label: 'ขอบเขต', sortable: true }, { key: 'openedAt', label: 'วันที่เปิด', type: 'date', sortable: true }, { key: '_count.items', label: 'จำนวนรายการ', sortable: true }, { key: 'status', label: 'สถานะ', type: 'status', sortable: true },
]" /></template>
