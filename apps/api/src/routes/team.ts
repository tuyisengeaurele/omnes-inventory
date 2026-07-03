import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { hashToken, newOpaqueToken } from '../lib/tokens.js';
import { sendMail, inviteMail } from '../lib/mailer.js';
import { HttpError, wrap } from '../lib/errors.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { outranks } from '../lib/permissions.js';

export const teamRouter = Router();

teamRouter.use(requireAuth);

teamRouter.get(
  '/',
  requirePermission('team:read'),
  wrap(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [users, invites] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.invite.findMany({
        where: { tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
      }),
    ]);
    res.json({ users, invites });
  }),
);

teamRouter.post(
  '/invites',
  requirePermission('team:manage'),
  wrap(async (req, res) => {
    const body = z
      .object({
        email: z.string().email().transform((v) => v.toLowerCase().trim()),
        role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
      })
      .parse(req.body);

    // only owners hand out admin
    if (body.role === 'ADMIN' && req.user!.role !== 'OWNER') {
      throw new HttpError(403, 'only the owner can invite admins');
    }

    const tenantId = req.user!.tenantId;
    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: body.email } },
    });
    if (existingUser) throw new HttpError(409, 'that email already has an account here');

    const pending = await prisma.invite.findFirst({
      where: { tenantId, email: body.email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pending) throw new HttpError(409, 'there is already a pending invite for that email');

    const token = newOpaqueToken();
    const invite = await prisma.invite.create({
      data: {
        tenantId,
        email: body.email,
        role: body.role,
        tokenHash: hashToken(token),
        invitedById: req.user!.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    await sendMail(inviteMail(body.email, tenant.name, token));

    res.status(201).json({
      invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
      // handy in local dev with the console mail transport
      ...(env.nodeEnv === 'development' ? { acceptUrl: `${env.webUrl}/accept-invite?token=${token}` } : {}),
    });
  }),
);

async function findTargetUser(tenantId: string, id: string) {
  const target = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!target) throw new HttpError(404, 'no such user in this workspace');
  return target;
}

teamRouter.post(
  '/users/:id/deactivate',
  requirePermission('team:manage'),
  wrap(async (req, res) => {
    const target = await findTargetUser(req.user!.tenantId, req.params.id);
    if (target.id === req.user!.id) throw new HttpError(400, 'you cannot deactivate yourself');
    if (!outranks(req.user!.role, target.role)) {
      throw new HttpError(403, 'you cannot deactivate someone at or above your role');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: target.id }, data: { isActive: false } }),
      prisma.refreshToken.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    res.json({ ok: true });
  }),
);

teamRouter.post(
  '/users/:id/reactivate',
  requirePermission('team:manage'),
  wrap(async (req, res) => {
    const target = await findTargetUser(req.user!.tenantId, req.params.id);
    if (!outranks(req.user!.role, target.role)) {
      throw new HttpError(403, 'you cannot reactivate someone at or above your role');
    }
    await prisma.user.update({ where: { id: target.id }, data: { isActive: true } });
    res.json({ ok: true });
  }),
);
