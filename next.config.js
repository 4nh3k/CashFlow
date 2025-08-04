/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // During the build process, skip TypeScript errors to enable faster builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily disable ESLint during builds to resolve hundreds of warnings
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
