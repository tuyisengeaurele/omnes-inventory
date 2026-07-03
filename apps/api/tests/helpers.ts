import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/db.js';

export async function resetDb() {
  // FK order matters, children first
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

export function cookieFrom(res: request.Response): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const rt = list.find((c: string) => c.startsWith('omnes_rt='));
  if (!rt) throw new Error('no refresh cookie on response');
  return rt.split(';')[0];
}

export async function signupTenant(
  app: Express,
  overrides: Partial<{ businessName: string; fullName: string; email: string; password: string }> = {},
) {
  const res = await request(app)
    .post('/auth/signup')
    .send({
      businessName: 'Test Traders',
      fullName: 'Test Owner',
      email: 'owner@test.local',
      password: 'a-long-password',
      ...overrides,
    });
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { res, accessToken: res.body.accessToken as string, cookie: cookieFrom(res), body: res.body };
}
