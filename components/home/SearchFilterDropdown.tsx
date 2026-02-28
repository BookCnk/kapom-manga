"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterDropdownProps {
  label: string;
  options: FilterOption[];
  currentValue?: string;
  paramKey: string;
}

export default function SearchFilterDropdown({
  label,
  options,
  currentValue,
  paramKey,
}: SearchFilterDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (!value || value === "all") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const selected = currentValue ? currentValue : options[0]?.value;
  const selectedOption = options.find((o) => o.value === selected);
  const selectedLabel = selectedOption?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground hover:border-orange-500/60 hover:text-foreground transition-colors w-full"
        >
          <span>{label}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {selectedLabel}
            <ChevronDown className="w-3 h-3" />
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="z-[9999] w-56 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-1 text-xs"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={`rounded-lg px-2 py-1.5 ${
              selected === option.value
                ? "bg-orange-500/10 text-orange-500"
                : "text-muted-foreground"
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
