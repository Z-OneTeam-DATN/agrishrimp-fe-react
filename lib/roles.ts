import { P } from "@/lib/permissions";

type RoleLike =
  | string
  | {
      slug?: string | null;
    }
  | null
  | undefined;

export const ADMIN_ROLE_SLUGS = ["ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"] as const;
export const MANAGER_ROLE_SLUGS = ["MANAGER", "BRANCH_MANAGER"] as const;

/** Vai trò chỉ dùng workspace (kỹ sư nông nghiệp / tư vấn khách hàng) — trung lập, không thuộc chi nhánh nào. */
const BRANCHLESS_WORKSPACE_PERMISSIONS = [P.AGRONOMIST_WORKSPACE_USE, P.CUSTOMER_ADVISOR_USE] as const;

export function isBranchlessWorkspaceRole(permissionCodes?: string[] | null): boolean {
  if (!permissionCodes || permissionCodes.length === 0) return false;
  return BRANCHLESS_WORKSPACE_PERMISSIONS.some((code) => permissionCodes.includes(code));
}

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
