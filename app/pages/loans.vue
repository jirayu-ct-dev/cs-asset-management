<template><ResourceList
endpoint="/api/loans" title="ยืม–คืน" description="ติดตามรายการกำลังยืม เกินกำหนด และประวัติการคืน" create-label="บันทึกการยืม" create-to="/workflows/loans/create" empty-title="ยังไม่มีรายการยืม–คืน" :columns="[
  { key: 'asset.assetNumber', label: 'ครุภัณฑ์', sortable: true }, { key: 'asset.name', label: 'รายการ', sortable: true }, { key: 'borrower.name', label: 'ผู้ยืม', sortable: true }, { key: 'loanedAt', label: 'วันที่ยืม', type: 'date', sortable: true }, { key: 'dueAt', label: 'กำหนดคืน', type: 'date', sortable: true }, { key: 'status', label: 'สถานะ', type: 'status', sortable: true },
]" /></template>
