import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img5.lalafo.com',
      },
    ],
  },
}

export default nextConfig
