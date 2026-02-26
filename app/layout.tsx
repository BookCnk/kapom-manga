import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import TopLoader from "@/components/TopLoader";
import MainLayout from "@/components/MainLayout";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "RTN - Webtoon Platform",
  description: "อ่านการ์ตูน มังฮวา มังงะ ออนไลน์",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-orange-200 selection:text-orange-900 flex flex-col min-h-screen">
        <Providers>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
