import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Anciennes pages (versions ≤ 0.3) : la vue technique vit désormais dans NetBox.
const RETIRED_PAGES = [
  '/applications', '/flux', '/network', '/quality', '/incident', '/incidents', '/simulation',
  '/simulation-incident', '/netbox-reconciliation', '/unauthorized',
  '/admin-metier', '/admin-flux', '/admin-infra', '/admin-trigramme', '/admin-habilitations', '/admin-netbox-reconciliation',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async redirects() {
    return RETIRED_PAGES.map(source => ({ source, destination: '/', permanent: false }));
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
