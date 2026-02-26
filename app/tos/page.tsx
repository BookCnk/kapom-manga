"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            <h1 className="text-2xl font-bold text-foreground mt-3">ข้อตกลงและเงื่อนไขการใช้บริการ</h1>
            <p className="text-sm text-muted-foreground mt-2">อัปเดตล่าสุด: 26 กุมภาพันธ์ 2569</p>
          </div>

          <div className="prose prose-sm max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">1. การยอมรับข้อตกลง</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                การเข้าถึงและใช้งานเว็บไซต์ RTN Manga Platform ("แพลตฟอร์ม") ถือว่าท่านได้อ่าน เข้าใจ และยอมรับข้อตกลงและเงื่อนไขทั้งหมดที่ระบุไว้ในเอกสารนี้ หากท่านไม่ยอมรับข้อตกลงเหล่านี้ กรุณาหยุดใช้งานแพลตฟอร์มทันที ข้อตกลงนี้มีผลผูกพันทางกฎหมาย ท่านรับทราบว่าการสร้างบัญชีหรือใช้บริการใด ๆ ของแพลตฟอร์ม ถือเป็นการแสดงเจตนายินยอมอย่างชัดแจ้งต่อข้อตกลงฉบับนี้
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">2. คำจำกัดความ</h2>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>"แพลตฟอร์ม"</strong> หมายถึง เว็บไซต์ RTN Manga Platform รวมถึงบริการ ฟีเจอร์ และเนื้อหาทั้งหมดที่ให้บริการผ่านเว็บไซต์</li>
                <li><strong>"ผู้ใช้"</strong> หมายถึง บุคคลใดก็ตามที่เข้าถึงหรือใช้งานแพลตฟอร์ม ไม่ว่าจะมีบัญชีหรือไม่ก็ตาม</li>
                <li><strong>"เนื้อหา"</strong> หมายถึง ข้อความ รูปภาพ การ์ตูน มังงะ ความคิดเห็น รีวิว และข้อมูลอื่น ๆ ที่ปรากฏบนแพลตฟอร์ม</li>
                <li><strong>"นักเขียน/ผู้แปล"</strong> หมายถึง ผู้ใช้ที่ได้รับอนุญาตให้อัปโหลดหรือเผยแพร่เนื้อหาบนแพลตฟอร์ม</li>
                <li><strong>"เรา"</strong> หมายถึง ทีมงานผู้ดูแลและบริหาร RTN Manga Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">3. เงื่อนไขการใช้งาน</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                ผู้ใช้จะต้อง:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>มีอายุไม่ต่ำกว่า 13 ปี หรือได้รับความยินยอมจากผู้ปกครอง</li>
                <li>ให้ข้อมูลที่ถูกต้องและเป็นจริงในการสมัครสมาชิก</li>
                <li>รับผิดชอบในการรักษาความปลอดภัยของบัญชีและรหัสผ่านของตนเอง</li>
                <li>ไม่ใช้แพลตฟอร์มในทางที่ผิดกฎหมายหรือขัดต่อศีลธรรมอันดี</li>
                <li>ไม่กระทำการใด ๆ ที่อาจทำให้ระบบเสียหายหรือรบกวนการทำงานของแพลตฟอร์ม</li>
                <li>ไม่พยายามเข้าถึงบัญชีหรือข้อมูลของผู้ใช้อื่นโดยไม่ได้รับอนุญาต</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">4. เนื้อหาและทรัพย์สินทางปัญญา</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                4.1 เนื้อหาทั้งหมดที่ปรากฏบนแพลตฟอร์มเป็นทรัพย์สินทางปัญญาของเจ้าของลิขสิทธิ์ ผู้สร้างสรรค์ หรือผู้ที่ได้รับอนุญาตให้เผยแพร่ แพลตฟอร์มทำหน้าที่เป็นตัวกลางในการเผยแพร่เนื้อหาเท่านั้น
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                4.2 ผู้ใช้ไม่มีสิทธิ์ทำซ้ำ คัดลอก ดัดแปลง แจกจ่าย หรือเผยแพร่เนื้อหาจากแพลตฟอร์มโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                4.3 นักเขียน/ผู้แปลที่อัปโหลดเนื้อหา รับรองว่าตนเป็นเจ้าของลิขสิทธิ์หรือได้รับอนุญาตให้เผยแพร่เนื้อหาดังกล่าว และยินยอมให้แพลตฟอร์มแสดงเนื้อหาตามวัตถุประสงค์ของบริการ
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                4.4 แพลตฟอร์มสงวนสิทธิ์ในการลบเนื้อหาที่ละเมิดลิขสิทธิ์ ข้อตกลง หรือกฎหมายโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">5. เนื้อหาต้องห้าม</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                ผู้ใช้ห้ามอัปโหลด เผยแพร่ หรือแบ่งปันเนื้อหาที่:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>มีลักษณะลามกอนาจาร อนาจารเด็ก หรือเนื้อหาทางเพศที่เกี่ยวข้องกับผู้เยาว์</li>
                <li>ส่งเสริมความรุนแรง การก่อการร้าย หรือการเลือกปฏิบัติ</li>
                <li>ละเมิดลิขสิทธิ์ เครื่องหมายการค้า หรือทรัพย์สินทางปัญญาของผู้อื่น</li>
                <li>เป็นข้อมูลส่วนบุคคลของผู้อื่นโดยไม่ได้รับความยินยอม</li>
                <li>เป็นสแปม มัลแวร์ หรือลิงก์ที่เป็นอันตราย</li>
                <li>ขัดต่อกฎหมายราชอาณาจักรไทยหรือกฎหมายระหว่างประเทศ</li>
                <li>เป็นเนื้อหาที่หมิ่นประมาท หรือสร้างความเกลียดชัง</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">6. บัญชีผู้ใช้</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                6.1 แพลตฟอร์มสงวนสิทธิ์ในการ ระงับ จำกัดการเข้าถึง หรือลบบัญชีผู้ใช้ได้ทุกเมื่อ โดยไม่จำเป็นต้องให้เหตุผลหรือแจ้งล่วงหน้า ในกรณีที่พิจารณาว่ามีการละเมิดข้อตกลงนี้
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                6.2 ผู้ใช้จะต้องรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของตน
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                6.3 ห้ามสร้างบัญชีหลายบัญชีเพื่อหลีกเลี่ยงการลงโทษหรือการจำกัดการใช้งาน
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">7. การชำระเงินและระบบเหรียญ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                7.1 เหรียญที่ซื้อแล้วไม่สามารถคืนเงินหรือโอนให้บุคคลอื่นได้ ยกเว้นในกรณีที่กฎหมายกำหนด
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                7.2 แพลตฟอร์มสงวนสิทธิ์ในการเปลี่ยนแปลงราคา อัตราแลกเปลี่ยนเหรียญ หรือระบบชำระเงินได้ตลอดเวลา
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                7.3 ในกรณีที่บัญชีถูกระงับเนื่องจากการละเมิดข้อตกลง เหรียญที่เหลือในบัญชีจะไม่ได้รับการคืน
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">8. ข้อจำกัดความรับผิด</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                8.1 แพลตฟอร์มให้บริการ "ตามสภาพที่เป็น" (as-is) โดยไม่รับประกันความถูกต้อง ความสมบูรณ์ หรือความพร้อมใช้งานของบริการ
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                8.2 แพลตฟอร์มไม่รับผิดชอบต่อ:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>เนื้อหาที่อัปโหลดโดยผู้ใช้หรือนักเขียน/ผู้แปล</li>
                <li>ความเสียหายที่เกิดจากการใช้งานแพลตฟอร์ม ไม่ว่าทางตรงหรือทางอ้อม</li>
                <li>การสูญเสียข้อมูล การหยุดให้บริการชั่วคราว หรือข้อผิดพลาดทางเทคนิค</li>
                <li>การกระทำของบุคคลที่สามที่เข้าถึงบัญชีของผู้ใช้</li>
                <li>ความถูกต้องของข้อมูลที่ผู้ใช้อื่นเผยแพร่</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                8.3 ไม่ว่ากรณีใด ๆ ความรับผิดสูงสุดของแพลตฟอร์มจะไม่เกินจำนวนเงินที่ผู้ใช้ชำระให้แก่แพลตฟอร์มในช่วง 12 เดือนก่อนหน้า
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">9. การชดใช้ค่าเสียหาย</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ผู้ใช้ตกลงที่จะชดเชย ปกป้อง และไม่ทำให้แพลตฟอร์ม ทีมงาน ผู้ดูแลระบบ และบุคคลที่เกี่ยวข้องได้รับความเสียหายจากการเรียกร้อง ค่าเสียหาย ค่าใช้จ่าย (รวมถึงค่าทนายความ) ที่เกิดจากการละเมิดข้อตกลงนี้ หรือการกระทำที่ผิดกฎหมายของผู้ใช้
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">10. การแก้ไขข้อตกลง</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                แพลตฟอร์มสงวนสิทธิ์ในการแก้ไข เปลี่ยนแปลง หรือปรับปรุงข้อตกลงนี้ได้ตลอดเวลา การใช้งานแพลตฟอร์มต่อไปหลังจากมีการเปลี่ยนแปลง ถือว่าผู้ใช้ยอมรับข้อตกลงฉบับที่ปรับปรุงแล้ว
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">11. การยุติการให้บริการ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                แพลตฟอร์มสงวนสิทธิ์ในการยุติ ระงับ หรือเปลี่ยนแปลงบริการทั้งหมดหรือบางส่วนได้ทุกเมื่อ โดยไม่ต้องแจ้งให้ทราบล่วงหน้าหรือรับผิดชอบต่อความเสียหายที่เกิดขึ้น
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">12. กฎหมายที่ใช้บังคับ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ข้อตกลงนี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย ข้อพิพาทใด ๆ ที่เกิดขึ้นจะอยู่ภายใต้เขตอำนาจศาลไทย
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">13. ช่องทางติดต่อ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                หากมีคำถามเกี่ยวกับข้อตกลงนี้ กรุณาติดต่อเราผ่านทางช่องทางที่ระบุไว้ในแพลตฟอร์ม
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
