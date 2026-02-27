"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Genre {
  slug: string;
  name: string;
}

interface SearchGenreFilterProps {
  genres: Genre[];
  currentGenre?: string;
}

export default function SearchGenreFilter({
  genres,
  currentGenre,
}: SearchGenreFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (!value || value === "all") {
      params.delete("genre");
    } else {
      params.set("genre", value);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const selected = currentGenre && currentGenre !== "all" ? currentGenre : "all";
  const selectedGenre = genres.find((g) => g.slug === selected);
  const selectedLabel = selected === "all" ? "ทุกหมวด" : (selectedGenre?.name ?? selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors w-full"
        >
          <span>หมวดหมู่</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {selectedLabel}
            <ChevronDown className="w-3 h-3" />
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-1 text-xs"
      >
        <DropdownMenuItem
          onClick={() => handleChange("all")}
          className={`rounded-lg px-2 py-1.5 ${
            selected === "all"
              ? "bg-orange-500/10 text-orange-500"
              : "text-muted-foreground"
          }`}
        >
          ทุกหมวด
        </DropdownMenuItem>
        {genres.map((g) => (
          <DropdownMenuItem
            key={g.slug}
            onClick={() => handleChange(g.slug)}
            className={`rounded-lg px-2 py-1.5 ${
              selected === g.slug
                ? "bg-orange-500/10 text-orange-500"
                : "text-muted-foreground"
            }`}
          >
            {g.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

