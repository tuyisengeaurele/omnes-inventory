import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { sendMail } from '../src/lib/mailer.js';
import { resetDb, signupTenant, cookieFrom } from './helpers.js';

vi.mock('../src/lib/mailer.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/mailer.js')>();
  return { ...actual, sendMail: vi.fn(async () => {}) };
});

const app = createApp();

beforeEach(async () => {
  await resetDb();
  vi.mocked(sendMail).mockClear();
});

describe('signup and login', () => {
  it('creates a tenant with an owner and returns a session', async () => {
    const { body } = await signupTenant(app);
    expect(body.user.role).toBe('OWNER');
    expect(body.tenant.name).toBe('Test Traders');
    expect(body.accessToken).toBeTruthy();

    const tenants = await prisma.tenant.count();
    expect(tenants).toBe(1);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    await signupTenant(app);

    const ok = await request(app)
      .post('/auth/login')
      .send({ email: 'owner@test.local', password: 'a-long-password' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe('owner@test.local');

    const bad = await request(app)
      .post('/auth/login')
      .send({ email: 'owner@test.local', password: 'not-the-password' });
    expect(bad.status).toBe(401);
  });

  it('serves /auth/me with a valid access token', async () => {
    const { accessToken } = await signupTenant(app);
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('OWNER');
  });
});

describe('refresh rotation', () => {
  it('rotates the refresh token and rejects replay of the old one', async () => {
    const { cookie } = await signupTenant(app);

    const first = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(first.status).toBe(200);
    const rotated = cookieFrom(first);
    expect(rotated).not.toBe(cookie);

    // replaying the original token must fail and kill the whole chain
    const replay = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(replay.status).toBe(401);

    const afterReplay = await request(app).post('/auth/refresh').set('Cookie', rotated);
    expect(afterReplay.status).toBe(401);
  });

  it('logout revokes the session', async () => {
    const { cookie } = await signupTenant(app);
    await request(app).post('/auth/logout').set('Cookie', cookie);
    const res = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
});

describe('password reset', () => {
  it('resets the password through the emailed token and drops open sessions', async () => {
    const { cookie } = await signupTenant(app);

    await request(app).post('/auth/forgot-password').send({ email: 'owner@test.local' });
    expect(vi.mocked(sendMail)).toHaveBeenCalledTimes(1);
    const mailText: string = vi.mocked(sendMail).mock.calls[0][0].text;
    const token = /token=([\w-]+)/.exec(mailText)?.[1];
    expect(token).toBeTruthy();

    const reset = await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'brand-new-password' });
    expect(reset.status).toBe(200);

    // old password dead, new one works, old refresh token dead
    const oldLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'owner@test.local', password: 'a-long-password' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/auth/login')
      .send({ email: 'owner@test.local', password: 'brand-new-password' });
    expect(newLogin.status).toBe(200);

    const refresh = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(refresh.status).toBe(401);

    // the same token cannot be used twice
    const again = await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'yet-another-password' });
    expect(again.status).toBe(400);
  });
});

describe('invites', () => {
  it('runs the invite flow end to end and enforces who can invite admins', async () => {
    const { accessToken } = await signupTenant(app);

    const created = await request(app)
      .post('/team/invites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'staff@test.local', role: 'STAFF' });
    expect(created.status).toBe(201);

    const mailText: string = vi.mocked(sendMail).mock.calls[0][0].text;
    const token = /token=([\w-]+)/.exec(mailText)?.[1];

    const accepted = await request(app)
      .post('/auth/accept-invite')
      .send({ token, fullName: 'Staff Person', password: 'staff-password-1' });
    expect(accepted.status).toBe(201);
    expect(accepted.body.user.role).toBe('STAFF');

    // staff cannot read the team, manager permission starts higher
    const denied = await request(app)
      .get('/team')
      .set('Authorization', `Bearer ${accepted.body.accessToken}`);
    expect(denied.status).toBe(403);

    // staff certainly cannot invite an admin either
    const noAdmin = await request(app)
      .post('/team/invites')
      .set('Authorization', `Bearer ${accepted.body.accessToken}`)
      .send({ email: 'x@test.local', role: 'ADMIN' });
    expect(noAdmin.status).toBe(403);
  });

  it('deactivation locks the user out immediately', async () => {
    const owner = await signupTenant(app);

    await request(app)
      .post('/team/invites')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'staff@test.local', role: 'STAFF' });
    const mailText: string = vi.mocked(sendMail).mock.calls[0][0].text;
    const token = /token=([\w-]+)/.exec(mailText)?.[1];
    const staff = await request(app)
      .post('/auth/accept-invite')
      .send({ token, fullName: 'Staff Person', password: 'staff-password-1' });

    const staffId = staff.body.user.id;
    const off = await request(app)
      .post(`/team/users/${staffId}/deactivate`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(off.status).toBe(200);

    // even with a still-valid access token, the next request fails
    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${staff.body.accessToken}`);
    expect(me.status).toBe(401);
  });
});
