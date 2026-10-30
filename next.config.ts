import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited pages in the browser for 30 s, so switching back and forth between tabs needs no server request.
    // Our own changes (Server Actions) clear the cache immediately, changes by others show up after 30 s at the latest.
    staleTimes: { dynamic: 30 },
  },
  // The Python API (backend/): locally its own server (npm run dev), on Vercel the function in api/index.py
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api/v1/:path*" : "/api/",
      },
    ];
  },
  // Old German paths, e.g. from bookmarks
  async redirects() {
    return [
      { source: "/kalkulator", destination: "/calculator", permanent: true },
      { source: "/daten", destination: "/data", permanent: true },
      { source: "/shows/vorlagen", destination: "/shows/templates", permanent: true },
    ];
  },
};

// Loads the messages for each request from src/i18n/request.ts
export default createNextIntlPlugin()(nextConfig);
