# System Scope

## ที่มาและขอบเขตการตรวจสอบ

เอกสารนี้อธิบายความสามารถที่มีอยู่จริงใน Source Code ณ วันที่ตรวจสอบ โดยสำรวจ `app/`, `server/`, `shared/`, `prisma/`, `tests/`, Docker และ scripts โดยตรง เอกสารแผนและ README ใช้เป็นข้อมูลประกอบเท่านั้น หากขัดกับ implementation ให้ยึด implementation เป็นหลัก

ระบบเป็นเว็บสำหรับผู้ดูแลสาขาวิทยาการคอมพิวเตอร์ ใช้จัดทะเบียนครุภัณฑ์ ติดตามผู้รับผิดชอบ การยืม–คืน การซ่อม การย้าย การตรวจนับ การจำหน่าย เอกสารแนบ การนำเข้าข้อมูล รายงาน และประวัติการเปลี่ยนแปลง โดยสถานะปัจจุบันของครุภัณฑ์และประวัติ workflow ถูกเก็บแยกกัน (`prisma/schema.prisma:201-245,248-525`)

## ผู้ใช้และสิทธิ์

- มีบัญชีระบบชนิดเดียวคือ `User` และไม่มี role/permission field ทุกบัญชีที่เปิดใช้งานจึงมีสิทธิ์ผู้ดูแลเท่ากัน (`prisma/schema.prisma:89-114`)
- บุคคลในทะเบียน `Person` เป็นผู้ยืมหรือผู้รับผิดชอบ ไม่ใช่บัญชีเข้าสู่ระบบ (`prisma/schema.prisma:178-198`)
- ทุก API ยกเว้น Login และ Health ต้องมี session และบัญชียังเปิดใช้งานอยู่ หากปิดบัญชี session เดิมจะถูกล้าง (`server/middleware/auth.ts:1-7`, `server/utils/session.ts:3-11`)
- QR ของครุภัณฑ์เป็นทางลัดสำหรับผู้ที่เข้าสู่ระบบแล้ว ไม่ใช่หน้าสาธารณะ

## หน้าจอและโมดูล

| เส้นทาง | ความสามารถที่ใช้งานได้จริง |
|---|---|
| `/login` | เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน แสดงข้อผิดพลาด และกลับไป URL ภายในที่ร้องขอก่อน Login |
| `/` | แสดงจำนวนครุภัณฑ์ทั้งหมด พร้อมใช้ ถูกยืม เกินกำหนด ชำรุด และอยู่ระหว่างซ่อม |
| `/assets` | ทะเบียนครุภัณฑ์ ค้นหาทันที กรอง เรียงหัวตาราง 3 สถานะ แบ่งหน้า รีเฟรช ดูและแก้ข้อมูลทะเบียน |
| `/assets/create`, `/assets/edit/:id` | เพิ่ม/แก้หมายเลข ชื่อ หมวด หน่วย จำนวน ราคา วันที่รับ ยี่ห้อ รุ่น Serial และงบประมาณ; การเปลี่ยนห้อง/ผู้รับผิดชอบต้องผ่าน workflow ย้าย |
| `/assets/:id` | ดูสถานะปัจจุบัน ประวัติ AssetEvent เอกสารแนบ QR และ quick actions ตามสถานะ; URL จาก QR ใช้ดูข้อมูลได้ แต่ข้อจำกัดของ edit/workflow จาก public ID ระบุด้านล่าง |
| `/people`, `/edit/people/:id` | เพิ่ม ค้นหา กรอง แก้ และเปิด/ปิดบุคคลประเภทนักศึกษา บุคลากร หรือบุคคลภายนอก |
| `/loans` | สร้างรายการยืม รับคืน ยกเลิก แนบหลักฐาน และแก้รายการผิดด้วยการยกเลิกแล้วสร้างใหม่ |
| `/repairs` | แจ้งชำรุด ส่งซ่อม รับกลับ/ปิดงาน ยกเลิก แนบหลักฐาน และสร้างรายการแก้ไขใหม่ |
| `/transfers` | ย้ายห้อง/ผู้รับผิดชอบ แนบหลักฐาน และย้อนรายการล่าสุดด้วย compensating transfer |
| `/inspections`, `/inspections/:id` | เปิดรอบตรวจ บันทึกผล/ตำแหน่งจริง/สภาพ/หมายเหตุ ล้างผลพร้อมเหตุผล ปิดรอบพร้อมยืนยัน และแนบหลักฐาน |
| `/disposals` | เสนอจำหน่าย บันทึกจำหน่าย ย้อนกลับ และแนบหลักฐาน |
| `/imports` | นำเข้า XLSX/CSV แบบ preview → จับคู่คอลัมน์ → validate → confirm |
| `/reports` | ดูยอดสรุปและดาวน์โหลด PDF/XLSX สำหรับทะเบียน ยืม ซ่อม ย้าย ตรวจนับ จำหน่าย และประวัติรายชิ้น |
| `/audit` | อ่าน ค้นหา กรอง เรียง และแบ่งหน้าประวัติการเปลี่ยนแปลง |
| `/settings` | จัดการหมวด หน่วย สถานที่ แหล่งงบประมาณ บัญชีผู้ดูแล และเปลี่ยนรหัสผ่าน |

