// Fills a local database with starter data. Run with `npm run db:seed`.
// Safe to run more than once: it uses upserts.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: { name: 'Demo School', slug: 'demo-school' },
  });

  console.log(`Seeded organization: ${organization.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
