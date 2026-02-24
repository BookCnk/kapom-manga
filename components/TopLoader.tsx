"use client";

import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // key เปลี่ยนทุกครั้งที่ path หรือ query เปลี่ยน เพื่อให้ animation เริ่มใหม่
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] pointer-events-none">
      <div key={key} className="top-progress-bar" />
    </div>
  );
}

