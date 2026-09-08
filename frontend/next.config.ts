import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  serverExternalPackages: ['pdfreader', 'pdf2json'],
  outputFileTracingIncludes: {
    '/account/setup': ['./node_modules/pdfreader/**/*', './node_modules/pdf2json/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ]
  }
};

export default nextConfig;
