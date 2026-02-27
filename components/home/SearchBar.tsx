"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  /** ถ้า true จะยิงค้นหาอัตโนมัติเมื่อพิมพ์ (ใช้ร่วมกับ delayMs) */
  autoSearch?: boolean;
  /** หน่วงเวลาก่อนยิงค้นหาอัตโนมัติ (มิลลิวินาที) */
  delayMs?: number;
}

export default function SearchBar({
  initialQuery = "",
  className,
  placeholder = "ระบุคำค้นหาจากชื่อเรื่องหรือแท็กที่คุณต้องการ",
  autoSearch = false,
  delayMs = 500,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const goSearch = (value: string) => {
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    
    if (!trimmed) {
      params.delete("q");
    } else {
      params.set("q", trimmed);
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch(query);
  };

  // auto-search แบบหน่วงเวลา เพื่อไม่ให้ backend ทำงานถี่เกินไป
  useEffect(() => {
    if (!autoSearch) return;

    const id = setTimeout(() => {
      goSearch(query);
    }, delayMs);

    return () => clearTimeout(id);
  }, [autoSearch, delayMs, query]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${className ?? ""}`}
    >
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-muted border border-transparent rounded-full text-sm focus:bg-background focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
      />
    </form>
  );
}

