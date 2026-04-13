"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { normalizeRoleSlug } from "@/lib/roles";

type Role = "ADMIN" | "SUPER_ADMIN" | "ADMINISTRATOR" | "MANAGER" | "BRANCH_MANAGER" | "USER";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard Component
 * Only renders children if the current user has one of the allowed roles.
 */
export const RoleGuard = ({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Normalize role string (handle object or string)
  const userRole = normalizeRoleSlug(user.role) as Role;

  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
