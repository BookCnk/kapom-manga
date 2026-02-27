"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, BookOpen } from "lucide-react";
import type { Episode } from "@/lib/mock/contentData";

type EpisodeSortMode = "latest" | "oldest";

interface EpisodeListProps {
  episodes: Episode[];
  /** จำนวนตอนต่อกลุ่ม เช่น 5 จะได้กลุ่ม 1-5, 6-10, ... */
  visibleLimit?: number;
  /** ข้อความบอกเวลาตอนอัปเดตล่าสุดของเรื่อง เช่น "20 ก.พ. 2569 14:56 น." */
  lastUpdatedText?: string;
  /** Function to get href for episode, receives episode id and returns href string */
  getEpisodeHref?: (episodeId: string) => string;
  /** Reading history data */
  readingHistory?: { chapterId: number; lastPage: number } | null;
  /** Current chapter ID that user is reading */
  currentChapterId?: number | null;
  /** Manga title */
  mangaTitle?: string;
  /** Manga creator ID */
  mangaCreatorId?: number | null;
  /** Purchased chapter IDs */
  purchasedChapterIds?: Set<number>;
}

export default function EpisodeList({
  episodes,
  visibleLimit = 5,
  lastUpdatedText,
  getEpisodeHref,
  readingHistory,
  currentChapterId,
  mangaTitle = "",
  mangaCreatorId,
  purchasedChapterIds = new Set(),
}: EpisodeListProps) {
  // เก็บสถานะเปิด/ปิดของแต่ละกลุ่ม (index ของกลุ่ม -> true/false)
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
  const [sortMode, setSortMode] = useState<EpisodeSortMode>("oldest");

  // หาตอนที่อ่านแล้ว (ตอนที่มี number น้อยกว่าหรือเท่ากับตอนที่กำลังอ่านอยู่ เมื่อเรียงตาม number)
  const readChapterIds = useMemo(() => {
    if (!currentChapterId || !readingHistory) return new Set<number>();
    
    const currentChapter = episodes.find((ep) => parseInt(ep.id) === currentChapterId);
    if (!currentChapter) return new Set<number>();
    
    // เรียงตอนตาม number จากน้อยไปมาก
    const sortedEpisodes = [...episodes].sort((a, b) => a.number - b.number);
    const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === currentChapter.id);
    
    // ตอนที่อ่านแล้วคือตอนที่มี number น้อยกว่าหรือเท่ากับตอนที่กำลังอ่านอยู่
    const readIds = new Set<number>();
    for (let i = 0; i <= currentIndex; i++) {
      readIds.add(parseInt(sortedEpisodes[i].id));
    }
    
    return readIds;
  }, [episodes, currentChapterId, readingHistory]);

  const toggleGroup = (groupIndex: number) => {
    setOpenGroups((prev) => {
      // ใช้ default value เดียวกับ isOpen: กลุ่มแรกเปิด กลุ่มอื่นปิด
      const currentState = prev[groupIndex] ?? (groupIndex === 0);
      return {
        ...prev,
        [groupIndex]: !currentState,
      };
    });
  };

  const renderEpisode = (ep: Episode) => {
    const href = getEpisodeHref ? getEpisodeHref(ep.id) : undefined;
    const episodeId = parseInt(ep.id);
    const isRead = readChapterIds.has(episodeId);
    const isCurrent = currentChapterId === episodeId;
    // จางลงถ้าอ่านแล้ว แต่ไม่จางถ้าเป็นตอนที่กำลังอ่านอยู่
    const opacityClass = isRead && !isCurrent ? "opacity-60" : "";
    
    const content = (
      <>
      {/* Episode Number */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        isCurrent ? "bg-orange-500/20" : "bg-muted"
      } ${opacityClass}`}>
        <span className={`text-sm font-semibold ${
          isCurrent ? "text-orange-500" : "text-muted-foreground"
        }`}>
          {ep.number}
        </span>
      </div>

      <div className={`flex-1 min-w-0 ${opacityClass}`}>
        <h4 className={`text-sm font-medium group-hover:text-orange-600 transition-colors ${
          isCurrent ? "text-orange-500" : "text-foreground"
        }`}>
          {ep.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">{ep.date}</p>
      </div>

      <div className={`text-right shrink-0 flex items-center gap-3 ${opacityClass}`}>
        {isCurrent && (
          <div className="flex items-center gap-1 text-orange-500">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">อ่านต่อ</span>
          </div>
        )}
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
      </>
    );

    const borderClass = isCurrent 
      ? "border-orange-500 hover:border-orange-600" 
      : "border-border hover:border-orange-500/50";
    const bgClass = isCurrent 
      ? "bg-orange-500/5" 
      : "bg-card";
    const containerClass = `flex items-center gap-4 p-4 rounded-xl ${bgClass} border ${borderClass} transition-colors cursor-pointer group ${opacityClass}`;
    
    // ใช้ Link component สำหรับทุกตอน (ไม่จำกัดการคลิก)
    if (href) {
      return (
        <Link
          key={ep.id}
          href={href}
          className={containerClass}
        >
          {content}
        </Link>
      );
    }

    // Fallback: ใช้ div
    return (
      <div
        key={ep.id}
        className={containerClass}
      >
        {content}
      </div>
    );
  };

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
        <p className="text-sm text-muted-foreground">
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

        // กลุ่มแรกเปิดอยู่ กลุ่มอื่นๆ ซ่อนไว้ก่อน
        const isOpen = openGroups[index] ?? (index === 0);

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

