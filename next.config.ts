import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HSTS: paksa HTTPS bila diakses via TLS (didukung Secure cookie unconditional)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
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
