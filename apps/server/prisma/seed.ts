import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize the Prisma 7 Postgres Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create a test developer
  const user = await prisma.user.upsert({
    where: { email: 'dev@newhere.local' },
    update: {},
    create: {
      email: 'dev@newhere.local',
      name: 'NEwhere Developer',
      password: 'hashed_password_placeholder', // We'll add bcrypt later
    },
  });

  // 2. Create the Hostel Linux Machine (Host)
  const omarchyHost = await prisma.device.create({
    data: {
      name: 'Hostel Omarchy Desktop',
      os: 'linux',
      userId: user.id,
    },
  });

  // 3. Create the College Mac Machine (Client)
  const macClient = await prisma.device.create({
    data: {
      name: 'College MacBook Pro',
      os: 'mac',
      userId: user.id,
    },
  });

  console.log(`Created user: ${user.email}`);
  console.log(`Created host device: ${omarchyHost.name}`);
  console.log(`Created client device: ${macClient.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });