import type { Role } from '@prisma/client';

// single place that says who can do what. The web app mirrors this to hide
// controls, but this table is the one that actually gets enforced.
export const PERMISSIONS = {
  'team:read': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:manage': ['OWNER', 'ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

// role changes and deactivation respect the hierarchy: admins cannot touch
// owners or other admins, only owners can
const RANK: Record<Role, number> = { OWNER: 3, ADMIN: 2, MANAGER: 1, STAFF: 0 };

export function outranks(actor: Role, target: Role): boolean {
  return RANK[actor] > RANK[target];
}
