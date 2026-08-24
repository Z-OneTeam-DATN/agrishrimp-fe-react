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

const thirdPartyErrorShield = `
(function () {
  function isBenignInjectedScriptError(message, source) {
    var text = String(message || "");
    var file = String(source || "");

    return (
      file.indexOf("share-modal.js") !== -1 ||
      (text.indexOf("Cannot read properties of null") !== -1 &&
        text.indexOf("addEventListener") !== -1)
    );
  }

  window.addEventListener(
    "error",
    function (event) {
      if (isBenignInjectedScriptError(event.message, event.filename)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      var reason = event.reason || {};
      if (isBenignInjectedScriptError(reason.message || reason, reason.fileName || reason.sourceURL)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  var previousOnError = window.onerror;
  window.onerror = function (message, source) {
    if (isBenignInjectedScriptError(message, source)) {
      return true;
    }

    if (typeof previousOnError === "function") {
      return previousOnError.apply(this, arguments);
    }

    return false;
  };
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          id="third-party-error-shield"
          dangerouslySetInnerHTML={{ __html: thirdPartyErrorShield }}
        />
      </head>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
