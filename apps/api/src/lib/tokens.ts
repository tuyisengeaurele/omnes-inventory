import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../env.js';

export type AccessPayload = {
  sub: string;
  tenantId: string;
  role: Role;
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTtlSeconds });
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
    return { sub: decoded.sub as string, tenantId: decoded.tenantId, role: decoded.role };
  } catch {
    return null;
  }
}

// refresh tokens are opaque random strings, only their hash touches the db
export function newOpaqueToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
