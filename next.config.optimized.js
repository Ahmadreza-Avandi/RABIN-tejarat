/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true
    },

    // بهینه‌سازی برای کاهش حجم bundle
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            'recharts',
            'date-fns'
        ],
    },

    // تنظیمات compiler
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // SWC minification
    swcMinify: true,

    // حذف source maps در production
    productionBrowserSourceMaps: false,

    // تنظیمات performance
    poweredByHeader: false,
    reactStrictMode: false,

    // Standalone output برای Docker
    output: 'standalone',

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            // Tree shaking بهتر
            config.optimization.usedExports = true;

            // Code splitting بهتر
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            };
        }

        return config;
    },

    // Headers برای caching
    async headers() {
        return [
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;