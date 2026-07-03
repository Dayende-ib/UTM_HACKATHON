import type { NextConfig } from "next";
import path from "path";

function resolveSupabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function resolveBackendUrl(): string | null {
  const configured = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  // On Vercel (VERCEL is always set), silently falling back to localhost would
  // make every proxied /api/* route fail at runtime with no visible error
  // (commerceService.getAll().catch(console.error) swallows it). Fail the
  // build loudly instead so misconfiguration is caught before deploy.
  if (!configured && process.env.VERCEL) {
    throw new Error(
      'BACKEND_URL (or NEXT_PUBLIC_BACKEND_URL) is not set on Vercel. ' +
      'Set it to the deployed backend URL in the frontend project env vars, ' +
      'or every /api/* rewrite will silently fail at runtime.'
    );
  }

  const backend = configured || 'http://localhost:3001';

  try {
    const backendUrl = new URL(backend);
    const frontendHost = process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`) : null;

    if (frontendHost && backendUrl.host === frontendHost.host) {
      return null;
    }

    return backendUrl.toString().replace(/\/$/, '');
  } catch {
    return backend;
  }
}

const supabaseHostname = resolveSupabaseHostname();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      ...(supabaseHostname
        ? [{ protocol: 'https' as const, hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/apple-touch-icon.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  async rewrites() {
    const backend = resolveBackendUrl();

    if (!backend) {
      return [];
    }

    // Each `:path*` rule already matches its own base path with zero segments
    // (e.g. `/api/commerces/:path*` matches plain `/api/commerces`), so a
    // separate exact-match rule for the same base is redundant — and on
    // Vercel, having both creates a routing ambiguity that resolves as a
    // 308 redirect to the exact same URL (infinite loop for the caller).
    return [
      { source: '/api/ai/:path*',        destination: `${backend}/api/ai/:path*` },
      { source: '/api/commerces/:path*', destination: `${backend}/api/commerces/:path*` },
      { source: '/api/categories',       destination: `${backend}/api/categories` },
      { source: '/api/avis/:path*',      destination: `${backend}/api/avis/:path*` },
      { source: '/api/auth/:path*',      destination: `${backend}/api/auth/:path*` },
      { source: '/api/recherche',        destination: `${backend}/api/recherche` },
      { source: '/api/geocoding',        destination: `${backend}/api/geocoding` },
      { source: '/api/upload',           destination: `${backend}/api/upload` },
      { source: '/api/admin/:path*',     destination: `${backend}/api/admin/:path*` },
      { source: '/api/utilisateurs/:path*', destination: `${backend}/api/utilisateurs/:path*` },
    ];
  },
};

export default nextConfig;
