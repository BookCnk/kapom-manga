"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show navigation on writer pages
  const isWriterPage = pathname?.startsWith("/writer");
  
  return (
    <>
      {!isWriterPage && <Navigation />}
      {children}
    </>
  );
}
