import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { HttpError, wrap } from '../lib/errors.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);

// prisma decimals come back as objects, the client wants plain numbers
function money(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

const productBody = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).default(''),
  unit: z.string().trim().min(1).max(24).default('unit'),
  costPrice: z.number().min(0).default(0),
  sellPrice: z.number().min(0).default(0),
  taxClass: z.string().trim().max(40).default('standard'),
  barcode: z.string().trim().max(64).nullish(),
  categoryId: z.string().nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        sku: z.string().trim().min(1).max(64),
        attributes: z.record(z.string()).default({}),
        barcode: z.string().trim().max(64).nullish(),
      }),
    )
    .max(50)
    .optional(),
});

async function assertCategory(tenantId: string, categoryId: string) {
  const found = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  if (!found) throw new HttpError(400, 'that category does not exist');
}

productsRouter.get(
  '/',
  requirePermission('catalog:read'),
  wrap(async (req, res) => {
    const q = z
      .object({
        search: z.string().trim().max(120).optional(),
        categoryId: z.string().optional(),
        archived: z.enum(['true', 'false']).default('false'),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(req.query);

    const where: Prisma.ProductWhereInput = {
      tenantId: req.user!.tenantId,
      isArchived: q.archived === 'true',
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { sku: { contains: q.search, mode: 'insensitive' } },
              { barcode: { contains: q.search, mode: 'insensitive' } },
              { tags: { has: q.search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          category: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1, select: { fileName: true } },
          _count: { select: { variants: true } },
        },
      }),
    ]);

    res.json({
      total,
      page: q.page,
      pageSize: q.pageSize,
      items: items.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costPrice: money(p.costPrice),
        sellPrice: money(p.sellPrice),
        taxClass: p.taxClass,
        tags: p.tags,
        category: p.category,
        isArchived: p.isArchived,
        variantCount: p._count.variants,
        primaryImage: p.images[0]?.fileName ?? null,
      })),
    });
  }),
);

async function loadProduct(tenantId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: {
      category: { select: { id: true, name: true } },
      variants: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      images: { orderBy: { position: 'asc' } },
    },
  });
  if (!product) throw new HttpError(404, 'no such product');
  return product;
}

function productJson(p: Awaited<ReturnType<typeof loadProduct>>) {
  return {
    ...p,
    costPrice: money(p.costPrice),
    sellPrice: money(p.sellPrice),
  };
}

productsRouter.get(
  '/:id',
  requirePermission('catalog:read'),
  wrap(async (req, res) => {
    const product = await loadProduct(req.user!.tenantId, req.params.id);
    res.json({ product: productJson(product) });
  }),
);

productsRouter.post(
  '/',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = productBody.parse(req.body);
    const tenantId = req.user!.tenantId;
    if (body.categoryId) await assertCategory(tenantId, body.categoryId);

    const variantInputs = body.variants?.length
      ? body.variants
      : [{ name: 'Default', sku: body.sku, attributes: {}, barcode: body.barcode ?? null }];

    const skus = [body.sku, ...variantInputs.map((v) => v.sku)];
    const clash = await prisma.productVariant.findFirst({
      where: { tenantId, sku: { in: variantInputs.map((v) => v.sku) } },
    });
    const productClash = await prisma.product.findFirst({
      where: { tenantId, sku: { in: skus } },
    });
    if (clash || productClash) throw new HttpError(409, 'one of those SKUs is already taken');
    if (new Set(variantInputs.map((v) => v.sku)).size !== variantInputs.length) {
      throw new HttpError(400, 'variant SKUs repeat inside the request');
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        sku: body.sku,
        name: body.name,
        description: body.description,
        unit: body.unit,
        costPrice: body.costPrice,
        sellPrice: body.sellPrice,
        taxClass: body.taxClass,
        barcode: body.barcode ?? null,
        categoryId: body.categoryId ?? null,
        tags: body.tags.map((t) => t.toLowerCase()),
        variants: {
          create: variantInputs.map((v, i) => ({
            tenantId,
            name: v.name,
            sku: v.sku,
            attributes: v.attributes ?? {},
            barcode: v.barcode ?? null,
            isDefault: i === 0 && !body.variants?.length,
          })),
        },
      },
    });

    const full = await loadProduct(tenantId, product.id);
    res.status(201).json({ product: productJson(full) });
  }),
);

productsRouter.patch(
  '/:id',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = productBody.omit({ variants: true }).partial().parse(req.body);
    const tenantId = req.user!.tenantId;
    const existing = await loadProduct(tenantId, req.params.id);
    if (body.categoryId) await assertCategory(tenantId, body.categoryId);

    if (body.sku && body.sku !== existing.sku) {
      const clash = await prisma.product.findFirst({
        where: { tenantId, sku: body.sku, id: { not: existing.id } },
      });
      if (clash) throw new HttpError(409, 'that SKU is already taken');
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existing.id },
        data: {
          ...body,
          barcode: body.barcode === undefined ? undefined : (body.barcode ?? null),
          categoryId: body.categoryId === undefined ? undefined : (body.categoryId ?? null),
          tags: body.tags?.map((t) => t.toLowerCase()),
        },
      });
      // a lone default variant mirrors the product sku and barcode
      const lone = existing.variants.length === 1 && existing.variants[0].isDefault;
      if (lone && (body.sku || body.barcode !== undefined)) {
        await tx.productVariant.update({
          where: { id: existing.variants[0].id },
          data: {
            sku: body.sku ?? undefined,
            barcode: body.barcode === undefined ? undefined : (body.barcode ?? null),
          },
        });
      }
    });

    const full = await loadProduct(tenantId, existing.id);
    res.json({ product: productJson(full) });
  }),
);

