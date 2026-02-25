"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, BookOpen, Heart, Settings } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/lib/types/client-enums";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-foreground mb-4">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link
            href="/login"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

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

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800";
      case UserRole.TRANSLATOR:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">
            โปรไฟล์ของฉัน
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการข้อมูลส่วนตัวและการตั้งค่า
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-medium">
              {user.name?.charAt(0)?.toUpperCase() ||
                user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-medium text-foreground">
                {user.name || "ไม่ระบุชื่อ"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-sm text-muted-foreground">
                มังงะที่บุ๊คมาร์ค
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-sm text-muted-foreground">มังงะที่ถูกใจ</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">0</div>
              <div className="text-sm text-muted-foreground">
                ตอนที่อ่านแล้ว
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(user.role === UserRole.TRANSLATOR ||
            user.role === UserRole.ADMIN) && (
            <Link
              href="/admin"
              className="p-6 bg-card rounded-xl border border-border shadow-sm hover:border-orange-500/30 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-orange-600 transition-colors">
                    แผงควบคุม
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    จัดการระบบและผลงาน
                  </p>
                </div>
              </div>
            </Link>
          )}

          <Link
            href="/bookmarks"
            className="p-6 bg-card rounded-xl border border-border shadow-sm hover:border-blue-500/30 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                  บุ๊คมาร์ค
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  มังงะที่บันทึกไว้
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/likes"
            className="p-6 bg-card rounded-xl border border-border shadow-sm hover:border-red-500/30 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-red-600 transition-colors">
                  รายการโปรด
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  มังงะที่ถูกใจ
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
