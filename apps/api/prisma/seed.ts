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

  // a small believable catalog so lists and search have something to show
  const hardware = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Hardware' },
  });
  const fasteners = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Fasteners', parentId: hardware.id },
  });
  const packaging = await prisma.category.create({
    data: { tenantId: tenant.id, name: 'Packaging' },
  });

  const simpleProducts = [
    { sku: 'OMN-0042', name: 'Steel shelf bracket', cat: hardware.id, cost: 1.8, sell: 4.5, unit: 'piece', tags: ['shelving'] },
    { sku: 'OMN-0311', name: 'Label roll 58mm', cat: packaging.id, cost: 2.1, sell: 5.0, unit: 'roll', tags: ['labels'] },
    { sku: 'OMN-1107', name: 'Pallet wrap 500m', cat: packaging.id, cost: 6.4, sell: 12.0, unit: 'roll', tags: ['wrap'] },
    { sku: 'OMN-2280', name: 'Packing tape, clear', cat: packaging.id, cost: 0.9, sell: 2.5, unit: 'roll', tags: ['tape'] },
    { sku: 'OMN-0958', name: 'Corner protector', cat: packaging.id, cost: 0.4, sell: 1.2, unit: 'piece', tags: [] },
    { sku: 'OMN-1663', name: 'Wood screw 4x40 box', cat: fasteners.id, cost: 3.2, sell: 7.0, unit: 'box', tags: ['screws'] },
  ];
  for (const p of simpleProducts) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costPrice: p.cost,
        sellPrice: p.sell,
        categoryId: p.cat,
        tags: p.tags,
        barcode: `690${p.sku.replace(/\D/g, '').padStart(10, '0')}`,
        variants: {
          create: { tenantId: tenant.id, name: 'Default', sku: p.sku, isDefault: true },
        },
      },
    });
  }

  // one product with real variants to exercise that path
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: 'OMN-3000',
      name: 'Work gloves',
      unit: 'pair',
      costPrice: 1.5,
      sellPrice: 4.0,
      categoryId: hardware.id,
      tags: ['safety'],
      variants: {
        create: [
          { tenantId: tenant.id, name: 'Size M', sku: 'OMN-3000-M', attributes: { size: 'M' } },
          { tenantId: tenant.id, name: 'Size L', sku: 'OMN-3000-L', attributes: { size: 'L' } },
          { tenantId: tenant.id, name: 'Size XL', sku: 'OMN-3000-XL', attributes: { size: 'XL' } },
        ],
      },
    },
  });

  console.log('seeded demo tenant with categories and products');
  console.log(`  sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
