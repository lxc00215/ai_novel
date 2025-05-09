import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
      },
      {
        protocol: 'https',
        hostname: 'img.leebay.cyou',
      },
      {
        protocol: 'https',
        hostname: 'sc-maas.oss-cn-shanghai.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '249595.xyz',
      }

    ],
    domains: ['249595.xyz'], // 允许的域名
  },
};

export default nextConfig;
