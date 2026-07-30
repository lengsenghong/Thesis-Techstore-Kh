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
      { protocol: "https", hostname: "**.onrender.com" },
      // Allow locally-uploaded images served by Spring Boot (development)
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  // Proxy /api and /uploads calls to the Spring Boot backend.
  // BACKEND_URL is server-side only (set on Render); defaults to localhost for dev.
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:8081";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
      // Proxy uploaded product images to Spring Boot
      {
        source: "/uploads/:path*",
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;