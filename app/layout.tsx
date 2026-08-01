import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "./layoutClient";

export const metadata: Metadata = {
  title: "Agri Shrimp - Giải pháp nuôi tôm thông minh",
  description: "Hệ thống quản lý Agri Shrimp",
  icons: {
    icon: "/images/logo_arishrimp.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
