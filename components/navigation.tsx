"use client";

import Link from "next/link";
import {
  Search,
  Bookmark,
  User,
  Sun,
  Moon,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

/* ✅ เพิ่ม dropdown */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { label: "หน้าแรก", href: "/" },
  { label: "อัพเดท", href: "#" },
  { label: "ยอดฮิต", href: "#" },
  { label: "หมวดหมู่", href: "#" },
];

function Brand() {
  return (
    <Link
      href="/"
      className="text-2xl tracking-tighter font-medium text-orange-600 flex-shrink-0">
      RTN
    </Link>
  );
}

function DesktopLinks() {
  return (
    <div className="hidden md:flex items-center gap-6">
      {NAV_LINKS.map((item) => {
        const isHome = item.href === "/";
        return (
          <Link
            key={item.label}
            href={item.href}
            className={
              isHome
                ? "text-sm font-medium text-orange-600"
                : "text-sm text-muted-foreground hover:text-foreground transition-colors"
            }>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function DesktopSearch() {
  return (
    <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
      <input
        type="text"
        placeholder="ค้นหาชื่อเรื่อง..."
        className="w-full pl-10 pr-4 py-2 bg-muted border border-transparent rounded-full text-sm focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
      />
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = useMemo(() => {
    if (!mounted) return "light";
    return theme === "system" ? systemTheme : theme;
  }, [mounted, theme, systemTheme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      disabled={!mounted}>
      {mounted && currentTheme === "dark" ? (
        <Sun className="w-[22px] h-[22px]" />
      ) : (
        <Moon className="w-[22px] h-[22px]" />
      )}
    </button>
  );
}

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Brand />
            <DesktopLinks />
          </div>

          <DesktopSearch />

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Bookmark */}
            <button className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground relative">
              <Bookmark className="w-[22px] h-[22px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-background" />
            </button>

            <div className="hidden sm:block w-px h-5 bg-border mx-1" />

            {/* 🔥 Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="group p-0 h-auto hover:bg-transparent">
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                    <User className="w-[18px] h-[18px] text-muted-foreground group-hover:text-orange-500 transition-colors" />
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="
    w-56 
    rounded-2xl 
    border border-border 
    bg-card/95 backdrop-blur-md 
    shadow-xl 
    p-2
  ">
                <DropdownMenuItem asChild>
                  <Link
                    href="/login"
                    className="
        flex items-center gap-2
        rounded-xl px-3 py-2
        text-sm font-medium
        transition-all
        hover:bg-primary/10
        hover:text-primary
      ">
                    <LogIn className="h-4 w-4" />
                    เข้าสู่ระบบ
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/register"
                    className="
        flex items-center gap-2
        rounded-xl px-3 py-2
        text-sm font-medium
        transition-all
        hover:bg-muted
      ">
                    <UserPlus className="h-4 w-4" />
                    สมัครสมาชิก
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
