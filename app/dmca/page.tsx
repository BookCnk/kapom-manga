"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function DMCAPage() {
  const router = useRouter();

  return (
    <main className="flex-1 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-2xl tracking-tighter font-medium text-orange-600">RTN</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-3">นโยบาย DMCA และการคุ้มครองลิขสิทธิ์</h1>
            <p className="text-sm text-muted-foreground mt-2">อัปเดตล่าสุด: 26 กุมภาพันธ์ 2569</p>
          </div>

          <div className="prose prose-sm max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">1. หลักการทั่วไป</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                RTN Manga Platform ("แพลตฟอร์ม") เคารพสิทธิ์ในทรัพย์สินทางปัญญาของผู้อื่น และปฏิบัติตามพระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537 (แก้ไขเพิ่มเติม) ของราชอาณาจักรไทย และกฎหมาย Digital Millennium Copyright Act (DMCA) ของสหรัฐอเมริกา เราจะดำเนินการต่อเนื้อหาที่มีการรายงานว่าละเมิดลิขสิทธิ์อย่างเหมาะสมและรวดเร็ว
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">2. สถานะของแพลตฟอร์ม</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                2.1 แพลตฟอร์มทำหน้าที่เป็น <strong>ตัวกลาง (Platform / Intermediary)</strong> ในการเผยแพร่เนื้อหาเท่านั้น โดยไม่มีส่วนร่วมในการสร้าง แก้ไข หรือตรวจสอบเนื้อหาที่อัปโหลดโดยผู้ใช้ก่อนเผยแพร่
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                2.2 เนื้อหาทั้งหมดที่อัปโหลดเป็นความรับผิดชอบของผู้อัปโหลดเนื้อหานั้น ๆ แต่เพียงผู้เดียว
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                2.3 แพลตฟอร์มจะดำเนินการลบเนื้อหาที่ละเมิดทันทีเมื่อได้รับการแจ้งเตือนที่ถูกต้องตามหลักเกณฑ์
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">3. การแจ้งเตือนการละเมิดลิขสิทธิ์ (Takedown Notice)</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                หากท่านเป็นเจ้าของลิขสิทธิ์หรือตัวแทนที่ได้รับมอบอำนาจ และเชื่อว่าเนื้อหาบนแพลตฟอร์มละเมิดลิขสิทธิ์ของท่าน กรุณาส่งคำร้องที่ประกอบด้วย:
              </p>
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <p className="text-sm text-muted-foreground"><strong>1.</strong> ข้อมูลระบุตัวตนของเจ้าของลิขสิทธิ์หรือตัวแทน (ชื่อ ที่อยู่ อีเมล เบอร์โทรศัพท์)</p>
                <p className="text-sm text-muted-foreground"><strong>2.</strong> รายละเอียดของผลงานที่ถูกละเมิด (ชื่อผลงาน สำนักพิมพ์ ผู้แต่ง)</p>
                <p className="text-sm text-muted-foreground"><strong>3.</strong> URL หรือลิงก์ที่ชี้ไปยังเนื้อหาที่ละเมิดบนแพลตฟอร์ม</p>
                <p className="text-sm text-muted-foreground"><strong>4.</strong> คำรับรองว่าท่านเชื่อโดยสุจริตว่าการใช้เนื้อหาดังกล่าวไม่ได้รับอนุญาตจากเจ้าของลิขสิทธิ์</p>
                <p className="text-sm text-muted-foreground"><strong>5.</strong> คำรับรองว่าข้อมูลในคำร้องเป็นความจริง และท่านมีอำนาจในการดำเนินการแทนเจ้าของลิขสิทธิ์</p>
                <p className="text-sm text-muted-foreground"><strong>6.</strong> ลายเซ็นอิเล็กทรอนิกส์หรือลายเซ็นจริงของเจ้าของลิขสิทธิ์หรือตัวแทน</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">4. ขั้นตอนการดำเนินการ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เมื่อได้รับคำร้องที่ถูกต้องครบถ้วน เราจะ:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>ตรวจสอบความถูกต้องของคำร้องภายใน <strong>24-72 ชั่วโมง</strong> ทำการ</li>
                <li>ลบหรือปิดการเข้าถึงเนื้อหาที่ละเมิดทันทีหลังยืนยัน</li>
                <li>แจ้งผู้อัปโหลดเนื้อหาเกี่ยวกับการดำเนินการและเหตุผล</li>
                <li>บันทึกการดำเนินการเพื่อการตรวจสอบในภายหลัง</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">5. คำร้องคัดค้าน (Counter Notice)</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                หากท่านเชื่อว่าเนื้อหาของท่านถูกลบโดยผิดพลาดหรือเข้าใจผิด ท่านสามารถส่งคำร้องคัดค้านที่ประกอบด้วย:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>ข้อมูลระบุตัวตนของท่าน</li>
                <li>รายละเอียดเนื้อหาที่ถูกลบและ URL เดิม</li>
                <li>คำรับรองว่าท่านเชื่อโดยสุจริตว่าเนื้อหาถูกลบโดยผิดพลาด</li>
                <li>หลักฐานแสดงว่าท่านมีสิทธิ์ในเนื้อหาดังกล่าว</li>
                <li>การยินยอมรับเขตอำนาจศาลไทย</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                เราจะพิจารณาคำร้องคัดค้านภายใน 10-14 วันทำการ และอาจคืนเนื้อหาหากไม่ได้รับการคัดค้านเพิ่มเติมจากผู้ร้องเดิม
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">6. นโยบายผู้ละเมิดซ้ำ (Repeat Infringer Policy)</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เรามีนโยบายจัดการผู้ละเมิดซ้ำอย่างเข้มงวด:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>ครั้งที่ 1:</strong> แจ้งเตือนและลบเนื้อหาที่ละเมิด</li>
                <li><strong>ครั้งที่ 2:</strong> ระงับสิทธิ์การอัปโหลดเนื้อหาชั่วคราว (30 วัน)</li>
                <li><strong>ครั้งที่ 3:</strong> ระงับบัญชีถาวรและห้ามสร้างบัญชีใหม่</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                แพลตฟอร์มสงวนสิทธิ์ในการระงับบัญชีทันทีโดยไม่ต้องเป็นไปตามลำดับขั้นข้างต้น ในกรณีที่พิจารณาว่าเป็นการละเมิดอย่างร้ายแรง
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">7. ความรับผิดของนักเขียน/ผู้แปล</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                7.1 นักเขียน/ผู้แปลที่อัปโหลดเนื้อหา <strong>รับรองและรับประกัน</strong> ว่า:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>ตนเป็นเจ้าของลิขสิทธิ์หรือได้รับอนุญาตอย่างถูกต้องตามกฎหมาย</li>
                <li>เนื้อหาไม่ละเมิดสิทธิ์ของบุคคลที่สาม</li>
                <li>มีเอกสารหรือหลักฐานที่พิสูจน์สิทธิ์ได้</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                7.2 นักเขียน/ผู้แปลตกลงที่จะ <strong>รับผิดชอบค่าเสียหายทั้งหมด</strong> ที่เกิดขึ้นกับแพลตฟอร์มจากการละเมิดลิขสิทธิ์ของเนื้อหาที่ตนอัปโหลด รวมถึงค่าทนายความ ค่าเสียหาย และค่าใช้จ่ายอื่น ๆ
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">8. Safe Harbor</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ในฐานะตัวกลางให้บริการ (Service Provider) แพลตฟอร์มดำเนินการภายใต้หลักการ Safe Harbor ตาม DMCA (17 U.S.C. § 512) และพระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2550 เราไม่มีหน้าที่ตรวจสอบเนื้อหาทั้งหมดก่อนเผยแพร่ แต่จะดำเนินการอย่างรวดเร็วเมื่อได้รับแจ้ง (Notice and Takedown)
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">9. การแจ้งเตือนเท็จ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                การส่งคำร้อง DMCA ที่เป็นเท็จโดยเจตนาอาจมีผลทางกฎหมาย ผู้ส่งคำร้องเท็จอาจต้องรับผิดชอบค่าเสียหายที่เกิดขึ้น รวมถึงค่าทนายความ ตามกฎหมายที่เกี่ยวข้อง
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">10. เทคโนโลยีการป้องกัน</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                แพลตฟอร์มใช้ระบบตรวจสอบเนื้อหาอัตโนมัติ (Content Moderation) เพื่อช่วยกรองเนื้อหาที่ไม่เหมาะสม อย่างไรก็ตาม ระบบอัตโนมัติอาจไม่สมบูรณ์แบบ ดังนั้นการแจ้งเตือนจากผู้ใช้จึงมีความสำคัญอย่างยิ่ง
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">11. ช่องทางรับแจ้ง</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                สำหรับการแจ้งเตือนการละเมิดลิขสิทธิ์ หรือคำร้องคัดค้าน กรุณาติดต่อเราผ่านช่องทางที่ระบุไว้ในแพลตฟอร์ม โดยระบุหัวข้อ: <strong>"DMCA Notice"</strong> หรือ <strong>"DMCA Counter Notice"</strong>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
