/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        '@univerjs/core',
        '@univerjs/docs',
        '@univerjs/docs-ui',
        '@univerjs/engine-render',
        '@univerjs/sheets',
        '@univerjs/sheets-ui',
        '@univerjs/sheets-formula',
        '@univerjs/sheets-formula-ui',
        '@univerjs/ui',
        '@univerjs/network',
        '@univerjs/multitenant-collaboration',
    ],
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
};

module.exports = nextConfig;
