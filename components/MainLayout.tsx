"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show navigation on writer pages
  const isWriterPage = pathname?.startsWith("/writer");
  
  // Don't show footer on writer dashboard pages (but show on /writer/apply)
  const isWriterDashboard = pathname?.startsWith("/writer") && !pathname?.startsWith("/writer/apply");
  
  return (
    <div className="flex flex-col min-h-screen">
      {!isWriterPage && <Navigation />}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {!isWriterDashboard && <Footer />}
    </div>
  );
}
