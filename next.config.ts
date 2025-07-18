import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize development performance
  experimental: {
    // Reduce memory usage and improve performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
