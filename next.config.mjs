/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    suspense: true,
  },
  dynamicParams: true, // Allow dynamic routes with params
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig;
