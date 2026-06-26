import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  eslint: {
    // Disable ESLint during build (CI/CD will fail on warnings)
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Disable TypeScript strict checking during build
    ignoreBuildErrors: false, // Keep this false to catch real type errors
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb'
    }
  }

};

export default nextConfig;
