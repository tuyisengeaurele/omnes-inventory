import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// tests run against their own database so a test run can never
// touch dev data. Created on demand, migrated before every run.
const TEST_DB = 'omnes_test';

export default async function globalSetup() {
  const base = process.env.TEST_DATABASE_BASE ?? 'postgresql://postgres@localhost:5433';
  const adminUrl = `${base}/postgres`;
  const testUrl = `${base}/${TEST_DB}`;

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE ${TEST_DB}`);
  } catch {
    // already exists, fine
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}
