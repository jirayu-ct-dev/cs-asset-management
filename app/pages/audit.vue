<template><ResourceList
endpoint="/api/audit" title="Audit log" description="ประวัติการเปลี่ยนแปลงสำคัญ อ่านได้อย่างเดียว" empty-title="ยังไม่มีบันทึกกิจกรรม" :columns="[
  { key: 'createdAt', label: 'วันเวลา', type: 'date', sortable: true }, { key: 'actor.name', label: 'ผู้ดำเนินการ', sortable: true }, { key: 'action', label: 'เหตุการณ์', sortable: true }, { key: 'entityType', label: 'ประเภทข้อมูล', sortable: true }, { key: 'entityLabel', label: 'รายการ' }, { key: 'ipAddress', label: 'IP address', sortable: true },
]" /></template>
