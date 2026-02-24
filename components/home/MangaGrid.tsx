import MangaCard from "./MangaCard";
import type { MangaCard as MangaCardType } from "@/lib/mock/homeData";

type Props = {
  items: MangaCardType[];
  limit?: number;
  variant?: "grid" | "scroller";
  cardSize?: "sm" | "md" | "lg"; // ✅ คุมขนาดตอนเป็น scroller
};

const sizeMap = {
  sm: "w-[140px] sm:w-[160px]",
  md: "w-[160px] sm:w-[180px] md:w-[200px]",
  lg: "w-[180px] sm:w-[200px] md:w-[220px]",
};

export default function MangaGrid({
  items,
  limit = 5,
  variant = "grid",
  cardSize = "md",
}: Props) {
  const displayItems = items.slice(0, limit);

  if (variant === "scroller") {
    return (
      <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
          {/* ✅ snap ให้เลื่อนเป็นช่อง ๆ */}
          <div
            className="flex gap-4 sm:gap-6 snap-x snap-mandatory"
            style={{ minWidth: "max-content" }}>
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`snap-start shrink-0 ${sizeMap[cardSize]}`}>
                <MangaCard
                  item={item}
                  variant="grid"
                  className="h-full"
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {displayItems.map((item) => (
        <MangaCard key={item.id} item={item} variant="grid" />
      ))}
    </div>
  );
}
