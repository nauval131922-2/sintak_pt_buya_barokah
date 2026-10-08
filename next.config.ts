import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // HSTS tanpa preload: aman bertahap, tak mengunci domain bila TLS belum siap.
  // Aktif penuh (includeSubDomains + preload) setelah domain stabil HTTPS.
  async headers() {
    return process.env.NODE_ENV === 'production'
      ? [
          {
            source: '/:path*',
            headers: [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000',
              },
            ],
          },
        ]
      : [];
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
