"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Episode } from "@/lib/mock/contentData";

type EpisodeSortMode = "latest" | "oldest";

interface EpisodeListProps {
  episodes: Episode[];
  /** จำนวนตอนต่อกลุ่ม เช่น 5 จะได้กลุ่ม 1-5, 6-10, ... */
  visibleLimit?: number;
  /** ข้อความบอกเวลาตอนอัปเดตล่าสุดของเรื่อง เช่น "20 ก.พ. 2569 14:56 น." */
  lastUpdatedText?: string;
}

export default function EpisodeList({
  episodes,
  visibleLimit = 5,
  lastUpdatedText,
}: EpisodeListProps) {
  // เก็บสถานะเปิด/ปิดของแต่ละกลุ่ม (index ของกลุ่ม -> true/false)
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
  const [sortMode, setSortMode] = useState<EpisodeSortMode>("oldest");

  const toggleGroup = (groupIndex: number) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupIndex]: !(prev[groupIndex] ?? true),
    }));
  };

  const renderEpisode = (ep: Episode) => (
    <div
      key={ep.id}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-orange-500/50 transition-colors cursor-pointer group"
    >
      {/* Episode Number */}
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">
          {ep.number}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground group-hover:text-orange-600 transition-colors">
          {ep.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">{ep.date}</p>
      </div>

      <div className="text-right shrink-0 flex items-center gap-3">
        {ep.isLocked && (
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )}
        {ep.price === "Free" ? (
          <span className="text-sm font-medium text-green-600">Free</span>
        ) : (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {ep.price}
          </div>
        )}
      </div>
    </div>
  );

  const totalEpisodes = episodes.length;

  // เรียงลำดับตอนตามโหมดที่เลือก
  const sortedEpisodes = [...episodes].sort((a, b) => {
    if (sortMode === "latest") {
      // ตอนล่าสุดอยู่บนสุด (หมายเลขมาก -> ใหม่กว่า)
      return b.number - a.number;
    }
    // ตอนแรกสุดอยู่บนสุด
    return a.number - b.number;
  });

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div>
        <p className="text-sm font-semibold text-foreground">สารบัญ</p>
        <p className="text-xs text-muted-foreground">
          {totalEpisodes} ตอน
          {lastUpdatedText && (
            <>
              {" "}
              · เพิ่มตอนล่าสุด {lastUpdatedText}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>เรียงตาม</span>
        <div className="inline-flex rounded-full border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setSortMode("oldest")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sortMode === "oldest"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            ตอนแรกสุด
          </button>
          <button
            type="button"
            onClick={() => setSortMode("latest")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sortMode === "latest"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            ตอนล่าสุด
          </button>
        </div>
      </div>
    </div>
  );

  // ถ้าจำนวนตอนยังไม่ถึง limit (เช่น มีแค่ 1-5 ตอน) ให้แสดงรายการตรง ๆ
  // ไม่ต้องมีหัวข้อช่วงตอน (1-5, 6-10, ...)
  if (sortedEpisodes.length <= visibleLimit) {
    return (
      <div className="space-y-3">
        {header}
        <div className="space-y-2">
          {sortedEpisodes.map(renderEpisode)}
        </div>
      </div>
    );
  }

  // แบ่งตอนเป็นกลุ่ม ๆ ตาม visibleLimit เช่น 1-5, 6-10, ...
  const groups: Episode[][] = [];
  for (let i = 0; i < sortedEpisodes.length; i += visibleLimit) {
    groups.push(sortedEpisodes.slice(i, i + visibleLimit));
  }

  return (
    <div className="space-y-3">
      {header}
      {groups.map((groupEpisodes, index) => {
        if (groupEpisodes.length === 0) return null;

        const startNumber = groupEpisodes[0]?.number ?? index * visibleLimit + 1;
        const endNumber =
          groupEpisodes[groupEpisodes.length - 1]?.number ??
          (index + 1) * visibleLimit;

        const isOpen = openGroups[index] ?? true; // ยังไม่เคยกด = เปิดอยู่

        return (
          <div key={index} className="space-y-2">
            {/* แถบหัวข้อของกลุ่ม เช่น 1-5, 6-10 */}
            <button
              type="button"
              onClick={() => toggleGroup(index)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/60 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <span>
                {startNumber} - {endNumber}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* ตอนในกลุ่มนี้ จะถูกซ่อน/โชว์อยู่ใต้แถบนั้น */}
            {isOpen && groupEpisodes.map(renderEpisode)}
          </div>
        );
      })}
    </div>
  );
}

