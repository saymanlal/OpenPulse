const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  output: "standalone",

  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,

      // ✅ FIX PATH ALIAS
      "@": path.resolve(__dirname),

      // ✅ optional native deps fix
      "utf-8-validate": false,
      bufferutil: false,
    };

    return config;
  },
};

module.exports = nextConfig;