import React from "react";
import { AUTH_PAGE_SURFACE } from "@/components/auth/auth-theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen w-screen flex items-center justify-center ${AUTH_PAGE_SURFACE}`}>
      {children}
    </div>
  );
}
