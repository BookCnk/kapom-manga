"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types/client-enums";
import { PenTool, Shield, CheckCircle2, LogIn } from "lucide-react";

export default function WriterApplyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ถ้าไม่ได้ล็อกอิน → ส่งไป login ก่อน
    if (!user) {
      const redirectPath = encodeURIComponent("/writer/apply");
      router.replace(`/login?redirect=${redirectPath}`);
      return;
    }

    // ถ้าเป็นนักเขียนอยู่แล้ว (TRANSLATOR / ADMIN) → ส่งไปหน้าแดชบอร์ดนักเขียนเลย
    if (user.role === UserRole.TRANSLATOR || user.role === UserRole.ADMIN) {
      router.replace("/writer/overview");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </main>
    );
  }

  // แสดงหน้าสมัครเฉพาะ USER ธรรมดา
  if (user.role !== UserRole.USER) {
    return null;
  }

  return (
    <main className="flex-1 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                สมัครเป็นนักเขียนบน RTN
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                สร้างและเผยแพร่ผลงานของคุณ พร้อมติดตามสถิติ ยอดอ่าน และรายได้จากผลงาน
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-sm font-semibold text-foreground">
                สร้างผลงานของคุณ
              </h2>
              <p className="text-xs text-muted-foreground">
                สร้างมังงะ เพิ่มตอนใหม่ จัดการรูปปก และเนื้อหาได้จากแดชบอร์ดนักเขียน
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">
                ระบบจัดการผลงาน
              </h2>
              <p className="text-xs text-muted-foreground">
                ดูสถิติยอดอ่าน ยอดขาย และการเคลื่อนไหวของผลงานได้แบบละเอียด
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <PenTool className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground">
                เติบโตไปพร้อมกับเรา
              </h2>
              <p className="text-xs text-muted-foreground">
                ทีมงานพร้อมช่วยเหลือและแนะนำให้ผลงานของคุณเติบโตบนแพลตฟอร์ม
              </p>
            </div>
          </div>

          <div className="border border-dashed border-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              ขั้นตอนการสมัครนักเขียน
            </h2>
            <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5">
              <li>ติดต่อทีมงานผ่านช่องทางที่กำหนด (เช่น Discord / Facebook / Line)</li>
              <li>แจ้งข้อมูลโปรไฟล์ของคุณ และรูปแบบผลงานที่ต้องการเผยแพร่</li>
              <li>รอการตรวจสอบและอนุมัติสิทธิ์นักเขียนจากทีมงาน</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              เมื่อได้รับการอนุมัติ บัญชีของคุณจะได้รับสิทธิ์เป็นนักเขียน และสามารถเข้าใช้งาน
              แดชบอร์ดนักเขียนได้ที่เมนู <span className="font-medium">“หน้านักเขียน”</span>
              ในโปรไฟล์
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              หากคุณมีคำถามเพิ่มเติม สามารถติดต่อทีมงานผ่านช่องทางโซเชียลของ RTN
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

