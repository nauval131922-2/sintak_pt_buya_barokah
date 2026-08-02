import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bare '*' ditolak CSRF matcher Next.js → HMR WebSocket dari LAN IP di-403 → reload loop
  allowedDevOrigins: [
    '10.*.*.*',
    '192.168.*.*',
    '172.*.*.*',
    '*.local',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb'
    }
  }
};

export default nextConfig;
