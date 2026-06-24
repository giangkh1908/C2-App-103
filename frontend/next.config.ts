import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Google Identity Services (GIS) dùng window.postMessage giữa popup và opener
  // để truyền credential. COOP mặc định `same-origin` chặn postMessage này, gây
  // cảnh báo "Cross-Origin-Opener-Policy policy would block the window.postMessage
  // call" và Google Sign-In không hoàn tất. Đổi sang `same-origin-allow-popups`
  // cho phép GIS postMessage mà vẫn giữ isolation cơ bản.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
