/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // In production, we want minimization for better performance
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimize = true;
    } else {
      // Disable minimization for faster development builds
      config.optimization.minimize = false;
    }
    return config;
  },
  experimental: {
    // Disable experimental features that might cause issues
    optimizeCss: false,
    optimizePackageImports: [], // Use an empty array instead of boolean
  },
};

module.exports = nextConfig;