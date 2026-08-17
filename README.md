# CS Asset Management

ระบบจัดการครุภัณฑ์แบบ modular monolith สร้างด้วย Nuxt 4, TypeScript, Prisma และ PostgreSQL ตามแผนใน `docs/PROJECT_PLAN.md`.

## เริ่มต้นพัฒนา

ต้องมี Node.js 22, Corepack/pnpm 11 และ Docker จากนั้นคัดลอก `.env.example` เป็น `.env` และเปลี่ยน `NUXT_SESSION_PASSWORD` ให้เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร

วิธีที่ง่ายที่สุดคือให้ Docker build แอป, เปิด PostgreSQL, deploy migration, seed ข้อมูลตั้งต้น และสร้าง admin ให้อัตโนมัติ:

```sh
cp .env.example .env
docker compose up -d --build
```

เมื่อ `docker compose ps` แสดง `app` และ `db` ทำงาน ให้เปิด `http://localhost:3000` บัญชี development เริ่มต้นคือ `admin@example.test` / `local-admin-password-1234` ควรเปลี่ยนรหัสผ่านทันที และแก้ค่า `ADMIN_*` ใน `.env` ก่อนใช้งานนอกเครื่องส่วนตัว คำสั่งนี้รันซ้ำได้; initializer จะข้าม admin ที่มีอยู่แล้วโดยไม่เปลี่ยนรหัสผ่าน

ดูสถานะ initializer หรือแอปด้วย `docker compose logs init` และ `docker compose logs -f app`

หากต้องการรัน Nuxt บน host เพื่อพัฒนา ให้เปิดเฉพาะฐานข้อมูลแล้วใช้ pnpm:

```sh
docker compose up -d db
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm db:seed
pnpm dev
```

แอปเปิดที่ `http://localhost:3000` และ PostgreSQL สำหรับ development bind เฉพาะ `127.0.0.1:5432` จึงใช้กับ Nuxt บน host ได้โดยไม่เปิดรับจาก network ภายนอก หรือใช้ Full Compose ด้วย `docker compose up --build`.

## Quality gates

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm db:check
pnpm build
pnpm test:e2e
```

E2E จะเปิด dev server อัตโนมัติ หรือกำหนด `PLAYWRIGHT_BASE_URL` เพื่อทดสอบ instance ที่รันอยู่แล้ว
ชุด E2E ต้องใช้ PostgreSQL ที่ migrate/seed แล้วและบัญชีทดสอบจาก `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`; CI จัดเตรียมฐานข้อมูลและบัญชีนี้ให้อัตโนมัติ การทดสอบครอบคลุม login, upload/download ไฟล์แนบ, ยืมพร้อมกัน/รับคืน, import preview/confirm พร้อมกัน และ report preview/PDF/XLSX export

## Production

กำหนด secret ทั้งหมดใน environment หรือไฟล์ env ที่อยู่นอก Git แล้วรัน:

```sh
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

Production override ไม่ publish port ของ app หรือ database; ให้ reverse proxy ภายนอกเชื่อม app ผ่าน Compose network และใช้ HTTPS

## Backup และ Restore

บริการ `backup` สำรอง PostgreSQL และ upload volume ทุก 24 ชั่วโมง เก็บ 7 daily และ 4 weekly โดยค่าเริ่มต้น Production บังคับกำหนด `BACKUP_REPLICA_PATH` เป็น directory ที่ mount มาจากเครื่องหรือระบบจัดเก็บภายนอก เช่น NFS ของศูนย์คอมพิวเตอร์ ห้ามชี้กลับมายัง disk เดียวกับ application server

แต่ละ backup จะถูกเขียนลง replica ผ่าน temporary directory ตรวจ `SHA256SUMS` แล้ว rename แบบ atomic เท่านั้น หาก mount หาย เขียนไม่ได้ หรือ checksum ไม่ตรง script จะ exit non-zero, container จะ restart และ `.last-success` health check จะไม่ถูกอัปเดต จึงต้องผูกสถานะ unhealthy/restart count เข้ากับระบบแจ้งเตือนของผู้ดูแล

ทดสอบ restore ใน environment แยกก่อนเสมอ เพราะคำสั่งนี้แทนที่ฐานข้อมูลและไฟล์ upload ปัจจุบัน:

```sh
docker compose -f compose.yaml -f compose.production.yaml --profile tools run --rm \
  restore /replica/daily/<timestamp>
```

คำสั่ง restore จะตรวจ checksumแล้วแทนที่ฐานข้อมูลและ upload volume ที่ใช้อยู่ จึงควรหยุด `app` และสร้าง backup ล่าสุดก่อนรัน

ใช้ restore drill กับฐานข้อมูลทดสอบเพื่อพิสูจน์ว่า dump และไฟล์แนบกู้ได้ครบ โดย script จะสร้างฐานข้อมูลและ directory ชั่วคราว ตรวจ checksum/จำนวน records/จำนวนไฟล์ แล้วลบทิ้ง:

```sh
PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres \
  PGDATABASE=cs_asset_management ./scripts/restore-drill.sh
```

ห้ามรัน drill ด้วย credentials ที่ไม่มีสิทธิ์ `CREATEDB`; CI ใช้ฐานข้อมูลชั่วคราวแยกจาก production
