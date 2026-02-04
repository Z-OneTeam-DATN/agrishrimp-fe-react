
"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

export default function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    console.error("Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong .env.local");
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}