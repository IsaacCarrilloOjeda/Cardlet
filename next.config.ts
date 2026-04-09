import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'ngrok-skip-browser-warning', value: '1' }],
      },
    ]
  },
};

export default nextConfig;
