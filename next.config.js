/** @type {import('next').NextConfig} */
function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

// Names have no NEXT_PUBLIC_ prefix so Vercel can store them.
// The env block below still inlines them into the browser bundle.
const apiOrigin = readEnv('API_URL', 'NEXT_PUBLIC_API_URL') || 'http://127.0.0.1:8000';
const appUrl = readEnv('APP_URL', 'NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
const defaultLocale = readEnv('DEFAULT_LOCALE', 'NEXT_PUBLIC_DEFAULT_LOCALE') || 'en';
const googleClientId = readEnv('GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID');

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
  env: {
    API_URL: apiOrigin,
    APP_URL: appUrl,
    DEFAULT_LOCALE: defaultLocale,
    GOOGLE_CLIENT_ID: googleClientId,
  },
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
