/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.eholidayer.com' },
      { protocol: 'https', hostname: 'images.eholidayer.com' }
    ]
  }
};

module.exports = nextConfig;
