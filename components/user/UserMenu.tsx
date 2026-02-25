"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, BookOpen, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@prisma/client";

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest(".user-menu")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-foreground hover:text-orange-500 transition-colors">
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
    setIsOpen(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-3 h-3" />;
      case UserRole.TRANSLATOR:
        return <BookOpen className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "ผู้ดูแลระบบ";
      case UserRole.TRANSLATOR:
        return "นักแปล";
      default:
        return "ผู้ใช้ทั่วไป";
    }
  };

  return (
    <div className="relative user-menu">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors border-2 border-purple-500">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
            {user.name?.charAt(0)?.toUpperCase() ||
              user.email.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-medium text-foreground">
              {user.name || user.email}
            </div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getRoleIcon(user.role)}
              {getRoleLabel(user.role)}
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}>
              <User className="w-4 h-4" />
              โปรไฟล์ของฉัน
            </Link>

            {(user.role === UserRole.TRANSLATOR ||
              user.role === UserRole.ADMIN) && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}>
                <Settings className="w-4 h-4" />
                แผงควบคุม
              </Link>
            )}
          </div>

          <div className="border-t border-border pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