เมนูหลัก 12 รายการและ shell responsive อยู่ที่ `app/layouts/default.vue:13-35`; รายละเอียด route อยู่ใน `app/pages/` ตาม file-based routing

## การค้นหา กรอง เรียง และแบ่งหน้า

ตารางหลักใช้ `ResourceList` ร่วมกัน (`app/components/ResourceList.vue:3-226`):

- Search เรียก API หลังหยุดพิมพ์ 300 ms ไม่ต้องกดปุ่มค้นหา
- Filter เปลี่ยนตามโมดูล เช่น หมวด/สถานที่/สถานะครุภัณฑ์ ประเภทบุคคล สถานะ workflow
- Sort ที่คอลัมน์วน `default ↕ → ascending ↑ → descending ↓ → default` และ default กลับไปใช้ลำดับของ endpoint จริง
- Pagination เลือก 10/20/50/100 รายการ; server จำกัดสูงสุด 100 (`server/utils/request.ts:16-34`)
- Mobile แถวแรกมี Search กับ Refresh icon; filter wrap ในแถวถัดไป ตารางเลื่อนแนวนอนได้

## สถานะและกฎธุรกิจ

ครุภัณฑ์มีสถานะอิสระสามแกน (`shared/types/domain.ts:1-4`):

- วงจรชีวิต: `ACTIVE`, `PROPOSED_FOR_DISPOSAL`, `DISPOSED`
- การครอบครอง: `AVAILABLE`, `BORROWED`, `IN_REPAIR`, `MISSING`
- สภาพ: `NORMAL`, `DAMAGED_USABLE`, `UNUSABLE`

### ยืม–คืน

ยืมได้เมื่ออยู่ในวงจรใช้งาน พร้อมใช้ และไม่ใช่สภาพใช้งานไม่ได้ ระบบ lock ครุภัณฑ์ สร้าง Loan แล้วเปลี่ยนเป็น `BORROWED` ใน transaction เดียว API การคืนรองรับการบันทึกสภาพหลังคืน เปลี่ยนเป็น `AVAILABLE` และเปิด Repair ต่อเมื่อผิดปกติ (`server/api/loans/[id]/return.post.ts:12-36`) แต่ quick action ในตารางปัจจุบันส่ง `NORMAL` และ `openRepair: false` คงที่ (`app/components/ResourceList.vue:143-147`) การยกเลิกทำได้เฉพาะรายการ `ACTIVE`

### ซ่อม

แจ้งซ่อมได้เฉพาะ `ACTIVE + AVAILABLE`; ระบบเก็บ snapshot ของ custody/condition ก่อนซ่อม การส่งซ่อมเปลี่ยน custody เป็น `IN_REPAIR` API ปิดงานรองรับผลสำเร็จ/ไม่สำเร็จ หมายเหตุและค่าใช้จ่าย (`server/api/repairs/[id]/close.post.ts:15-20`) แต่ quick action ปัจจุบันส่ง “ซ่อมสำเร็จ” และค่าใช้จ่ายศูนย์คงที่ (`app/components/ResourceList.vue:154-160`) การยกเลิกคืน snapshot เดิมและตรวจว่ารัฐปัจจุบันยังตรงกับงาน

