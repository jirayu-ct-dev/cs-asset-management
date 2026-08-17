<template><ResourceList
endpoint="/api/people" title="บุคคล" description="ข้อมูลผู้ยืมและผู้รับผิดชอบ (ไม่มีบัญชีเข้าใช้ระบบ)" create-label="เพิ่มบุคคล" create-to="/workflows/people/create" empty-title="ยังไม่มีข้อมูลบุคคล" :columns="[
  { key: 'name', label: 'ชื่อ–นามสกุล', sortable: true }, { key: 'code', label: 'รหัส', sortable: true }, { key: 'type', label: 'ประเภท', sortable: true }, { key: 'department', label: 'หน่วยงาน', sortable: true }, { key: 'phone', label: 'โทรศัพท์', sortable: true }, { key: 'isActive', label: 'สถานะ', type: 'active', sortable: true },
]" /></template>
