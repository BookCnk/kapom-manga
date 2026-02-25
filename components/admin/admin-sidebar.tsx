"use client";

import { useState, createContext, useContext, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Sidebar Collapse Context
const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export const useSidebar = () => useContext(SidebarContext);

import {
  LayoutDashboard,
  Receipt,
  Home,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Wallet,
  User,
  Settings,
  LogOut,
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
  { title: "ภาพรวม", href: "/writer/overview", icon: LayoutDashboard },
  { title: "จัดการมังงะ", href: "/writer/comics", icon: BookOpen },
  { title: "กระเป๋าเงิน", href: "/writer/wallet", icon: Wallet },
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
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const sessionToken = localStorage.getItem("session_token") || "";
        if (!sessionToken) return;

        const response = await fetch("/api/writer/wallet", {
          headers: {
            "x-session-token": sessionToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.wallet) {
            // API returns balance, not totalBalance
            setWalletBalance(data.data.wallet.balance || data.data.wallet.totalBalance || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      }
    };

    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest(".user-menu-container")) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const formatCurrency = (amount: number) => {
    // amount is in coins (integer), convert to baht (divide by 100)
    return (amount / 100).toFixed(2);
  };

  return (
    <div
      className={cn(
        "h-full transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64",
        "bg-background/80 backdrop-blur-md",
        "border-r border-border",
      )}>
      {/* Logo/Brand Section */}
      <div
        className={cn(
          "flex items-center border-b border-border bg-background/80 backdrop-blur-md",
          collapsed ? "justify-center px-2 h-16" : "px-6 h-20 flex-col justify-center",
        )}>
        <Link
          href="/writer/overview"
          className={cn(
            "font-bold text-orange-600 transition-all duration-300 hover:text-orange-700",
            collapsed ? "text-lg" : "text-2xl tracking-tighter",
          )}>
          {collapsed ? "RTN" : "RTN"}
        </Link>
        {!collapsed && (
          <p className="text-xs text-muted-foreground mt-0.5">Creator</p>
        )}
      </div>

      {/* Wallet Balance Section */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">ยอดเงินคงเหลือ</p>
            <p className="text-lg font-semibold text-orange-500">
              {walletBalance !== null ? formatCurrency(walletBalance) : "0.00"} บาท
            </p>
          </div>
        </div>
      )}

      {/* User Profile Section */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-border relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center gap-3 hover:bg-accent/50 rounded-lg p-2 transition-colors user-menu-container">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
              {user.name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name || "ผู้ใช้"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isUserMenuOpen && "rotate-90")} />
          </button>
          {isUserMenuOpen && (
            <div className="absolute left-4 right-4 top-full mt-2 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-medium text-foreground">
                  {user.name || user.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">creator</div>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>ยอดเหรียญ: {walletBalance !== null ? formatCurrency(walletBalance) : "0.00"} บาท</span>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}>
                  <User className="w-4 h-4" />
                  โปรไฟล์
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}>
                  <Settings className="w-4 h-4" />
                  ตั้งค่า
                </Link>
              </div>
              <div className="border-t border-border pt-1">
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Menu Label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            เมนูหลัก
          </p>
        </div>
      )}

      <ScrollArea className={cn("flex-1", collapsed && "px-2")}>
        <nav className={cn("space-y-1.5", collapsed ? "p-2" : "p-4")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Special handling for /writer/overview to only match exactly, not subpaths
            const isActive =
              item.href === "/writer/overview"
                ? pathname === "/writer/overview"
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg font-medium transition-colors",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "px-4 py-2.5 text-sm",
                  isActive
                    ? "bg-accent text-foreground border border-border cursor-default"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                title={collapsed ? item.title : undefined}>
                <Icon
                  className={cn(
                    "shrink-0",
                    collapsed ? "h-5 w-5" : "h-4 w-4",
                  )}
                />
                {!collapsed && item.title}
              </Link>
            );
          })}

          <Separator className="my-4" />

          <Link
            href="/"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg font-medium transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5 text-sm",
              "text-muted-foreground hover:bg-accent hover:text-foreground",
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
            "absolute -right-3 top-20 z-10",
            "w-6 h-6 rounded-full",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "shadow-lg hover:bg-primary/90 transition-colors",
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
    <div className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link href="/writer/overview" className="text-xl font-bold text-orange-600 hover:text-orange-700">
          RTN Writer
        </Link>
      </div>

      <div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg hover:bg-accent">
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72">
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
