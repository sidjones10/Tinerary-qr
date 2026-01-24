/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Turbopack, use webpack for production builds
  experimental: {
    turbo: undefined,
  },
}

export default nextConfig
