import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const readArgument = (name: string): string | undefined => {
  const prefix = `--${name}=`
  const inline = process.argv.find(argument => argument.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const requiredValue = (name: string, environmentName: string): string => {
  const value = readArgument(name) ?? process.env[environmentName]
  if (!value?.trim()) {
    throw new Error(`Missing --${name} or ${environmentName}`)
  }
  return value.trim()
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const email = requiredValue('email', 'ADMIN_EMAIL').toLowerCase()
const name = requiredValue('name', 'ADMIN_NAME')
const password = requiredValue('password', 'ADMIN_PASSWORD')

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Admin email is invalid')
}
if (password.length < 12) {
  throw new Error('Admin password must contain at least 12 characters')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const hash = new Hash(new Scrypt({}))

const main = async () => {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error(`Admin account already exists for ${email}`)
  }

  const passwordHash = await hash.make(password)
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true, name: true },
  })

  console.info(`Admin created: ${user.email} (${user.id})`)
}

main().finally(() => prisma.$disconnect())
