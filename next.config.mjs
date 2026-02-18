/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  output: "standalone",
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || undefined,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"]
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60
  }
};

export default nextConfig;
