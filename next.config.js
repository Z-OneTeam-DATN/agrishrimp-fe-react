/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: 'dist',
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chat-webapp-nghiadev.s3.ap-southeast-1.amazonaws.com'
      }
    ]
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}

module.exports = nextConfig
