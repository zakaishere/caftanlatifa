import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/:path*`,
      },
    ];
  },

  images: {
    // Allow product images from Cloudinary and any other external CDNs
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    // Serve modern formats (WebP/AVIF) automatically
    formats: ['image/webp', 'image/avif'],
    // Responsive breakpoints matching Tailwind's sm/md/lg/xl
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 128, 256, 384],
    // Allow 1 hour stale-while-revalidate for product images
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
