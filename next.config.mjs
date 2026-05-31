/** @type {import('next').NextConfig} */

// Security headers applied to every response. These are cheap, high-value
// defenses against clickjacking, MIME-sniffing, referrer leakage and protocol
// downgrade. (No strict CSP yet — Next's inline bootstrap scripts make that
// fragile; the headers below cover the highest-impact risks.)
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig = {
  images: {
    // Restrict the image optimizer to our own Vercel Blob storage. Allowing
    // "**" let the server fetch ANY https URL (SSRF) and optimise it. Avatars
    // are stored as data: URLs (not gated here), so this doesn't break them.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
