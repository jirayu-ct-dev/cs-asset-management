<template><ResourceList
endpoint="/api/people" title="บุคคล" description="ข้อมูลผู้ยืมและผู้รับผิดชอบ (ไม่มีบัญชีเข้าใช้ระบบ)" create-label="เพิ่มบุคคล" create-to="/workflows/people/create" empty-title="ยังไม่มีข้อมูลบุคคล" :columns="[
  { key: 'name', label: 'ชื่อ–นามสกุล' }, { key: 'code', label: 'รหัส' }, { key: 'type', label: 'ประเภท' }, { key: 'department', label: 'หน่วยงาน' }, { key: 'phone', label: 'โทรศัพท์' }, { key: 'isActive', label: 'สถานะ' },
]" /></template>
