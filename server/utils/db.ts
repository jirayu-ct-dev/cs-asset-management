import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

const globalPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const usePrisma = (event?: H3Event): PrismaClient => {
  if (globalPrisma.prisma) return globalPrisma.prisma

  const runtimeUrl = event ? useRuntimeConfig(event).databaseUrl : undefined
  const connectionString = runtimeUrl || process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({ statusCode: 503, statusMessage: 'Database is not configured' })
  }

  globalPrisma.prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) })
  return globalPrisma.prisma
}
