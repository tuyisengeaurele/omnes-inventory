import type { SessionUser } from './api';

// mirror of apps/api/src/lib/permissions.ts, used only to hide controls.
// the api enforces the real thing.
const PERMISSIONS = {
  'team:read': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:manage': ['OWNER', 'ADMIN'],
  'catalog:read': ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
  'catalog:manage': ['OWNER', 'ADMIN', 'MANAGER'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(user: SessionUser | undefined, permission: Permission): boolean {
  if (!user) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(user.role);
}
