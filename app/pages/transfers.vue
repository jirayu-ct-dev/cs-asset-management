<template><ResourceList
endpoint="/api/transfers" title="ย้ายครุภัณฑ์" description="ประวัติการย้ายสถานที่และเปลี่ยนผู้รับผิดชอบ" create-label="บันทึกการย้าย" create-to="/workflows/transfers/create" empty-title="ยังไม่มีประวัติการย้าย" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์' }, { key: 'asset.name', label: 'รายการ' }, { key: 'fromLocation.name', label: 'จาก' }, { key: 'toLocation.name', label: 'ไปยัง' }, { key: 'transferredAt', label: 'วันที่ย้าย', type: 'date' }, { key: 'reason', label: 'เหตุผล' },
]" /></template>
