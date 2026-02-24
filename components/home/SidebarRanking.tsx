import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

export default function SidebarRanking({ items }: { items: MangaCardType[] }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg tracking-tight font-medium text-foreground">
          ยอดฮิตประจำสัปดาห์
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Link
            href={`/manga/${item.slug}`}
            key={item.id}
            className="flex items-center gap-4 group">
            {index < 3 ? (
              <>
                <span
                  className={`text-2xl font-medium w-6 text-center ${
                    index === 0 ? "text-orange-500" : "text-muted-foreground/40"
                  }`}>
                  {index + 1}
                </span>

                <div className="w-14 h-20 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={56}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-orange-500">
                      <Star className="w-3 h-3" />
                    </span>
                    {item.rating ?? "-"}
                    <span className="mx-1">•</span> {item.genre}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground truncate group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-xs text-muted-foreground/80">
                    {item.genre}
                  </span>
                </div>
              </>
            )}
          </Link>
        ))}
      </div>

      <Link
        href="/ranking"
        className="block w-full mt-6 py-2 text-center bg-muted hover:bg-accent text-muted-foreground text-sm font-medium rounded-lg border border-border transition-colors">
        ดูอันดับทั้งหมด
      </Link>
    </div>
  );
}
