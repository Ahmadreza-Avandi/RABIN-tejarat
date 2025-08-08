/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Optimize webpack configuration
    config.optimization.minimize = false; // Disable minimization for faster builds
    return config;
  },
  experimental: {
    // Disable experimental features that might cause issues
    optimizeCss: false,
    optimizePackageImports: [], // Use an empty array instead of boolean
  },
};

module.exports = nextConfig;