### ย้าย

การย้ายเก็บค่าห้อง/ผู้รับผิดชอบทั้งก่อนและหลัง ห้ามย้ายของที่ถูกยืมหรือจำหน่ายแล้ว และห้าม no-op การย้อนกลับไม่แก้หรือลบประวัติเดิม แต่สร้าง Transfer ชดเชย และทำได้เฉพาะรายการล่าสุดเมื่อสถานะปลายทางยังไม่เปลี่ยน (`server/api/transfers/index.post.ts:7-29`, `server/api/transfers/[id]/reverse.post.ts:8-40`)

### ตรวจนับ

เมื่อเปิดรอบ ระบบ snapshot ครุภัณฑ์ที่ยังไม่จำหน่ายทั้งหมดหรือเฉพาะสถานที่ ผลตรวจแก้ได้เฉพาะรอบเปิด การ reset ต้องมีเหตุผล การปิดรอบที่ยังตรวจไม่ครบหรือมีผลผิดปกติต้องยืนยัน (`server/api/inspections/**/*.ts`) API รองรับ reopen พร้อมเหตุผล (`server/api/inspections/[id]/reopen.post.ts:3-13`) แต่ยังไม่มี action นี้ใน UI ผล `MISSING`, `REPAIR_REQUESTED` หรือ `DISPOSAL_REQUESTED` เป็นข้อมูลผลตรวจเท่านั้น ไม่เปลี่ยน Asset หรือสร้าง workflow อัตโนมัติ

### จำหน่าย

เสนอได้เมื่อ `ACTIVE + AVAILABLE` แล้วเปลี่ยน lifecycle เป็น `PROPOSED_FOR_DISPOSAL`; เมื่อเสร็จเปลี่ยนเป็น `DISPOSED` การ reverse ตรวจ provenance แล้วเปลี่ยนรายการเป็น `CANCELLED` และ Asset กลับ `ACTIVE` (`server/api/disposals/**/*.post.ts`)

Mutation สำคัญสร้าง `AuditLog`; workflow ที่ผูกกับครุภัณฑ์ส่วนใหญ่สร้าง `AssetEvent` เพิ่มสำหรับ timeline การเปิด/ปิด/reopen รอบตรวจสร้างเฉพาะ AuditLog ส่วนการบันทึก/reset item จึงสร้าง AssetEvent (`server/api/inspections/index.post.ts:30`, `server/api/inspections/[id]/items/[assetId].put.ts:17-18`) การแก้ข้อมูลผิดใช้ cancel/reverse/reset/reopen แทนการลบประวัติ

## Import, Attachment และ Report

- Import รองรับ `.xlsx` และ `.csv` delimiter comma/semicolon/tab รวมวันที่ไทย/พุทธศักราช ตรวจข้อมูลซ้ำในไฟล์และฐานข้อมูล ไฟล์ที่ผ่าน validation เท่านั้นจึงถูกสร้างเป็น Asset (`server/services/import-parser.ts:18-77`, `server/api/imports/**/*.ts`)
- Attachment ผูกได้กับ Asset, Loan, Repair, Transfer, InspectionRound หรือ Disposal รองรับ JPEG/PNG/WebP/PDF/DOCX/XLSX ขนาดเริ่มต้นไม่เกิน 10 MiB ตรวจ extension และ signature, สุ่มชื่อจัดเก็บและทำ SHA-256 (`server/services/attachments.ts:6-96`)
- Report ใช้ filter ตามประเภทและขอบเขตวัน Asia/Bangkok; preview ส่ง count/value และข้อมูลสูงสุด 20 แถว ส่วน export ใช้ข้อมูลทั้งหมด สร้าง XLSX ด้วย ExcelJS และ PDF ด้วย Chromium (`shared/schemas/report.ts:4-44`, `server/services/reports.ts:14-89`)
- ไม่พบ integration กับ SaaS หรือ API ภายนอก การเก็บข้อมูล รายงาน QR และไฟล์ทั้งหมดทำภายในระบบ

