/** @type {import('next').NextConfig} */
const internalApiBaseUrl = process.env.JAVA_API_URL ?? "http://api:8004/api";

const nextConfig = {
  output: "standalone",
  distDir: "dist",
  async rewrites() {
    return [
      {
        source: "/be-api/:path*",
        destination: `${internalApiBaseUrl}/:path*`,
      },
      {
        source: "/api/public/:path*",
        destination: `${internalApiBaseUrl}/public/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${internalApiBaseUrl}/webhooks/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "chat-webapp-nghiadev.s3.ap-southeast-1.amazonaws.com",
      },
      // Thêm cấu hình hostname của Cloudinary vào đây
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    webpackBuildWorker: false,
    // Chỉ compile đúng export được dùng thay vì import cả package
    // Giảm số modules cần compile mỗi lần load trang mới
    optimizePackageImports: [

      "framer-motion",
      "recharts",
      "react-chartjs-2",
      "chart.js",
      "embla-carousel-react",
      "embla-carousel-autoplay",
      "@tanstack/react-query",
      "react-hook-form",
      "@hookform/resolvers",
      "sonner",
      "date-fns",
      "zustand",
    ],
  },
};

module.exports = nextConfig;
