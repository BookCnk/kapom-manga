"use client";

import { useState, createContext, useContext } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sidebar Collapse Context
const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

const useSidebar = () => useContext(SidebarContext);

import {
  LayoutDashboard,
  Images,
  Receipt,
  Home,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { title: "ภาพรวม", href: "/admin", icon: LayoutDashboard },
  { title: "ผลงาน", href: "/admin/portfolio", icon: Images },
  { title: "คอมมิชชั่น", href: "/admin/commission", icon: Receipt },
];

function SidebarContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        "bg-gradient-to-b from-orange-50/90 to-white/80",
        "dark:from-orange-950/30 dark:to-zinc-900/40",
        "backdrop-blur-xl",
        "border-r border-orange-200 dark:border-orange-500/10",
      )}>
      <div
        className={cn(
          "h-16 flex items-center border-b border-orange-500/20 dark:border-orange-500/10 bg-orange-50/80 dark:bg-orange-950/20",
          collapsed ? "justify-center px-2" : "px-6",
        )}>
        <span
          className={cn(
            "font-bold text-orange-600 transition-all duration-300",
            collapsed ? "text-lg" : "text-xl",
          )}>
          {collapsed ? "RTN" : "RTN Admin"}
        </span>
      </div>

      <ScrollArea className={cn("h-[calc(100vh-4rem)]", collapsed && "px-2")}>
        <nav className={cn("space-y-1.5", collapsed ? "p-2" : "p-4")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl font-medium transition",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "px-4 py-2.5 text-sm",
                  "hover:bg-orange-100/80 hover:text-orange-700 dark:hover:bg-orange-500/20 dark:hover:text-orange-400",
                  isActive
                    ? "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-500/25 dark:text-orange-400 dark:border-orange-500/30"
                    : "text-muted-foreground",
                )}
                title={collapsed ? item.title : undefined}>
                <Icon
                  className={cn(
                    "shrink-0",
                    collapsed ? "h-5 w-5" : "h-4 w-4",
                    isActive ? "text-orange-500" : "text-muted-foreground",
                  )}
                />
                {!collapsed && item.title}
              </Link>
            );
          })}

          <Separator className="my-4 bg-orange-200/50 dark:bg-orange-500/20" />

          <Link
            href="/"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl font-medium transition",
              collapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5 text-sm",
              "text-muted-foreground hover:bg-orange-100/60 hover:text-orange-600 dark:hover:bg-orange-500/15 dark:hover:text-orange-400",
            )}
            title={collapsed ? "กลับไปหน้าหลัก" : undefined}>
            <Home
              className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")}
            />
            {!collapsed && "กลับไปหน้าหลัก"}
          </Link>
        </nav>
      </ScrollArea>
    </div>
  );
}

export function AdminSidebarDesktop() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:block transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}>
        <SidebarContent collapsed={collapsed} />

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-20",
            "w-6 h-6 rounded-full",
            "bg-orange-500 text-white",
            "flex items-center justify-center",
            "shadow-lg hover:bg-orange-600 transition-colors",
            "border-2 border-background",
          )}
          title={collapsed ? "ขยาย" : "ยุบ"}>
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </SidebarContext.Provider>
  );
}

export function AdminSidebarMobile() {
  return (
    <div className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Glass header - orange theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-50/90 to-orange-100/70 dark:from-orange-950/40 dark:to-zinc-900/40 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-500/10" />
      <div className="relative flex items-center gap-2">
        <span className="text-xl font-bold text-orange-600">RTN Admin</span>
      </div>

      <div className="relative">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400">
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 border-orange-200 dark:border-orange-500/10">
            <SidebarContent
              onNavigate={() => {
                /* ปิดเองอัตโนมัติใน sheet */
              }}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
