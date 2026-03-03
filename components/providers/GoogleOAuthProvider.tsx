"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

export default function GoogleAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    console.warn(
      "Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong .env.local — Google Login sẽ bị vô hiệu hoá.",
    );
  }

  // Luôn render provider để tránh crash "must be used within GoogleOAuthProvider"
  // khi hook useGoogleLogin được gọi bên trong children
  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}
