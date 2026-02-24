"use client";

import Link from "next/link";
import { Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/user/UserMenu";

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

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="hidden sm:block w-px h-5 bg-border mx-1" />

            {/* Search shortcut (แทน Bookmark ชั่วคราว) */}
            <Link
              href="/search"
              className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Search className="w-[22px] h-[22px]" />
            </Link>

            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
