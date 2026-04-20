import { PrismaClient } from '@prisma/client'

// Use a global variable to avoid multiple instances in dev (e.g. Next.js HMR)
// Though not strictly needed here unless the server hot-reloads heavily, it's a good practice.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
