import Link from "next/link";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { Mail } from "lucide-react";

const READER_LINKS = [
  { label: "การ์ตูน", href: "/" },
  { label: "ค้นหา", href: "/" },
  { label: "ประวัติการอ่าน", href: "/reading-history" },
];

const WRITER_LINKS = [
  { label: "สมัครนักเขียน", href: "/writer/apply" },
  { label: "หน้านักเขียน", href: "/writer" },
];

const ABOUT_LINKS = [
  { label: "RTN คืออะไร?", href: "/" },
  { label: "ติดต่อเรา", href: "/" },
];

const POLICY_LINKS = [
  { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
  { label: "ข้อตกลงในการใช้งาน", href: "/tos" },
  { label: "รายงานการละเมิด", href: "/dmca" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-orange-400 mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand & Social */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl tracking-tighter font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                RTN
              </span>
            </Link>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              แพลตฟอร์มอ่านการ์ตูนออนไลน์
              <br />
              สำหรับทุกคน
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-[#1877F2] flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-black flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                title="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@rtn.com"
                className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-orange-500 flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                title="อีเมล"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <FooterColumn title="นักอ่าน" links={READER_LINKS} />
          <FooterColumn title="นักเขียน" links={WRITER_LINKS} />
          <FooterColumn title="เกี่ยวกับเรา" links={ABOUT_LINKS} />
          <FooterColumn title="นโยบาย" links={POLICY_LINKS} />
        </div>

        {/* Divider */}
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 - {new Date().getFullYear()} RTN Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
