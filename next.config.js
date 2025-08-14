/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true
  },
  // تنظیمات برای standalone output
  output: 'standalone',
  // بهینه‌سازی برای سرور ضعیف
  experimental: {
    optimizeCss: true,
  },
  // کاهش استفاده از رم در build
  swcMinify: true,
  // تنظیمات برای production
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;