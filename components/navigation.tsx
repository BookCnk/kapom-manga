"use client";

import Link from "next/link";
import { Search, Megaphone, BookOpen, MessageSquare, Sun, Moon } from "lucide-react";
import UserMenu from "@/components/user/UserMenu";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { label: "ประกาศ", href: "/news", icon: Megaphone },
  { label: "การ์ตูน", href: "/search", icon: BookOpen },
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
  const pathname = usePathname();
  
  return (
    <div className="hidden md:flex items-center gap-6">
      {NAV_LINKS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              isActive
                ? "text-orange-500 font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="w-4 h-4" />
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
      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      disabled={!mounted}>
      {mounted && currentTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

export default function Navigation() {
  const { loading: authLoading, user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <Brand />
            <DesktopLinks />
          </div>

          <div className="flex items-center gap-2">
            {/* Only show notification icon if user is logged in */}
            {user && (
              <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
                <MessageSquare className="w-5 h-5" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}

            <Link
              href="/search"
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Link>

            <ThemeToggle />

            <div className="hidden sm:block w-px h-5 bg-border mx-1" />

            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
