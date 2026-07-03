import { Router, type Response } from 'express';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';
import { hashToken, newOpaqueToken, signAccessToken } from '../lib/tokens.js';
import { sendMail, passwordResetMail } from '../lib/mailer.js';
import { HttpError, wrap } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const REFRESH_COOKIE = 'omnes_rt';

const emailField = z.string().email().transform((v) => v.toLowerCase().trim());
const passwordField = z.string().min(8, 'use at least 8 characters');

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
  };
}

async function issueSession(res: Response, user: User) {
  const refresh = newOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh),
      expiresAt: new Date(Date.now() + env.refreshTtlSeconds * 1000),
    },
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/auth',
    maxAge: env.refreshTtlSeconds * 1000,
  });
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } });
  return {
    accessToken: signAccessToken({ sub: user.id, tenantId: user.tenantId, role: user.role }),
    user: publicUser(user),
    tenant: { id: tenant.id, name: tenant.name },
  };
}

authRouter.post(
  '/signup',
  wrap(async (req, res) => {
    const body = z
      .object({
        businessName: z.string().min(2),
        fullName: z.string().min(2),
        email: emailField,
        password: passwordField,
      })
      .parse(req.body);

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: body.businessName } });
      return tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          fullName: body.fullName,
          passwordHash,
          role: 'OWNER',
        },
      });
    });

    res.status(201).json(await issueSession(res, user));
  }),
);

authRouter.post(
  '/login',
  wrap(async (req, res) => {
    const body = z
      .object({
        email: emailField,
        password: z.string().min(1),
        tenantId: z.string().optional(),
      })
      .parse(req.body);

    const candidates = await prisma.user.findMany({
      where: { email: body.email, isActive: true, ...(body.tenantId ? { tenantId: body.tenantId } : {}) },
      include: { tenant: true },
    });

    const matches: typeof candidates = [];
    for (const candidate of candidates) {
      if (await verifyPassword(body.password, candidate.passwordHash)) matches.push(candidate);
    }

    if (matches.length === 0) throw new HttpError(401, 'wrong email or password');

    // the same email can exist in more than one workspace, ask which one
    if (matches.length > 1) {
      return res.status(300).json({
        pickTenant: matches.map((m) => ({ tenantId: m.tenantId, tenantName: m.tenant.name })),
      });
    }

    res.json(await issueSession(res, matches[0]));
  }),
);

authRouter.post(
  '/refresh',
  wrap(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) throw new HttpError(401, 'no session');

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
    if (!stored) throw new HttpError(401, 'no session');

    // a revoked token coming back means it leaked or was replayed,
    // drop every session for that user
    if (stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new HttpError(401, 'session invalid, sign in again');
    }
    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new HttpError(401, 'session expired, sign in again');
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    res.json(await issueSession(res, stored.user));
  }),
);

authRouter.post(
  '/logout',
  wrap(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    res.json({ ok: true });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: req.user!.tenantId } });
    res.json({ user: publicUser(req.user!), tenant: { id: tenant.id, name: tenant.name } });
  }),
);

authRouter.post(
  '/forgot-password',
  wrap(async (req, res) => {
    const body = z.object({ email: emailField }).parse(req.body);
    const users = await prisma.user.findMany({ where: { email: body.email, isActive: true } });

    for (const user of users) {
      const token = newOpaqueToken();
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await sendMail(passwordResetMail(user.email, token));
    }

    // same answer whether the email exists or not
    res.json({ ok: true });
  }),
);

authRouter.post(
  '/reset-password',
  wrap(async (req, res) => {
    const body = z.object({ token: z.string().min(1), password: passwordField }).parse(req.body);

    const reset = await prisma.passwordReset.findUnique({
      where: { tokenHash: hashToken(body.token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new HttpError(400, 'this reset link is no longer valid, request a new one');
    }

    const passwordHash = await hashPassword(body.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      // a password change signs out every open session
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  }),
);

authRouter.post(
  '/accept-invite',
  wrap(async (req, res) => {
    const body = z
      .object({ token: z.string().min(1), fullName: z.string().min(2), password: passwordField })
      .parse(req.body);

    const invite = await prisma.invite.findUnique({ where: { tokenHash: hashToken(body.token) } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new HttpError(400, 'this invite is no longer valid, ask for a new one');
    }

    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: invite.tenantId, email: invite.email } },
    });
    if (existing) throw new HttpError(409, 'this email already has an account in the workspace');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.$transaction(async (tx) => {
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return tx.user.create({
        data: {
          tenantId: invite.tenantId,
          email: invite.email,
          fullName: body.fullName,
          passwordHash,
          role: invite.role,
        },
      });
    });

    res.status(201).json(await issueSession(res, user));
  }),
);
