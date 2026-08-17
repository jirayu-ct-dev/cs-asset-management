import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const referenceData = {
  category: [
    { code: 'COMPUTER', name: 'คอมพิวเตอร์' },
    { code: 'PERIPHERAL', name: 'อุปกรณ์ต่อพ่วง' },
    { code: 'NETWORK', name: 'อุปกรณ์เครือข่าย' },
    { code: 'OFFICE', name: 'อุปกรณ์สำนักงาน' },
    { code: 'FURNITURE', name: 'ครุภัณฑ์สำนักงาน' },
    { code: 'OTHER', name: 'อื่น ๆ' },
  ],
  unit: [
    { code: 'ITEM', name: 'เครื่อง' },
    { code: 'UNIT', name: 'หน่วย' },
    { code: 'SET', name: 'ชุด' },
    { code: 'PIECE', name: 'ชิ้น' },
  ],
  location: [
    { code: 'UNASSIGNED', name: 'ยังไม่ระบุสถานที่' },
    { code: 'STORAGE', name: 'ห้องเก็บครุภัณฑ์' },
  ],
  fundingSource: [
    { code: 'GOVERNMENT', name: 'งบประมาณแผ่นดิน' },
    { code: 'INCOME', name: 'งบเงินรายได้' },
    { code: 'DONATION', name: 'เงินบริจาค' },
    { code: 'OTHER', name: 'อื่น ๆ' },
  ],
} as const

const main = async () => {
  await prisma.$transaction(async (tx) => {
    for (const [index, row] of referenceData.category.entries()) {
      await tx.category.upsert({
        where: { code: row.code },
        update: { name: row.name, sortOrder: index, isActive: true },
        create: { ...row, sortOrder: index },
      })
    }

    for (const [index, row] of referenceData.unit.entries()) {
      await tx.unit.upsert({
        where: { code: row.code },
        update: { name: row.name, sortOrder: index, isActive: true },
        create: { ...row, sortOrder: index },
      })
    }

    for (const [index, row] of referenceData.location.entries()) {
      await tx.location.upsert({
        where: { code: row.code },
        update: { name: row.name, sortOrder: index, isActive: true },
        create: { ...row, sortOrder: index },
      })
    }

    for (const [index, row] of referenceData.fundingSource.entries()) {
      await tx.fundingSource.upsert({
        where: { code: row.code },
        update: { name: row.name, sortOrder: index, isActive: true },
        create: { ...row, sortOrder: index },
      })
    }
  })
}

main()
  .then(() => console.info('Reference data seeded successfully.'))
  .finally(() => prisma.$disconnect())
