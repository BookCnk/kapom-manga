/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: '72.61.208.81',
        port: '9000',
        pathname: '/manga-images/**',
      },
    ],
  },
}

module.exports = nextConfig
