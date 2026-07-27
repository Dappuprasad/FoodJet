import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { MENU_SEED } from './menu-data';

const prisma = new PrismaClient();

/**
 * Idempotent seed — safe to re-run against an existing database. Menu items are
 * upserted on their slug, and the demo accounts are upserted on email, so this
 * never duplicates rows or clobbers real orders.
 */
async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@foodjet.dev';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  const customerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'demo@foodjet.dev';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'Demo@12345';

  const [adminHash, customerHash] = await Promise.all([
    argon2.hash(adminPassword, { type: argon2.argon2id }),
    argon2.hash(customerPassword, { type: argon2.argon2id }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: 'FoodJet Admin',
      phone: '9000000001',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      passwordHash: customerHash,
      name: 'Demo Customer',
      phone: '9000000002',
      role: 'CUSTOMER',
    },
  });

  for (const item of MENU_SEED) {
    await prisma.menuItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        pricePaise: item.pricePaise,
        imageUrl: item.imageUrl,
        category: item.category,
        isVegetarian: item.isVegetarian,
        spiceLevel: item.spiceLevel,
        preparationMinutes: item.preparationMinutes,
      },
      create: item,
    });
  }

  console.log(`Seeded ${MENU_SEED.length} menu items`);
  console.log(`Admin account:    ${admin.email} / ${adminPassword}`);
  console.log(`Customer account: ${customer.email} / ${customerPassword}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