## Validation และ Error Handling

Body ส่วนใหญ่ผ่าน Zod; validation ผิดคืน `422` พร้อมรายละเอียด, state conflict `409`, ไม่พบ `404`, ไม่ผ่านสิทธิ์ `401/403`, ไฟล์ใหญ่ `413`, ชนิดไฟล์ไม่รองรับ `415`, ไม่มี DB config `503` (`server/utils/request.ts:4-14`). UI ใช้ inline alert, Toast และ retry state; action ที่ทำไม่ได้ยังคลิกได้และแจ้งเหตุผลแทนการ disable

## ข้อจำกัดที่ยืนยันจาก Source Code

1. Dashboard ส่วน “งานที่ต้องดำเนินการ” และ “กิจกรรมล่าสุด” เป็น placeholder ที่ว่างเสมอ เพราะ UI รอ `pendingTasks/recentEvents` แต่ API ส่งเฉพาะ count (`app/pages/index.vue:11-12,43-47`, `server/api/dashboard.get.ts:4-16`)
2. ตารางยืมยังไม่แสดง/กรอง `OVERDUE` โดยตรง แม้ API คำนวณ boolean `overdue` และ Dashboard นับได้
3. เปลี่ยนรหัสผ่านแล้ว server ล้าง session แต่หน้า Settings ไม่ redirect ไป Login ทันที (`app/pages/settings.vue:18-21`, `server/api/auth/password.patch.ts:12-17`)
4. หน้า inspection detail โหลด item ทั้งรอบและค้นหาใน browser จึงอาจช้าเมื่อข้อมูลมาก แม้มี API item search แยก
5. Status badge บาง workflow ยังแสดง enum ภาษาอังกฤษ และชื่อผู้ใช้ใน sidebar เป็นข้อความคงที่
6. ไม่มี delete สำหรับ Asset, workflow, attachment หรือ import; เน้น deactivate/cancel/reverse และเก็บประวัติ
7. การย้ายห้ามเพียง `BORROWED` และ `DISPOSED`; policy สำหรับ `IN_REPAIR` หรือ `PROPOSED_FOR_DISPOSAL` ไม่สามารถยืนยันว่าเป็นความตั้งใจหรือช่องว่าง
8. Health endpoint ตรวจเฉพาะ process ไม่ตรวจ DB/storage; ไม่มี notification, public portal หรือ external identity provider
9. QR สร้าง URL ด้วย `publicId` และหน้า detail อ่านได้ แต่ edit และ quick workflow ส่ง route value ต่อเป็น UUID ทำให้ mutation จาก URL ที่สแกนยังล้มเหลว (`server/api/assets/[id]/qr.get.ts:5-9`, `app/pages/assets/[id].vue:32-49`, `server/api/assets/[id].patch.ts:18-23`)
10. Docker initializer รัน seed ทุกครั้ง; seed จะตั้งชื่อ ลำดับ และ `isActive: true` ของ reference code มาตรฐานกลับตาม Source Code จึงอาจทับการแก้/ปิดใช้งานจาก Settings (`scripts/docker-init.sh:4-6`, `prisma/seed.ts:39-70`)
11. UI quick action รับคืนและปิดซ่อมใช้ค่าคงที่ จึงยังบันทึก return-damage/open-repair หรือ repair-failure/cost ผ่านตารางไม่ได้ แม้ API รองรับ

## สิ่งที่ Source Code ยืนยันไม่ได้

ไม่สามารถยืนยัน permission matrix ที่องค์กรต้องการ, ปริมาณข้อมูลจริง, browser/device production, SLA/RPO/RTO, reverse proxy/TLS, secret manager, monitoring/alerting, malware scanning, เทคโนโลยี off-machine backup และผลการซ้อมกู้คืนจริงใน production
