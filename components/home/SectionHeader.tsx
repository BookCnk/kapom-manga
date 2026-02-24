import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  iconClassName,
  viewAllHref,
  viewAllLabel = "ดูทั้งหมด",
}: Props) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl tracking-tight font-medium text-foreground flex items-center gap-2">
          {Icon ? <Icon className={iconClassName ?? ""} /> : null}
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>

      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
        >
          {viewAllLabel}{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : null}
    </div>
  );
}
