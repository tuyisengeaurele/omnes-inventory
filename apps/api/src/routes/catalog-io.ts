import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { parse as parseCsv } from 'csv-parse/sync';
import { prisma } from '../db.js';
import { HttpError, wrap } from '../lib/errors.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';

// csv import runs in two steps: preview validates and shows what would
// happen, commit applies exactly the rows the preview approved. Export
// writes one row per product using the same column set, so a file can
// round trip between two tenants.

export const catalogIoRouter = Router();

catalogIoRouter.use(requireAuth);

const COLUMNS = [
  'sku',
  'name',
  'description',
  'unit',
  'cost_price',
  'sell_price',
  'tax_class',
  'barcode',
  'category',
  'tags',
] as const;

const rowSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(''),
  unit: z.string().trim().min(1).max(24).default('unit'),
  cost_price: z.coerce.number().min(0).default(0),
  sell_price: z.coerce.number().min(0).default(0),
  tax_class: z.string().trim().max(40).default('standard'),
  barcode: z.string().trim().max(64).default(''),
  category: z.string().trim().max(80).default(''),
  tags: z.string().trim().max(400).default(''),
});

type ImportRow = z.infer<typeof rowSchema>;

type PreviewRow = {
  line: number;
  action: 'create' | 'update' | 'error';
  message?: string;
  data?: ImportRow;
};

async function validateRows(tenantId: string, raw: Record<string, string>[]): Promise<PreviewRow[]> {
  const skusInFile = new Set<string>();
  const existing = await prisma.product.findMany({
    where: { tenantId },
    select: { sku: true },
  });
  const existingSkus = new Set(existing.map((p) => p.sku));

  return raw.map((record, i) => {
    const line = i + 2; // header is line 1
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { line, action: 'error' as const, message: `${issue.path.join('.')}: ${issue.message}` };
    }
    const data = parsed.data;
    if (skusInFile.has(data.sku)) {
      return { line, action: 'error' as const, message: `sku ${data.sku} repeats in the file` };
    }
    skusInFile.add(data.sku);
    return {
      line,
      action: existingSkus.has(data.sku) ? ('update' as const) : ('create' as const),
      data,
    };
  });
}

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

catalogIoRouter.post(
  '/import/preview',
  requirePermission('catalog:manage'),
  csvUpload.single('file'),
  wrap(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'attach a csv file');
    let records: Record<string, string>[];
    try {
      records = parseCsv(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch {
      throw new HttpError(400, 'could not read that file as csv');
    }
    if (records.length === 0) throw new HttpError(400, 'the file has no data rows');
    if (records.length > 2000) throw new HttpError(400, 'keep imports under 2000 rows');

    const rows = await validateRows(req.user!.tenantId, records);
    res.json({
      rows,
      summary: {
        create: rows.filter((r) => r.action === 'create').length,
        update: rows.filter((r) => r.action === 'update').length,
        error: rows.filter((r) => r.action === 'error').length,
      },
    });
  }),
);

catalogIoRouter.post(
  '/import/commit',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = z.object({ rows: z.array(rowSchema).min(1).max(2000) }).parse(req.body);
    const tenantId = req.user!.tenantId;

    // validate again, the preview response is not trusted state
    const checked = await validateRows(
      tenantId,
      body.rows as unknown as Record<string, string>[],
    );
    const bad = checked.find((r) => r.action === 'error');
    if (bad) throw new HttpError(400, `row ${bad.line}: ${bad.message}`);

    // resolve category names up front, creating missing ones
    const names = [...new Set(body.rows.map((r) => r.category).filter(Boolean))];
    const categoryIds = new Map<string, string>();
    for (const name of names) {
      const found =
        (await prisma.category.findFirst({ where: { tenantId, name, parentId: null } })) ??
        (await prisma.category.create({ data: { tenantId, name } }));
      categoryIds.set(name, found.id);
    }

    let created = 0;
    let updated = 0;
    for (const row of checked) {
      const data = row.data!;
      const shared = {
        name: data.name,
        description: data.description,
        unit: data.unit,
        costPrice: data.cost_price,
        sellPrice: data.sell_price,
        taxClass: data.tax_class,
        barcode: data.barcode || null,
        categoryId: data.category ? categoryIds.get(data.category)! : null,
        tags: data.tags
          ? data.tags.split(';').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : [],
      };
      if (row.action === 'update') {
        await prisma.product.update({
          where: { tenantId_sku: { tenantId, sku: data.sku } },
          data: shared,
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            tenantId,
            sku: data.sku,
            ...shared,
            variants: {
              create: {
                tenantId,
                name: 'Default',
                sku: data.sku,
                barcode: data.barcode || null,
                isDefault: true,
              },
            },
          },
        });
        created++;
      }
    }

    res.json({ created, updated });
  }),
);

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

catalogIoRouter.get(
  '/export.csv',
  requirePermission('catalog:read'),
  wrap(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user!.tenantId, isArchived: false },
      orderBy: { sku: 'asc' },
      include: { category: { select: { name: true } } },
    });

    const lines = [COLUMNS.join(',')];
    for (const p of products) {
      lines.push(
        [
          p.sku,
          p.name,
          p.description,
          p.unit,
          String(Number(p.costPrice)),
          String(Number(p.sellPrice)),
          p.taxClass,
          p.barcode ?? '',
          p.category?.name ?? '',
          p.tags.join(';'),
        ]
          .map(csvEscape)
          .join(','),
      );
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(lines.join('\n') + '\n');
  }),
);
