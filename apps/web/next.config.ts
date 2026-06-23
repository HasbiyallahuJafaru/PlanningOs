import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 *
 * Minimal for Batch 1.1 (scaffold). `reactStrictMode` is on to surface unsafe
 * patterns early. Real config (security headers, image domains, etc.) is added
 * when the web UI is built out in Batch 1.6.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
