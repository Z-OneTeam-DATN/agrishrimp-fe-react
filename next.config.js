/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  distDir: "dist",
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
    ],
  },
  experimental: {
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
