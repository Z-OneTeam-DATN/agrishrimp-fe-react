import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layoutClient";

// Trang trước đây chỉ khai `font-family: "Inter"` suông trong globals.css mà không thực sự nạp
// font nào — trình duyệt phải tự tìm font "Inter" cài sẵn trên máy, và ở các đoạn chữ đậm/đen
// (font-black) có dấu tiếng Việt, nhiều máy không có đủ bộ glyph nên trình duyệt âm thầm thay
// bằng font hệ thống khác (nhìn khác hẳn phần chữ thường), gây lệch font ngay trong cùng 1 trang.
// next/font tự tải file font thật (đủ trọng số + subset "vietnamese") nên toàn bộ trang dùng
// đúng 1 font nhất quán.
const inter = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <head />
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
