import type { Metadata } from "next";
import {
  AdminSidebarDesktop,
  AdminSidebarMobile,
} from "@/components/admin/admin-sidebar";

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
      <AdminSidebarDesktop />

      {/* Main */}
      <main className="md:ml-64">
        {/* Mobile header (glass) */}
        <AdminSidebarMobile />

        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
