// rtn-manga-platform/app/register/page.tsx
"use client";

import Link from "next/link";
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Info,
} from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl tracking-tighter font-medium text-orange-600">
              RTN
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            สมัครสมาชิกเพื่อเริ่มอ่านได้ทันที
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          <div className="mb-6">
            <h1 className="text-xl tracking-tight font-medium text-foreground">
              สมัครสมาชิก
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              สร้างบัญชีใหม่ในไม่กี่ขั้นตอน ✨
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  ชื่อ
                </label>
                <div className="mt-2 relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    placeholder="เช่น นัท"
                    className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  นามสกุล
                </label>
                <div className="mt-2 relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    placeholder="เช่น ใจดี"
                    className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                ชื่อผู้ใช้
              </label>
              <div className="mt-2 relative">
                <AtSign
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  placeholder="เช่น rtn_reader"
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                อีเมล
              </label>
              <div className="mt-2 relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                รหัสผ่าน
              </label>
              <div className="mt-2 relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]"
                  strokeWidth={1.5}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className="w-full pl-10 pr-12 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors p-1"
                  aria-label="toggle password">
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                แนะนำให้มีทั้งตัวอักษรและตัวเลข เพื่อความปลอดภัย
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground select-none cursor-pointer">
              <input type="checkbox" className="mt-1 accent-orange-500" />
              <span>
                ฉันยอมรับ{" "}
                <Link
                  href="#"
                  className="text-orange-600 hover:text-orange-700 font-medium">
                  เงื่อนไขการใช้งาน
                </Link>{" "}
                และ{" "}
                <Link
                  href="#"
                  className="text-orange-600 hover:text-orange-700 font-medium">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </span>
            </label>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm shadow-orange-500/20 flex items-center justify-center gap-2">
              <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
              สมัครสมาชิก
            </button>

            <div className="relative py-2">
              <div className="h-px bg-border"></div>
              <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-card px-3 text-xs text-muted-foreground">
                หรือ
              </span>
            </div>

            <button
              type="button"
              className="w-full bg-muted hover:bg-accent text-foreground py-2.5 rounded-full text-sm font-medium border border-border transition-colors flex items-center justify-center gap-2">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              สมัครด้วย Google
            </button>

            <p className="text-sm text-muted-foreground text-center pt-2">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-medium">
                เข้าสู่ระบบ
              </Link>
            </p>
          </form>
        </div>

        <p className="text-xs text-muted-foreground mt-5 text-center">
          © 2023 RTN Platform. All rights reserved.
        </p>
      </div>
    </main>
  );
}
