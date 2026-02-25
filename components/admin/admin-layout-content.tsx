"use client";

import { useSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={cn(
        "transition-all duration-300 ease-in-out",
        collapsed ? "md:ml-16" : "md:ml-64",
      )}>
      {children}
    </main>
  );
}
