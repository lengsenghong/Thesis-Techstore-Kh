/** @type {import('next').NextConfig} */
const nextConfig = {
  // All pages use client-side data fetching — disable static prerendering
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.manus.space" },
      // Allow locally-uploaded images served by Spring Boot (development)
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  // Proxy /api and /uploads calls to the Spring Boot backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/:path*`,
      },
      // Proxy uploaded product images to Spring Boot
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
