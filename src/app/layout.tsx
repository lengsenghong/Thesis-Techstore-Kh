import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

// Force all pages to be dynamically rendered (no static prerendering)
// This is required because all pages use client-side data fetching via React Query
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TechStore KH — Cambodia's Premier Tech Store",
  description: "Shop the latest laptops, gaming PCs, components, and accessories. Fast delivery across Cambodia.",
  keywords: ["tech store", "Cambodia", "laptops", "gaming", "computers", "Phnom Penh"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
