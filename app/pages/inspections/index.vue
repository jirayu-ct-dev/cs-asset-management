<template><ResourceList
endpoint="/api/inspections" title="ตรวจนับประจำปี" description="เปิดรอบ ตรวจรายการผิดปกติ และปิดรอบตรวจนับ" create-label="เปิดรอบตรวจ" create-to="/workflows/inspections/create" empty-title="ยังไม่มีรอบตรวจนับ" :columns="[
  { key: 'fiscalYear', label: 'ปีงบประมาณ' }, { key: 'name', label: 'ชื่อรอบ' }, { key: 'location.name', label: 'ขอบเขต' }, { key: 'openedAt', label: 'วันที่เปิด', type: 'date' }, { key: '_count.items', label: 'จำนวนรายการ' }, { key: 'status', label: 'สถานะ', type: 'status' },
]" /></template>
