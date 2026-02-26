// app/writer/layout.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types/client-enums";

// Layout หลักของ /writer
// - บังคับให้ทุกหน้าต้องล็อกอิน
// - USER ธรรมดา (ยังไม่เป็นนักเขียน) จะถูกส่งไปหน้า /writer/apply เสมอ
// - หน้าดาชบอร์ดนักเขียนจริง ๆ ใช้ layout แยกใน route group (dashboard) แทน
export default function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // ยังไม่ล็อกอิน → ส่งไปหน้า login
    if (!user) {
      const redirectPath = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirectPath}`);
      return;
    }

    // USER ธรรมดา → อนุญาตให้เข้าได้แค่ /writer/apply เท่านั้น
    if (
      user.role === UserRole.USER &&
      pathname &&
      !pathname.startsWith("/writer/apply")
    ) {
      router.replace("/writer/apply");
    }
  }, [user, loading, router, pathname]);

  const isApplyPage = pathname?.startsWith("/writer/apply");
  const isUserWriterBlocked =
    !loading && user && user.role === UserRole.USER && !isApplyPage;

  // ระหว่างเช็คสถานะ / กำลัง redirect แสดง spinner ไว้ก่อน
  if (loading || !user || isUserWriterBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
