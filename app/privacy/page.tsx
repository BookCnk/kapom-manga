"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-2xl font-bold text-foreground mt-3">นโยบายความเป็นส่วนตัว</h1>
            <p className="text-sm text-muted-foreground mt-2">อัปเดตล่าสุด: 26 กุมภาพันธ์ 2569</p>
          </div>

          <div className="prose prose-sm max-w-none text-foreground/90 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">1. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เราเก็บรวบรวมข้อมูลดังต่อไปนี้เมื่อท่านใช้งานแพลตฟอร์ม:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>ข้อมูลบัญชี:</strong> อีเมล ชื่อที่แสดง ชื่อผู้ใช้ รูปโปรไฟล์ รูปแบนเนอร์</li>
                <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติการอ่าน รายการบุ๊กมาร์ก ความคิดเห็น รีวิว การโต้ตอบกับเนื้อหา</li>
                <li><strong>ข้อมูลทางเทคนิค:</strong> ที่อยู่ IP ประเภทเบราว์เซอร์ ระบบปฏิบัติการ ข้อมูลอุปกรณ์ เวลาที่เข้าถึง</li>
                <li><strong>ข้อมูลการชำระเงิน:</strong> ประวัติการทำธุรกรรม (เราไม่เก็บข้อมูลบัตรเครดิตโดยตรง)</li>
                <li><strong>คุกกี้และเทคโนโลยีที่คล้ายกัน:</strong> เพื่อปรับปรุงประสบการณ์การใช้งานและจดจำการตั้งค่า</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เราใช้ข้อมูลที่เก็บรวบรวมเพื่อ:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>ให้บริการและดูแลรักษาแพลตฟอร์ม</li>
                <li>ยืนยันตัวตนและรักษาความปลอดภัยของบัญชี</li>
                <li>ปรับปรุงและพัฒนาบริการของเรา</li>
                <li>แนะนำเนื้อหาที่ตรงกับความสนใจของผู้ใช้</li>
                <li>ป้องกันการฉ้อโกง การละเมิด และกิจกรรมที่ผิดกฎหมาย</li>
                <li>ติดต่อสื่อสารกับผู้ใช้เกี่ยวกับบริการ</li>
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">3. การแบ่งปันข้อมูล</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เราจะไม่ขาย ให้เช่า หรือแบ่งปันข้อมูลส่วนบุคคลของท่านกับบุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>ผู้ให้บริการ:</strong> บริษัทที่ช่วยเราให้บริการ (เช่น ระบบชำระเงิน บริการโฮสติ้ง) ภายใต้ข้อตกลงการรักษาความลับ</li>
                <li><strong>ข้อกำหนดทางกฎหมาย:</strong> เมื่อได้รับคำสั่งจากหน่วยงานที่มีอำนาจตามกฎหมาย</li>
                <li><strong>การปกป้องสิทธิ์:</strong> เพื่อปกป้องสิทธิ์ ทรัพย์สิน หรือความปลอดภัยของแพลตฟอร์มและผู้ใช้</li>
                <li><strong>ข้อมูลสาธารณะ:</strong> ข้อมูลที่ผู้ใช้เลือกเปิดเผยสาธารณะ (เช่น ชื่อผู้ใช้ โปรไฟล์สาธารณะ ความคิดเห็น)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">4. การจัดเก็บและรักษาความปลอดภัยข้อมูล</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                4.1 เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม รวมถึงการเข้ารหัสข้อมูล การเข้ารหัสรหัสผ่าน (hashing) และการควบคุมการเข้าถึง
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                4.2 เราจัดเก็บข้อมูลตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่เก็บรวบรวม หรือตามที่กฎหมายกำหนด
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                4.3 แม้เราจะใช้ความพยายามอย่างเต็มที่ แต่ไม่สามารถรับประกันความปลอดภัยสมบูรณ์ 100% ของข้อมูลในโลกออนไลน์ได้
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">5. คุกกี้</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                เราใช้คุกกี้เพื่อ:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li>จดจำสถานะการเข้าสู่ระบบและการตั้งค่าของผู้ใช้</li>
                <li>วิเคราะห์การใช้งานเว็บไซต์</li>
                <li>ปรับปรุงประสิทธิภาพและประสบการณ์การใช้งาน</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                ผู้ใช้สามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธคุกกี้ได้ แต่อาจส่งผลกระทบต่อฟังก์ชันการทำงานบางอย่างของแพลตฟอร์ม
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">6. สิทธิ์ของผู้ใช้</h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                ผู้ใช้มีสิทธิ์:
              </p>
              <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>เข้าถึง:</strong> ขอดูข้อมูลส่วนบุคคลที่เราเก็บรวบรวมเกี่ยวกับท่าน</li>
                <li><strong>แก้ไข:</strong> ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                <li><strong>ลบ:</strong> ขอให้ลบข้อมูลส่วนบุคคล (อาจมีข้อจำกัดบางประการ)</li>
                <li><strong>คัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลในบางกรณี</li>
                <li><strong>โอนย้าย:</strong> ขอรับสำเนาข้อมูลในรูปแบบที่สามารถอ่านได้</li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                หากต้องการใช้สิทธิ์ดังกล่าว กรุณาติดต่อเราผ่านช่องทางที่ระบุไว้ในแพลตฟอร์ม เราจะดำเนินการภายในระยะเวลาที่เหมาะสม
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">7. ผู้เยาว์</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                แพลตฟอร์มไม่ได้ออกแบบมาสำหรับเด็กอายุต่ำกว่า 13 ปี เราจะไม่เก็บรวบรวมข้อมูลจากผู้เยาว์อายุต่ำกว่า 13 ปีโดยเจตนา หากพบว่ามีการเก็บข้อมูลดังกล่าว เราจะดำเนินการลบทันที
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">8. การเปลี่ยนแปลงนโยบาย</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลทันทีเมื่อเผยแพร่บนแพลตฟอร์ม การใช้งานต่อไปหลังจากมีการเปลี่ยนแปลง ถือว่าท่านยอมรับนโยบายฉบับปรับปรุง
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">9. การเก็บรักษาข้อมูลหลังลบบัญชี</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                แม้ผู้ใช้จะลบบัญชีแล้ว เราอาจเก็บรักษาข้อมูลบางส่วนไว้ตามที่จำเป็นเพื่อ: ปฏิบัติตามกฎหมาย ป้องกันการฉ้อโกง แก้ไขข้อพิพาท และบังคับใช้ข้อตกลงของเรา ข้อมูลดังกล่าวจะถูกเก็บรักษาไว้ในระยะเวลาที่เหมาะสมและไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่น
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-3">10. ช่องทางติดต่อ</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิ์ของท่าน กรุณาติดต่อเราผ่านทางช่องทางที่ระบุไว้ในแพลตฟอร์ม
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
