<template><ResourceList
endpoint="/api/loans" title="ยืม–คืน" description="ติดตามรายการกำลังยืม เกินกำหนด และประวัติการคืน" create-label="บันทึกการยืม" create-to="/workflows/loans/create" empty-title="ยังไม่มีรายการยืม–คืน" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์' }, { key: 'asset.name', label: 'รายการ' }, { key: 'borrower.name', label: 'ผู้ยืม' }, { key: 'loanedAt', label: 'วันที่ยืม', type: 'date' }, { key: 'dueAt', label: 'กำหนดคืน', type: 'date' }, { key: 'status', label: 'สถานะ', type: 'status' },
]" /></template>
