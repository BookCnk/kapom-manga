"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types/client-enums";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If not logged in → ส่งไปหน้า login พร้อม redirect กลับมาหน้านักเขียนเดิม
    if (!user) {
      if (pathname === "/login") return;
      const redirectPath = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirectPath}`);
      return;
    }

    // ถ้าเป็น USER ธรรมดา → ไม่ให้เข้าหน้านักเขียน ส่งไปหน้า /writer/apply (ยกเว้นตอนอยู่ที่ apply แล้ว)
    if (
      user.role === UserRole.USER &&
      pathname &&
      !pathname.startsWith("/writer/apply")
    ) {
      router.replace("/writer/apply");
      return;
    }
  }, [user, loading, router, pathname]);

  // ระหว่างโหลดสถานะหรือกำลัง redirect แสดง spinner ไว้ก่อน
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // USER ที่ยังไม่เป็นนักเขียนจะถูก redirect ไป /writer/apply ใน useEffect ด้านบน
  if (user.role === UserRole.USER && pathname !== "/writer/apply") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
