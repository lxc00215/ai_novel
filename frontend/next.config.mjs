/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    config.parallelism = 1;
    return config;
  },
  
  images: {
    domains: ['localhost', 'img.leebay.cyou', 'sc-maas.oss-cn-shanghai.aliyuncs.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'img.leebay.cyou',
      },
      {
        protocol: 'https',
        hostname: 'sc-maas.oss-cn-shanghai.aliyuncs.com',
      }
    ],
  },
};

export default nextConfig;