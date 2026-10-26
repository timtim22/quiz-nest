// Fills a local database with starter data. Run with `npm run db:seed`.
// Safe to run more than once: it uses upserts.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/modules/auth/crypto.js';

/** Local development logins. Never created in production. */
const DEMO_TEACHER = {
  name: 'Demo Teacher',
  email: 'teacher@demo.test',
  password: 'Teacher123',
};
const DEMO_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@demo.test',
  password: 'Admin1234',
};

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

  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping the demo teacher in production.');
    return;
  }

  await prisma.user.upsert({
    where: { email: DEMO_TEACHER.email },
    update: {},
    create: {
      name: DEMO_TEACHER.name,
      email: DEMO_TEACHER.email,
      passwordHash: await hashPassword(DEMO_TEACHER.password),
      organizationId: organization.id,
    },
  });
  console.log(`Seeded teacher: ${DEMO_TEACHER.email} / ${DEMO_TEACHER.password}`);

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN.email },
    update: {},
    create: {
      name: DEMO_ADMIN.name,
      email: DEMO_ADMIN.email,
      passwordHash: await hashPassword(DEMO_ADMIN.password),
      role: 'ADMIN',
      organizationId: organization.id,
    },
  });
  console.log(`Seeded admin: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
