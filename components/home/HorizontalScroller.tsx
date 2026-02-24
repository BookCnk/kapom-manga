import type { ReactNode } from "react";

export default function HorizontalScroller({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
        <div className="flex gap-4 sm:gap-6" style={{ minWidth: "max-content" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
