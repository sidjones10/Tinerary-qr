/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Turbopack for production builds due to phantom CSS parsing errors
  // Turbopack in Next.js 16 has bugs with CSS parsing that report errors at non-existent line numbers
  experimental: {
    turbo: false,
  },
}

export default nextConfig
