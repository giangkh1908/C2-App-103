import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Toán Trực Quan AI — Gia sư Toán trực quan cho học sinh tiểu học",
    template: "%s | Toán Trực Quan AI",
  },
  description:
    "Ứng dụng AI giúp học sinh lớp 1–5 hiểu bản chất Toán qua hình ảnh, thao tác trực quan và phản hồi tức thì.",
  keywords: [
    "học toán tiểu học",
    "AI gia sư toán",
    "toán trực quan",
    "visual math tutor",
    "học sinh tiểu học",
    "phép nhân",
    "phép chia",
    "phân số",
    "chu vi diện tích",
  ],
  authors: [{ name: "Toán Trực Quan AI" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Toán Trực Quan AI",
    title: "Toán Trực Quan AI — Hiểu sâu bản chất Toán bằng mắt nhìn, chạm thử",
    description:
      "AI không làm bài thay học sinh. AI giúp học sinh hiểu bản chất khái niệm Toán qua Visual Card và Mini Simulation.",
    images: [
      {
        url: "/logo.webp",
        width: 512,
        height: 512,
        alt: "Toán Trực Quan AI logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toán Trực Quan AI — Gia sư Toán trực quan",
    description:
      "Ứng dụng AI giúp học sinh lớp 1–5 hiểu bản chất Toán qua hình ảnh và thao tác trực quan.",
    images: ["/logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Toán Trực Quan AI",
              description:
                "Ứng dụng AI giúp học sinh lớp 1–5 hiểu bản chất Toán qua hình ảnh, thao tác trực quan và phản hồi tức thì.",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              audience: {
                "@type": "EducationalAudience",
                educationalRole: "student",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "VND",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
