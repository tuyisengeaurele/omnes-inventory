import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError, wrap } from '../lib/errors.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get(
  '/',
  requirePermission('catalog:read'),
  wrap(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, parentId: true, _count: { select: { products: true } } },
    });
    res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        productCount: c._count.products,
      })),
    });
  }),
);

const categoryBody = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: z.string().nullish(),
});

async function assertParent(tenantId: string, parentId: string) {
  const parent = await prisma.category.findFirst({ where: { id: parentId, tenantId } });
  if (!parent) throw new HttpError(400, 'parent category does not exist');
}

categoriesRouter.post(
  '/',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = categoryBody.parse(req.body);
    const tenantId = req.user!.tenantId;
    if (body.parentId) await assertParent(tenantId, body.parentId);
    const category = await prisma.category.create({
      data: { tenantId, name: body.name, parentId: body.parentId ?? null },
    });
    res.status(201).json({ category });
  }),
);

categoriesRouter.patch(
  '/:id',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const body = categoryBody.partial().parse(req.body);
    const tenantId = req.user!.tenantId;
    const existing = await prisma.category.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new HttpError(404, 'no such category');

    if (body.parentId) {
      await assertParent(tenantId, body.parentId);
      // walk up from the new parent, a category cannot become its own ancestor
      let cursor: string | null = body.parentId;
      while (cursor) {
        if (cursor === existing.id) throw new HttpError(400, 'that would make a category loop');
        const parent: { parentId: string | null } | null = await prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
        cursor = parent?.parentId ?? null;
      }
    }

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: { name: body.name, parentId: body.parentId === undefined ? undefined : body.parentId },
    });
    res.json({ category });
  }),
);

categoriesRouter.delete(
  '/:id',
  requirePermission('catalog:manage'),
  wrap(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, tenantId },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!existing) throw new HttpError(404, 'no such category');
    if (existing._count.children > 0) throw new HttpError(409, 'move or delete its subcategories first');
    if (existing._count.products > 0) throw new HttpError(409, 'move its products first');

    await prisma.category.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);
