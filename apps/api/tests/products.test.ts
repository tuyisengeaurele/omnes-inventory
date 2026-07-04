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

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createProduct(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/products')
    .set(auth(token))
    .send({ sku: 'SKU-1', name: 'Test product', costPrice: 2, sellPrice: 5, ...overrides });
}

describe('product catalog', () => {
  beforeEach(resetDb);

  it('creates a product with a default variant mirroring its sku', async () => {
    const { accessToken } = await signupTenant(app);
    const res = await createProduct(accessToken);
    expect(res.status).toBe(201);
    expect(res.body.product.variants).toHaveLength(1);
    expect(res.body.product.variants[0]).toMatchObject({ sku: 'SKU-1', isDefault: true });
  });

  it('rejects a duplicate sku inside the same tenant, allows it across tenants', async () => {
    const { accessToken: a } = await signupTenant(app);
    const { accessToken: b } = await signupTenant(app, { email: 'other@test.local', businessName: 'Other Co' });

    expect((await createProduct(a)).status).toBe(201);
    expect((await createProduct(a)).status).toBe(409);
    expect((await createProduct(b)).status).toBe(201);
  });

  it('keeps a lone default variant sku in sync on product sku change', async () => {
    const { accessToken } = await signupTenant(app);
    const created = await createProduct(accessToken);
    const res = await request(app)
      .patch(`/products/${created.body.product.id}`)
      .set(auth(accessToken))
      .send({ sku: 'SKU-2' });
    expect(res.status).toBe(200);
    expect(res.body.product.variants[0].sku).toBe('SKU-2');
  });

  it('never shows one tenant the products of another', async () => {
    const { accessToken: a } = await signupTenant(app);
    const { accessToken: b } = await signupTenant(app, { email: 'other@test.local', businessName: 'Other Co' });
    const created = await createProduct(a);

    const list = await request(app).get('/products').set(auth(b));
    expect(list.body.items).toHaveLength(0);

    const direct = await request(app).get(`/products/${created.body.product.id}`).set(auth(b));
    expect(direct.status).toBe(404);

    const patched = await request(app)
      .patch(`/products/${created.body.product.id}`)
      .set(auth(b))
      .send({ name: 'hijacked' });
    expect(patched.status).toBe(404);
  });

  it('blocks staff from writing but lets them read', async () => {
    const { accessToken } = await signupTenant(app);
    await createProduct(accessToken);

    // invite a staff user through the real flow, token comes from the mail
    await request(app)
      .post('/team/invites')
      .set(auth(accessToken))
      .send({ email: 'staff@test.local', role: 'STAFF' });
    const mailText: string = vi.mocked(sendMail).mock.calls.at(-1)![0].text;
    const token = /token=([\w-]+)/.exec(mailText)?.[1];
    const accepted = await request(app)
      .post('/auth/accept-invite')
      .send({ token, fullName: 'Staff Member', password: 'a-long-password' });
    const staffToken = accepted.body.accessToken as string;

    const list = await request(app).get('/products').set(auth(staffToken));
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);

    const write = await createProduct(staffToken, { sku: 'SKU-9' });
    expect(write.status).toBe(403);
  });

  it('manages variants with per-tenant sku uniqueness', async () => {
    const { accessToken } = await signupTenant(app);
    const created = await createProduct(accessToken);
    const productId = created.body.product.id;

    const added = await request(app)
      .post(`/products/${productId}/variants`)
      .set(auth(accessToken))
      .send({ name: 'Large', sku: 'SKU-1-L', attributes: { size: 'L' } });
    expect(added.status).toBe(201);

    const clash = await request(app)
      .post(`/products/${productId}/variants`)
      .set(auth(accessToken))
      .send({ name: 'Clash', sku: 'SKU-1' });
    expect(clash.status).toBe(409);

    const dropDefault = await request(app)
      .delete(`/products/${productId}/variants/${created.body.product.variants[0].id}`)
      .set(auth(accessToken));
    expect(dropDefault.status).toBe(400);
  });
});

describe('csv import and export', () => {
  beforeEach(resetDb);

  const csv = [
    'sku,name,description,unit,cost_price,sell_price,tax_class,barcode,category,tags',
    'CSV-1,Imported one,,piece,1.5,3,standard,,Tools,alpha;beta',
    'CSV-2,Imported two,,box,2,4,standard,,,',
  ].join('\n');

  it('previews with per-row validation and commits clean rows', async () => {
    const { accessToken } = await signupTenant(app);

    const bad = csv + '\nCSV-1,Duplicate,,unit,1,2,standard,,,';
    const preview = await request(app)
      .post('/catalog/import/preview')
      .set(auth(accessToken))
      .attach('file', Buffer.from(bad), 'products.csv');
    expect(preview.status).toBe(200);
    expect(preview.body.summary).toMatchObject({ create: 2, error: 1 });

    const rows = preview.body.rows.filter((r: { action: string }) => r.action !== 'error');
    const commit = await request(app)
      .post('/catalog/import/commit')
      .set(auth(accessToken))
      .send({ rows: rows.map((r: { data: unknown }) => r.data) });
    expect(commit.status).toBe(200);
    expect(commit.body).toMatchObject({ created: 2, updated: 0 });

    const list = await request(app).get('/products').set(auth(accessToken));
    expect(list.body.total).toBe(2);
    const one = list.body.items.find((p: { sku: string }) => p.sku === 'CSV-1');
    expect(one.category.name).toBe('Tools');
    expect(one.tags).toEqual(['alpha', 'beta']);
  });

  it('marks existing skus as updates and applies them', async () => {
    const { accessToken } = await signupTenant(app);
    await createProductWith(accessToken, 'CSV-1', 'Original name');

    const preview = await request(app)
      .post('/catalog/import/preview')
      .set(auth(accessToken))
      .attach('file', Buffer.from(csv), 'products.csv');
    expect(preview.body.summary).toMatchObject({ create: 1, update: 1 });

    const commit = await request(app)
      .post('/catalog/import/commit')
      .set(auth(accessToken))
      .send({ rows: preview.body.rows.map((r: { data: unknown }) => r.data) });
    expect(commit.body).toMatchObject({ created: 1, updated: 1 });
  });

  it('round trips through export', async () => {
    const { accessToken } = await signupTenant(app);
    await createProductWith(accessToken, 'EXP-1', 'Exported, with "quotes"');

    const res = await request(app).get('/catalog/export.csv').set(auth(accessToken));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('"Exported, with ""quotes"""');
  });

  async function createProductWith(token: string, sku: string, name: string) {
    const res = await request(app)
      .post('/products')
      .set(auth(token))
      .send({ sku, name, costPrice: 1, sellPrice: 2 });
    expect(res.status).toBe(201);
    return res;
  }
});
