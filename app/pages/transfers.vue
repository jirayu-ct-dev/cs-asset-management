<template><ResourceList
endpoint="/api/transfers" title="ย้ายครุภัณฑ์" description="ประวัติการย้ายสถานที่และเปลี่ยนผู้รับผิดชอบ" create-label="บันทึกการย้าย" create-to="/workflows/transfers/create" empty-title="ยังไม่มีประวัติการย้าย" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์', sortable: true }, { key: 'asset.name', label: 'รายการ', sortable: true }, { key: 'fromLocation.name', label: 'จาก', sortable: true }, { key: 'toLocation.name', label: 'ไปยัง', sortable: true }, { key: 'transferredAt', label: 'วันที่ย้าย', type: 'date', sortable: true }, { key: 'reason', label: 'เหตุผล', sortable: true },
]" /></template>
