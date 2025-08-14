/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // سرعت بخشیدن به build
  },
  images: {
    unoptimized: true
  },
  // بهینه‌سازی برای کاهش حجم
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // کاهش استفاده از رم در build
  swcMinify: true,
  // حذف source maps برای کاهش حجم
  productionBrowserSourceMaps: false,
  // تنظیمات برای production
  poweredByHeader: false,
  reactStrictMode: false,
  // کاهش حجم bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;