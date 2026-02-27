"use client";

import { useEffect, useRef, useState } from "react";
import { List, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type PageSizeSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
};

// ปุ่มเลือกจำนวนรายการต่อหน้า (ใช้ซ้ำได้ในทุกตาราง)
export function PageSizeSelect({
  value,
  onChange,
  options = [50, 100, 500, 1000],
}: PageSizeSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-background text-sm",
          "hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40",
        )}
      >
        <List className="w-4 h-4 text-muted-foreground" />
        <span className="whitespace-nowrap text-foreground">
          แสดง {value} รายการ
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-40">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors",
                opt === value
                  ? "bg-orange-500 text-white"
                  : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {opt} รายการ
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

