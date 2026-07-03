// demo data so the app is clickable right after setup.
// grows as each phase adds models.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@omnes.local';
const DEMO_PASSWORD = 'demo-password';

async function main() {
  const existing = await prisma.user.findFirst({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log('demo tenant already seeded, nothing to do');
    return;
  }

  const tenant = await prisma.tenant.create({ data: { name: 'Demo Traders' } });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: DEMO_EMAIL,
      fullName: 'Demo Owner',
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      role: 'OWNER',
    },
  });

  console.log('seeded demo tenant');
  console.log(`  sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
