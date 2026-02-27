"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import RecommendedManga from "@/components/comic/RecommendedManga";

type Page = {
  id: number;
  pageNo: number;
  imageUrl: string;
};


type Chapter = {
  id: number;
  title: string;
  number: number;
  slug: string;
  publishedAt: string | null;
  manga: {
    id: number;
    title: string;
    slug: string;
    creator?: {
      id: number;
      username: string | null;
    } | null;
  };
  pages: Page[];
};

type ChapterNav = {
  id: number;
  number: number;
  slug: string;
  title: string;
} | null;

export default function ChapterReaderPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterStatus, setChapterStatus] = useState<"published" | "hidden" | "scheduled">(
    "published",
  );
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPages, setShowPages] = useState(false);
  const [nextChapter, setNextChapter] = useState<ChapterNav>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterNav>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [priceCoins, setPriceCoins] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchChapter();
    }
  }, [slug]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      setShowPages(false); // Reset showPages when loading new chapter
      const headers: HeadersInit = {};
      let token: string | null = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("session_token");
        if (token) {
          headers["x-session-token"] = token;
        }
      }

      const response = await fetch(`/api/chapters/slug/${slug}`, { headers });
      const data = await response.json();

      if (data.success && data.data?.chapter) {
        setChapter(data.data.chapter);
        if (data.data.status) {
          setChapterStatus(data.data.status);
        } else {
          setChapterStatus("published");
        }
        setIsOwnerPreview(Boolean(data.data.isOwnerPreview));
        setNextChapter(data.data.nextChapter || null);
        setPrevChapter(data.data.prevChapter || null);
        setIsLocked(Boolean(data.data.isLocked));
        setPriceCoins(data.data.priceCoins || 0);
        setIsPurchased(Boolean(data.data.isPurchased));
        setIsOwner(Boolean(data.data.isOwner));
        
        // Fetch wallet balance if chapter is locked
        if (data.data.isLocked && !data.data.isOwner && !data.data.isPurchased && token) {
          fetchWalletBalance();
        } else {
          // Record reading history
          if (data.data.chapter.id && token) {
            recordReadingHistory(data.data.chapter.id);
          }
          // Show pages after 2-3 seconds
          setTimeout(() => {
            setShowPages(true);
          }, 2500);
        }
      } else {
        // Handle error
        console.error("Chapter not found");
      }
    } catch (error) {
      console.error("Failed to fetch chapter:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const response = await fetch("/api/wallet/me", {
        headers: {
          "x-session-token": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.wallet) {
          setWalletBalance(data.data.wallet.balance || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  const handlePurchase = async () => {
    if (!chapter || purchasing) return;

    setPurchasing(true);
    try {
      const token = localStorage.getItem("session_token");
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const response = await fetch(`/api/chapters/${chapter.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการซื้อตอน");
      }

      toast.success("ซื้อตอนสำเร็จ!");
      setWalletBalance(data.data.transaction.balanceAfter);
      setIsPurchased(true);
      
      // Record reading history and show pages
      recordReadingHistory(chapter.id);
      setTimeout(() => {
        setShowPages(true);
      }, 2500);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการซื้อตอน"
      );
    } finally {
      setPurchasing(false);
    }
  };

  const recordReadingHistory = async (chapterId: number) => {
    try {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      await fetch("/api/reading-history/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
        body: JSON.stringify({
          chapterId,
          lastPage: 1, // Default to first page
        }),
      });
    } catch (error) {
      console.error("Failed to record reading history:", error);
      // Don't show error to user, just log it
    }
  };


  function formatThaiDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy HH:mm น.", { locale: th });
    } catch (error) {
      return dateString;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!chapter || chapter.pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">ไม่พบตอนนี้</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* แถบแจ้งเตือนสำหรับเจ้าของผลงานเมื่อดูตอนที่ซ่อน / รอเผยแพร่ (สไตล์เดียวกับกรอบตอน) */}
      {isOwnerPreview && chapterStatus !== "published" && (
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-orange-50/95">
            <div className="px-4 py-3 text-xs sm:text-sm text-orange-900 flex items-start gap-3">
              <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white shadow-sm">
                i
              </span>
              <p className="leading-relaxed">
                {chapterStatus === "hidden"
                  ? 'สถานะตอนนี้ "ซ่อนอยู่" ผู้ใช้งานท่านอื่นจะไม่สามารถเข้าชมเนื้อหานี้ได้'
                  : chapter?.publishedAt
                    ? `สถานะตอนนี้ "รอเผยแพร่" ตอนนี้จะเผยแพร่เมื่อถึงเวลา ${formatThaiDateTime(
                        chapter.publishedAt,
                      )}`
                    : 'สถานะตอนนี้ "รอเผยแพร่" ตอนนี้จะเผยแพร่เมื่อถึงเวลาที่กำหนด'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header - Sticky และแยกจากกรอบตอน แต่ความกว้างขนานกัน */}
      {/* top-16 (64px) ให้ header ลอยอยู่ใต้ Navbar ที่สูง ~64px */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md">
        <div className="w-full max-w-4xl mx-auto border-b border-border"></div>
        <div 
          className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
          style={{
            padding: '8px' // padding เท่ากับกรอบตอนและรูป
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Home className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link href="/comic" className="hover:text-foreground transition-colors">
                    การ์ตูน
                  </Link>
                  <span>/</span>
                  <Link href={`/comic/${chapter.manga.slug}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                    {chapter.manga.title}
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">เนื้อหา</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {prevChapter ? (
                  <Link
                    href={`/comic/chapter/${prevChapter.slug}`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="p-2 opacity-50 cursor-not-allowed rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {nextChapter ? (
                  <Link
                    href={`/comic/chapter/${nextChapter.slug}`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="p-2 opacity-50 cursor-not-allowed rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reader - All Pages */}
      <div className="w-full">
        <div className="flex flex-col items-center">

          {/* Chapter Title - มีกรอบต่อกับ Header */}
          <div 
            className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
            style={{
              padding: '8px' // padding เท่ากับกรอบตอนและรูป
            }}
          >
            <div className="px-4 py-6 text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                {chapter.title || `ตอนที่ ${chapter.number}`}
              </h2>
              {chapter.title && chapter.title.includes("(") && (
                <p className="text-muted-foreground mt-2">
                  ({chapter.title.match(/\(([^)]+)\)/)?.[1]})
                </p>
              )}

              {/* ชื่อนักเขียน / username ใต้ชื่อตอน คลิกไปโปรไฟล์ในแท็บใหม่ */}
              {chapter.manga.creator && (
                <div className="mt-3">
                  <Link
                    href={`/profile/${chapter.manga.creator.username || chapter.manga.creator.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <span className="font-medium">
                      @{chapter.manga.creator.username || chapter.manga.creator.id}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Section - Show if locked and not purchased */}
          {isLocked && !isOwner && !isPurchased ? (
            <div 
              className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
              style={{
                padding: '8px'
              }}
            >
              <div className="px-4 py-8 text-center space-y-6">
                {/* Wallet Balance */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">ยอดเหรียญของคุณ</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">R</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {walletBalance !== null
                        ? walletBalance.toFixed(2).replace(/\.?0+$/, "")
                        : "..."}
                    </span>
                    <button
                      onClick={() => window.open("/wallet", "_blank")}
                      className="w-6 h-6 rounded-full bg-orange-500/20 hover:bg-orange-500/30 flex items-center justify-center transition-colors border border-orange-500/30"
                    >
                      <Plus className="w-4 h-4 text-orange-500" />
                    </button>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={!walletBalance || walletBalance < Math.ceil(priceCoins) || purchasing}
                  className={`w-full max-w-md mx-auto py-4 px-6 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                    walletBalance !== null && walletBalance >= Math.ceil(priceCoins) && !purchasing
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {purchasing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังซื้อ...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
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
                      <span>{priceCoins.toFixed(2).replace(/\.?0+$/, "")} เหรียญ</span>
                    </>
                  )}
                </button>

                {walletBalance !== null && walletBalance < Math.ceil(priceCoins) && (
                  <p className="text-sm text-center text-orange-500">
                    ยอดเหรียญไม่เพียงพอ
                  </p>
                )}
              </div>
            </div>
          ) : showPages ? (
            <div className="w-full max-w-4xl mx-auto">
              {chapter.pages.map((page, index) => (
                <div 
                  key={page.id} 
                  className={cn(
                    "w-full border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20",
                    // ไม่ต้องมี border-top เพราะชื่อเรื่องมี border-bottom แล้ว
                    index === chapter.pages.length - 1 && "border-b-2" // border ล่างสำหรับภาพสุดท้าย
                  )}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    padding: '8px', // เพิ่ม padding เพื่อให้กรอบใหญ่กว่ารูปเล็กน้อย
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNo}`}
                    className="w-full h-auto"
                    loading="lazy"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-black dark:border-gray-800 bg-muted/20"
              style={{
                padding: '8px',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">กำลังโหลด...</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons - กรอบแยกต่างหาก */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-4xl mx-auto border-l-2 border-r-2 border-b-2 border-black dark:border-gray-800 bg-muted/20">
              <div className="px-4 py-6 flex gap-4">
                {prevChapter ? (
                  <Link
                    href={`/comic/chapter/${prevChapter.slug}`}
                    className="flex-1 px-6 py-3 border border-orange-500/50 bg-transparent text-foreground rounded-lg hover:bg-orange-500/10 hover:border-orange-500 transition-colors font-medium text-center flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    ตอนก่อนหน้า
                  </Link>
                ) : (
                  <div className="flex-1"></div>
                )}
                {nextChapter ? (
                  <Link
                    href={`/comic/chapter/${nextChapter.slug}`}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-center flex items-center justify-center gap-2">
                    ตอนถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recommended Manga Section */}
      {chapter && chapter.manga && (
        <div className="w-full max-w-4xl mx-auto px-4">
          <RecommendedManga mangaId={chapter.manga.id} />
        </div>
      )}
    </div>
  );
}
