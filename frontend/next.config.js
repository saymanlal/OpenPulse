/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei'
  ],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'utf-8-validate': false,
      bufferutil: false,
    };

    return config;
  },
};

module.exports = nextConfig;