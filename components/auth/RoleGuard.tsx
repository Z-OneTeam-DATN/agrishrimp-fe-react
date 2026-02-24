"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";

type Role = "ADMIN" | "MANAGER" | "USER";

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
  const userRole = (typeof user.role === "object" ? user.role?.slug : user.role)?.toUpperCase() as Role;

  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
