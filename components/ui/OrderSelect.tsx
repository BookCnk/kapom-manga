"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown10, ArrowUp10, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderOption = {
  value: "asc" | "desc";
  label: string;
};

type OrderSelectProps = {
  value: "asc" | "desc";
  onChange: (value: "asc" | "desc") => void;
  options?: OrderOption[];
};

const DEFAULT_OPTIONS: OrderOption[] = [
  { value: "asc", label: "เรียงลำดับตอนจากน้อยไปมาก" },
  { value: "desc", label: "เรียงลำดับตอนจากมากไปน้อย" },
];

// ปุ่มเลือกการเรียงลำดับ (ใช้ซ้ำได้ในทุกตาราง)
export function OrderSelect({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: OrderSelectProps) {
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

  const currentOption = options.find((opt) => opt.value === value) ?? options[0];

  const renderIcon = (val: "asc" | "desc", className?: string) =>
    val === "asc" ? (
      <ArrowDown10 className={className} />
    ) : (
      <ArrowUp10 className={className} />
    );

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
        {renderIcon(currentOption.value, "w-4 h-4 text-muted-foreground")}
        <span className="whitespace-nowrap text-foreground">
          {currentOption.label}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-40">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2",
                opt.value === value
                  ? "bg-orange-500 text-white"
                  : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {renderIcon(opt.value, "w-4 h-4")}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

