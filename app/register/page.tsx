"use client";

import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  // ถ้า login อยู่แล้วให้ redirect ไปหน้าแรก
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!acceptedTerms) {
      setError("กรุณายอมรับข้อตกลงและเงื่อนไข");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim(), password }),
      });

      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error || "สมัครสมาชิกไม่สำเร็จ");
      }

      const loginResult = await login(email, password);
      if (!loginResult.success) {
        throw new Error(loginResult.error || "เข้าสู่ระบบอัตโนมัติไม่สำเร็จ");
      }

      setSuccess(true);
      setTimeout(() => { router.replace("/"); }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl tracking-tighter font-medium text-orange-600">RTN</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">สร้างบัญชีของคุณ</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-7 relative">
          {success && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                <p className="text-sm text-foreground font-medium">กำลังสร้างบัญชีและเข้าสู่ระบบ...</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-xl tracking-tight font-medium text-foreground">สมัครสมาชิก</h1>
          </div>

          <form className="space-y-4" onSubmit={onSubmit} style={{ pointerEvents: success ? "none" : "auto", opacity: success ? 0.3 : 1 }}>
            <div>
              <label className="text-sm font-medium text-foreground">อีเมล <span className="text-red-500">*</span></label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" strokeWidth={1.5} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">ชื่อที่แสดง</label>
              <div className="mt-2 relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="ชื่อของคุณ (ไม่จำเป็น)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">รหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" strokeWidth={1.5} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  className="w-full pl-10 pr-12 py-2.5 bg-muted border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors p-1">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground select-none cursor-pointer">
              <input type="checkbox" className="mt-1 accent-orange-500" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span>
                ฉันได้อ่านและยอมรับ{" "}
                <Link href="/tos" target="_blank" className="text-orange-600 hover:text-orange-700 underline underline-offset-2">ข้อตกลงการใช้บริการ</Link>
                {", "}
                <Link href="/privacy" target="_blank" className="text-orange-600 hover:text-orange-700 underline underline-offset-2">นโยบายความเป็นส่วนตัว</Link>
                {" และ "}
                <Link href="/dmca" target="_blank" className="text-orange-600 hover:text-orange-700 underline underline-offset-2">นโยบาย DMCA</Link>
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
            </button>

            <p className="text-sm text-muted-foreground text-center pt-2">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">เข้าสู่ระบบ</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
