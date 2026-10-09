/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function uploadProxyOrigin() {
  try {
    const url = new URL(apiOrigin);
    // localhost often resolves to IPv6 (::1). The API listens on IPv4.
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    return url.origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${uploadProxyOrigin()}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
