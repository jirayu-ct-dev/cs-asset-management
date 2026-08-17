<template><ResourceList
endpoint="/api/audit" title="Audit log" description="ประวัติการเปลี่ยนแปลงสำคัญ อ่านได้อย่างเดียว" empty-title="ยังไม่มีบันทึกกิจกรรม" :columns="[
  { key: 'createdAt', label: 'วันเวลา', type: 'date' }, { key: 'actor.name', label: 'ผู้ดำเนินการ' }, { key: 'action', label: 'เหตุการณ์' }, { key: 'entityType', label: 'ประเภทข้อมูล' }, { key: 'entityLabel', label: 'รายการ' }, { key: 'ipAddress', label: 'IP address' },
]" /></template>