productsRouter.post(
  '/:id/archive',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const existing = await loadProduct(req.user!.tenantId, req.params.id);
    await prisma.product.update({ where: { id: existing.id }, data: { isArchived: true } });
    res.json({ ok: true });
  }),
);

productsRouter.post(
  '/:id/unarchive',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const existing = await loadProduct(req.user!.tenantId, req.params.id);
    await prisma.product.update({ where: { id: existing.id }, data: { isArchived: false } });
    res.json({ ok: true });
  }),
);

// ---- variants ----

const variantBody = z.object({
  name: z.string().trim().min(1).max(80),
  sku: z.string().trim().min(1).max(64),
  attributes: z.record(z.string()).default({}),
  barcode: z.string().trim().max(64).nullish(),
});

productsRouter.post(
  '/:id/variants',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = variantBody.parse(req.body);
    const tenantId = req.user!.tenantId;
    const product = await loadProduct(tenantId, req.params.id);

    const clash = await prisma.productVariant.findFirst({ where: { tenantId, sku: body.sku } });
    if (clash) throw new HttpError(409, 'that SKU is already taken');

    const variant = await prisma.productVariant.create({
      data: {
        tenantId,
        productId: product.id,
        name: body.name,
        sku: body.sku,
        attributes: body.attributes,
        barcode: body.barcode ?? null,
      },
    });
    res.status(201).json({ variant });
  }),
);

productsRouter.patch(
  '/:id/variants/:variantId',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = variantBody.partial().parse(req.body);
    const tenantId = req.user!.tenantId;
    const product = await loadProduct(tenantId, req.params.id);
    const variant = product.variants.find((v) => v.id === req.params.variantId);
    if (!variant) throw new HttpError(404, 'no such variant');

    if (body.sku && body.sku !== variant.sku) {
      const clash = await prisma.productVariant.findFirst({
        where: { tenantId, sku: body.sku, id: { not: variant.id } },
      });
      if (clash) throw new HttpError(409, 'that SKU is already taken');
    }

    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        name: body.name,
        sku: body.sku,
        attributes: body.attributes,
        barcode: body.barcode === undefined ? undefined : (body.barcode ?? null),
      },
    });
    res.json({ variant: updated });
  }),
);

productsRouter.delete(
  '/:id/variants/:variantId',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const product = await loadProduct(req.user!.tenantId, req.params.id);
    const variant = product.variants.find((v) => v.id === req.params.variantId);
    if (!variant) throw new HttpError(404, 'no such variant');
    if (variant.isDefault) throw new HttpError(400, 'the default variant stays with the product');
    if (product.variants.length === 1) throw new HttpError(400, 'a product needs at least one variant');
    // once stock lands in phase 3 this also refuses when the variant holds stock
    await prisma.productVariant.delete({ where: { id: variant.id } });
    res.json({ ok: true });
  }),
);

// ---- images ----

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(env.uploadDir, req.user!.tenantId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${IMAGE_TYPES[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_TYPES[file.mimetype]) return cb(new HttpError(400, 'jpg, png or webp only'));
    cb(null, true);
  },
});

productsRouter.post(
  '/:id/images',
  requirePermission('catalog:manage'),
  imageUpload.array('images', 8),
  wrap(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const product = await loadProduct(tenantId, req.params.id);
    const files = (req.files ?? []) as Express.Multer.File[];
    if (files.length === 0) throw new HttpError(400, 'no images in the request');

    const startPos = product.images.length;
    const created = await prisma.$transaction(
      files.map((file, i) =>
        prisma.productImage.create({
          data: {
            tenantId,
            productId: product.id,
            fileName: `${tenantId}/${file.filename}`,
            position: startPos + i,
            isPrimary: startPos === 0 && i === 0,
          },
        }),
      ),
    );
    res.status(201).json({ images: created });
  }),
);

productsRouter.patch(
  '/:id/images/order',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = z.object({ order: z.array(z.string()).min(1) }).parse(req.body);
    const product = await loadProduct(req.user!.tenantId, req.params.id);
    const ids = new Set(product.images.map((i) => i.id));
    if (body.order.length !== ids.size || body.order.some((id) => !ids.has(id))) {
      throw new HttpError(400, 'order must list every image of this product exactly once');
    }
    await prisma.$transaction(
      body.order.map((id, position) =>
        prisma.productImage.update({ where: { id }, data: { position } }),
      ),
    );
    res.json({ ok: true });
  }),
);

productsRouter.post(
  '/:id/images/:imageId/primary',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const product = await loadProduct(req.user!.tenantId, req.params.id);
    const image = product.images.find((i) => i.id === req.params.imageId);
    if (!image) throw new HttpError(404, 'no such image');
    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId: product.id }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: image.id }, data: { isPrimary: true } }),
    ]);
    res.json({ ok: true });
  }),
);

productsRouter.delete(
  '/:id/images/:imageId',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const product = await loadProduct(req.user!.tenantId, req.params.id);
    const image = product.images.find((i) => i.id === req.params.imageId);
    if (!image) throw new HttpError(404, 'no such image');

    await prisma.productImage.delete({ where: { id: image.id } });
    fs.promises.unlink(path.join(env.uploadDir, image.fileName)).catch(() => {
      // already gone from disk is fine
    });
    // keep one image marked primary if any remain
    if (image.isPrimary) {
      const next = product.images.find((i) => i.id !== image.id);
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }
    res.json({ ok: true });
  }),
);
