import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // No redirects: use `/organizations/:id` as public canonical route
  async redirects() {
    return [
      {
        source: "/dashboard/organizations/:id",
        destination: "/organizations/:id",
        permanent: true,
      },
      {
        source: "/dashboard/customer",
        destination: "/dashboard/client",
        permanent: true,
      },
      {
        source: "/dashboard/customer/:path*",
        destination: "/dashboard/client/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig