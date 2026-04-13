type RoleLike =
  | string
  | {
      slug?: string | null;
    }
  | null
  | undefined;

export const ADMIN_ROLE_SLUGS = ["ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"] as const;
export const MANAGER_ROLE_SLUGS = ["MANAGER", "BRANCH_MANAGER"] as const;

export function normalizeRoleSlug(role: RoleLike): string {
  const rawRole =
    typeof role === "object" && role !== null
      ? role.slug
      : role;

  const normalized = (rawRole || "").toUpperCase().trim();
  return normalized.startsWith("ROLE_") ? normalized.replace("ROLE_", "") : normalized;
}

export function isAdminRole(role: RoleLike): boolean {
  return ADMIN_ROLE_SLUGS.includes(normalizeRoleSlug(role) as (typeof ADMIN_ROLE_SLUGS)[number]);
}

export function isManagerRole(role: RoleLike): boolean {
  return MANAGER_ROLE_SLUGS.includes(normalizeRoleSlug(role) as (typeof MANAGER_ROLE_SLUGS)[number]);
}

export function canManageSystemAdminRoles(role: RoleLike): boolean {
  return isAdminRole(role);
}
