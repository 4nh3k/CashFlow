/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // During the build process, skip TypeScript errors to enable faster builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Disable ESLint during builds for faster builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
