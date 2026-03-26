/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  turbopack: {},
  experimental: {
    turbo: {
      resolveAlias: {
        'utf-8-validate': { browser: './empty-module.js' },
        'bufferutil':     { browser: './empty-module.js' },
      },
    },
  },
};

module.exports = nextConfig;