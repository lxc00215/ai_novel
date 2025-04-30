/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
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