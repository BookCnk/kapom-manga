import Link from "next/link";

const FOOTER_LINKS = [
  { label: "เกี่ยวกับเรา", href: "#" },
  { label: "เงื่อนไขการใช้งาน", href: "#" },
  { label: "นโยบายความเป็นส่วนตัว", href: "#" },
];

function Brand() {
  return (
    <div className="text-2xl tracking-tighter font-medium text-muted-foreground/40">
      RTN
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
      {FOOTER_LINKS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="hover:text-foreground transition-colors">
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left */}
          <Brand />

          {/* Center */}
          <FooterLinks />

          {/* Right */}
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} RTN Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
