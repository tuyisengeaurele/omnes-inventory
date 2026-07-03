import type { NextFunction, Request, Response } from 'express';
import type { Role, User } from '@prisma/client';
import { prisma } from '../db.js';
import { verifyAccessToken } from '../lib/tokens.js';
import { hasPermission, type Permission } from '../lib/permissions.js';
import { HttpError, wrap } from '../lib/errors.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export const requireAuth = wrap(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'sign in to continue');

  const payload = verifyAccessToken(token);
  if (!payload) throw new HttpError(401, 'session expired, sign in again');

  // hit the db so a deactivated user is locked out immediately,
  // not whenever their access token happens to expire
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new HttpError(401, 'account is not active');

  req.user = user;
  next();
});

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !hasPermission(role, permission)) {
      return next(new HttpError(403, 'your role cannot do that'));
    }
    next();
  };
}
