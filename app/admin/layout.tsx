// app/admin/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AdminSidebarDesktop,
  AdminSidebarMobile,
} from "@/components/admin/admin-sidebar";
import { AdminLayoutContent } from "@/components/admin/admin-layout-content";

export const metadata: Metadata = {
  title: "Admin - RTN",
  description: "หลังบ้านจัดการระบบ",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Suspense fallback={null}>
        <AdminSidebarDesktop />
      </Suspense>

      {/* Main */}
      <AdminLayoutContent>
        {/* Mobile header */}
        <Suspense fallback={null}>
          <AdminSidebarMobile />
        </Suspense>

        <div className="p-6 md:p-8">{children}</div>
      </AdminLayoutContent>
    </div>
  );
}
