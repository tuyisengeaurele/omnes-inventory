import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { sendMail } from '../src/lib/mailer.js';
import { resetDb, signupTenant } from './helpers.js';

vi.mock('../src/lib/mailer.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/mailer.js')>();
  return { ...actual, sendMail: vi.fn(async () => {}) };
});

const app = createApp();

// the tenantId filter is the wall between customers, so it gets its own
// tests instead of trust
describe('multi-tenant isolation', () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(sendMail).mockClear();
  });

  async function twoTenants() {
    const a = await signupTenant(app, {
      businessName: 'Tenant A',
      email: 'owner-a@test.local',
    });
    const b = await signupTenant(app, {
      businessName: 'Tenant B',
      email: 'owner-b@test.local',
    });
    return { a, b };
  }

  it('team listing never crosses tenants', async () => {
    const { a, b } = await twoTenants();

    const teamA = await request(app).get('/team').set('Authorization', `Bearer ${a.accessToken}`);
    const teamB = await request(app).get('/team').set('Authorization', `Bearer ${b.accessToken}`);

    expect(teamA.body.users).toHaveLength(1);
    expect(teamA.body.users[0].email).toBe('owner-a@test.local');
    expect(teamB.body.users).toHaveLength(1);
    expect(teamB.body.users[0].email).toBe('owner-b@test.local');
  });

  it('acting on another tenant"s user id returns not found, not forbidden', async () => {
    const { a, b } = await twoTenants();
    const otherId = b.body.user.id;

    const res = await request(app)
      .post(`/team/users/${otherId}/deactivate`)
      .set('Authorization', `Bearer ${a.accessToken}`);

    // 404 keeps the other tenant"s user ids unguessable
    expect(res.status).toBe(404);
  });

  it('the same email can hold accounts in two tenants and picks one at login', async () => {
    const { a } = await twoTenants();

    // invite the SAME email that owns tenant A into tenant B
    const b = await signupTenant(app, {
      businessName: 'Tenant C',
      email: 'owner-c@test.local',
    });
    await request(app)
      .post('/team/invites')
      .set('Authorization', `Bearer ${b.accessToken}`)
      .send({ email: 'owner-a@test.local', role: 'STAFF' });

    const mailText: string = vi.mocked(sendMail).mock.calls.at(-1)![0].text;
    const token = /token=([\w-]+)/.exec(mailText)?.[1];
    // same password on purpose, login must then ask which workspace
    const accepted = await request(app)
      .post('/auth/accept-invite')
      .send({ token, fullName: 'Owner A Elsewhere', password: 'a-long-password' });
    expect(accepted.status).toBe(201);

    const ambiguous = await request(app)
      .post('/auth/login')
      .send({ email: 'owner-a@test.local', password: 'a-long-password' });
    expect(ambiguous.status).toBe(300);
    expect(ambiguous.body.pickTenant).toHaveLength(2);

    const specific = await request(app).post('/auth/login').send({
      email: 'owner-a@test.local',
      password: 'a-long-password',
      tenantId: a.body.tenant.id,
    });
    expect(specific.status).toBe(200);
    expect(specific.body.tenant.id).toBe(a.body.tenant.id);
  });
});
