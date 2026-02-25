import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layoutClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agri Shrimp - Giải pháp nuôi tôm thông minh",
  description: "Hệ thống quản lý Agri Shrimp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
        />
      </head>
      <body className={inter.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
