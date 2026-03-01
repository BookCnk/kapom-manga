"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Plus, FileText, BarChart3, List, Trash2, FileStack, Edit, ExternalLink, Pencil, TrendingUp, Coins, Settings, Search, Menu, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Check, Calendar, Clock, ChevronDown, Globe2 } from "lucide-react";
import dynamic from "next/dynamic";
import { MangaStatus, Visibility } from "@/lib/types/client-enums";
import { cn } from "@/lib/utils";
import { contentTypeOptions } from "@/lib/config/contentTypes";
import { RichTextEditor } from "@/components/writer/RichTextEditor";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { OrderSelect } from "@/components/ui/OrderSelect";
import { toast } from "sonner";
import AuthGuard from "@/components/writer/AuthGuard";
import { checkInappropriateContent } from "@/lib/utils/content-filter";
import { useAuth } from "@/contexts/AuthContext";
import * as nsfwjs from "nsfwjs";
import JSZip from "jszip";

type MultiChapterStatus = "success" | "skipped" | "error" | "processing" | "pending";

type MultiChapterResult = {
  number: number;
  title: string;
  status: MultiChapterStatus;
  message?: string;
  totalPages?: number;
  uploadedPages?: number;
};

// Helper function for Buddhist Era
const getCurrentYearBE = () => new Date().getFullYear() + 543;

// Thai calendar constants
const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function getPlainTextLengthFromHtml(html: string): number {
  if (!html) return 0;
  if (typeof document === "undefined") return html.length;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.innerText || tmp.textContent || "").length;
}

// Dynamically import recharts to avoid SSR issues
const MonthlySalesChart = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return ({ data }: { data: Array<{ day: number; sales: number }> }) => {
      const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground mb-1">
                วันที่ {label}
              </p>
              <p className="text-sm text-muted-foreground">
                ยอดขาย: <span className="font-semibold text-orange-500">{payload[0].value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ReadCoin</span>
              </p>
            </div>
          );
        }
        return null;
      };

      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            style={{ pointerEvents: "none" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `วันที่ ${value}`}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: "ยอดขาย (ReadCoin)", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--foreground))" } }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={false}
            />
            <Bar 
              dataKey="sales" 
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              style={{ pointerEvents: "none" }}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false }
);

const YearlySalesChart = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return ({ data }: { data: Array<{ month: string; sales: number }> }) => {
      const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground mb-1">
                {label}
              </p>
              <p className="text-sm text-muted-foreground">
                ยอดขาย: <span className="font-semibold text-orange-500">{payload[0].value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ReadCoin</span>
              </p>
            </div>
          );
        }
        return null;
      };

      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            style={{ pointerEvents: "none" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: "ยอดขาย (ReadCoin)", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--foreground))" } }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={false}
            />
            <Bar 
              dataKey="sales" 
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              style={{ pointerEvents: "none" }}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false }
);

function formatThaiDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    
    const thaiMonths = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    
    return `${day} ${thaiMonths[month]} ${year} ${hours}:${minutes} น.`;
  } catch {
    return dateString;
  }
}

type Genre = {
  id: number;
  slug: string;
  name: string;
  type?: "main" | "sub";
};

type Chapter = {
  id: number;
  number: number;
  title: string;
  slug: string;
  isLocked: boolean;
  priceCoins: number;
  views: number;
  publishedAt: string | null;
  updatedAt: string;
};

type Manga = {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  status: MangaStatus;
  visibility: Visibility;
  isMature: boolean;
  contentType?: string;
  views: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  genreSlugs?: string[] | null;
  genres?: Array<{
    genre: Genre;
  }>;
  tagSlugs: string[];
  chapters: Chapter[];
  _count: {
    chapters: number;
    bookmarks: number;
    likes: number;
    comments: number;
  };
};

type TabType = "info" | "episodes" | "stats";
type StatsTabType = "sales" | "analytics";

export default function EditMangaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { loading: authLoading, user: authUser } = useAuth();

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTabType>("sales");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    monthlySales: Record<number, number>;
    yearlySales: Record<number, number>;
    totalSalesThisMonth: number;
    totalSalesThisYear: number;
  } | null>(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [topChapters, setTopChapters] = useState<Array<{
    rank: number;
    chapterNumber: number;
    title: string;
    sales: number;
  }>>([]);
  const [recentPurchases, setRecentPurchases] = useState<Array<{
    purchaseDate: string;
    chapterNumber: number;
    title: string;
    price: number;
  }>>([]);
  const [loadingTopChapters, setLoadingTopChapters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 543); // Buddhist Era
  const [formData, setFormData] = useState<{
    title: string;
    originalTitle: string;
    description: string;
    synopsis: string;
    coverUrl: string;
    status: MangaStatus;
    visibility: Visibility;
    isMature: boolean;
    contentType: string;
    mainGenreSlug: string;
    subGenreSlug: string;
  }>({
    title: "",
    originalTitle: "",
    description: "",
    synopsis: "",
    coverUrl: "",
    status: MangaStatus.ONGOING,
    visibility: Visibility.PUBLIC,
    isMature: false,
    contentType: "jp-manga",
    mainGenreSlug: "",
    subGenreSlug: "",
  });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [originalTitleError, setOriginalTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [synopsisError, setSynopsisError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [loadingChapterData, setLoadingChapterData] = useState(false);
  const [chapterType, setChapterType] = useState<"single" | "multi">("single");
  const [chapterFormData, setChapterFormData] = useState({
    title: "",
    number: 1,
    price: 0,
    status: "published" as "published" | "draft",
    scheduleEnabled: false,
    scheduledAt: "" as string, // ISO string หรือว่าง = ใช้เวลาปัจจุบันเมื่อเผยแพร่
  });
  const [chapterImages, setChapterImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editPageGroups, setEditPageGroups] = useState<string[][]>([]);
  const [priceInputValue, setPriceInputValue] = useState<string>("0");
  const [isPaidMode, setIsPaidMode] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showMainGenreDropdown, setShowMainGenreDropdown] = useState(false);
  const [showSubGenreDropdown, setShowSubGenreDropdown] = useState(false);
  const mainGenreDropdownRef = useRef<HTMLDivElement | null>(null);
  const subGenreDropdownRef = useRef<HTMLDivElement | null>(null);
  const ratingDropdownRef = useRef<HTMLDivElement | null>(null);
  const contentTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  // การแสดงรายการตอนในตาราง (จำนวนต่อหน้า + การเรียงลำดับ + หน้า)
  const [chapterPageSize, setChapterPageSize] = useState<number>(50);
  const [chapterPage, setChapterPage] = useState<number>(1);
  const [chapterSortOrder, setChapterSortOrder] = useState<"asc" | "desc">("asc");
  const [uploadingChapter, setUploadingChapter] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [uploadedPages, setUploadedPages] = useState<Set<number>>(new Set());
  const [multiChapterProgress, setMultiChapterProgress] = useState<{
    current: number; // จำนวนตอนที่ประมวลผลเสร็จแล้ว (success/skip/error)
    total: number; // จำนวนตอนทั้งหมดใน ZIP
    results: MultiChapterResult[];
  } | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [multiUploadProcessing, setMultiUploadProcessing] = useState(false);
  const [multiUploadStep, setMultiUploadStep] = useState(0);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [nsfwModel, setNsfwModel] = useState<any>(null);
  const [checkingNsfw, setCheckingNsfw] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverBlocked, setCoverBlocked] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const previousCoverRef = useRef<string | null>(null);
  const originalCoverRef = useRef<string | null>(null);

  // เลือกหลายตอน + จัดการแบบกลุ่ม
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>([]);
  const [bulkPriceInput, setBulkPriceInput] = useState<string>("");
  const [bulkWorking, setBulkWorking] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<
    | {
        mode: "single";
        chapterId: number;
        chapterNumber: number;
        chapterTitle: string;
      }
    | {
        mode: "bulk";
        count: number;
      }
    | null
  >(null);

  // Helper สำหรับโหมดการแสดงผลตอน (ซ่อน / ตอนนี้ / ตั้งเวลา)
  type DisplayMode = "hidden" | "now" | "schedule";

  const getDisplayMode = (): DisplayMode => {
    if (chapterFormData.status === "draft") return "hidden";
    if (chapterFormData.scheduleEnabled) return "schedule";
    return "now";
  };

  // อ่านราคาจาก DOM โดยตรง เพื่อป้องกัน stale state
  const getCurrentPrice = (): number => {
    if (!isPaidMode) return 0;
    // อ่านจาก ref (DOM) ก่อน → fallback เป็น state
    const raw = priceInputRef.current?.value ?? priceInputValue ?? "0";
    const parsed = parseFloat(raw.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100) / 100;
  };

  // คืนรายการตอนตาม sort + page ปัจจุบัน
  const getVisibleChapters = () => {
    if (!manga) return [];
    const sorted = [...manga.chapters].sort((a, b) =>
      chapterSortOrder === "asc" ? a.number - b.number : b.number - a.number,
    );
    const startIndex = (chapterPage - 1) * chapterPageSize;
    const endIndex = startIndex + chapterPageSize;
    return sorted.slice(startIndex, endIndex);
  };

  // สร้างรายการหมายเลขหน้าแบบมี ... (เช่น 1 2 ... 5 6 7 ... 10)
  const getPageItems = (totalPages: number, currentPage: number): (number | "dots")[] => {
    const delta = 1; // แสดงหน้าก่อน/หลัง 1 หน้า
    const range: number[] = [];
    const pages: (number | "dots")[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let prev: number | null = null;
    for (const page of range) {
      if (prev !== null) {
        if (page - prev === 2) {
          pages.push(prev + 1);
        } else if (page - prev > 2) {
          pages.push("dots");
        }
      }
      pages.push(page);
      prev = page;
    }

    return pages;
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode === "hidden") {
      setChapterFormData((prev) => ({
        ...prev,
        status: "draft",
        scheduleEnabled: false,
        scheduledAt: "",
      }));
    } else if (mode === "now") {
      setChapterFormData((prev) => ({
        ...prev,
        status: "published",
        scheduleEnabled: false,
        scheduledAt: "",
      }));
    } else {
      // ตั้งเวลาเผยแพร่ → ถ้ายังไม่มีค่า ให้ใส่เวลาปัจจุบัน + 1 ชั่วโมง อัตโนมัติ
      setChapterFormData((prev) => {
        // ถ้ามี scheduledAt อยู่แล้ว (เช่น เมื่อแก้ไขตอนที่ตั้งเวลาไว้) ให้คงค่านั้นไว้
        if (prev.scheduledAt && prev.scheduledAt.trim() !== "") {
          // Sync calendar view to the existing scheduled date
          try {
            const existingDate = new Date(prev.scheduledAt);
            if (!isNaN(existingDate.getTime())) {
              setScheduleCalMonth(existingDate.getMonth());
              setScheduleCalYear(existingDate.getFullYear());
            }
          } catch (e) {
            // Ignore parsing errors
          }
          return {
            ...prev,
            status: "published",
            scheduleEnabled: true,
            scheduledAt: prev.scheduledAt, // คงค่าเดิม
          };
        }
        
        // ถ้ายังไม่มีค่า ให้ใส่เวลาปัจจุบัน + 1 ชั่วโมง อัตโนมัติ
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const defaultSchedule = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        // Sync calendar view to the default schedule month
        setScheduleCalMonth(now.getMonth());
        setScheduleCalYear(now.getFullYear());
        return {
          ...prev,
          status: "published",
          scheduleEnabled: true,
          scheduledAt: defaultSchedule,
        };
      });
    }
  };

  const handleScheduledDateChange = (value: string) => {
    // ไม่ให้เลือกวันในอดีต
    const today = new Date().toISOString().slice(0, 10);
    if (value && value < today) return;
    setChapterFormData((prev) => {
      const timePart =
        prev.scheduledAt && prev.scheduledAt.includes("T")
          ? prev.scheduledAt.split("T")[1].slice(0, 5)
          : "00:00";
      return {
        ...prev,
        scheduledAt: value ? `${value}T${timePart}` : "",
      };
    });
  };

  const handleScheduledTimeChange = (value: string) => {
    setChapterFormData((prev) => {
      const datePart =
        prev.scheduledAt && prev.scheduledAt.includes("T")
          ? prev.scheduledAt.split("T")[0]
          : new Date().toISOString().slice(0, 10);
      const newScheduled = value ? `${datePart}T${value}` : "";
      // ไม่ auto-correct แล้ว — ให้ผู้ใช้ตั้งเวลาอิสระ แต่ถ้าอยู่ในอดีตจะแสดงคำเตือนและ disabled ปุ่มบันทึก
      return {
        ...prev,
        scheduledAt: newScheduled,
      };
    });
  };

  const isScheduledInPast =
    chapterFormData.scheduleEnabled &&
    !!chapterFormData.scheduledAt &&
    new Date(chapterFormData.scheduledAt) <= new Date();

  // --- Thai Calendar state & helpers ---
  const [scheduleCalMonth, setScheduleCalMonth] = useState(new Date().getMonth());
  const [scheduleCalYear, setScheduleCalYear] = useState(new Date().getFullYear());

  const getCalendarDays = (year: number, month: number): (number | null)[] => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const isCalendarDateInPast = (year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month, day);
    return target < today;
  };

  const handleCalendarDateSelect = (day: number) => {
    const dateStr = `${scheduleCalYear}-${String(scheduleCalMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    handleScheduledDateChange(dateStr);
  };

  const navigateScheduleCalendar = (direction: 1 | -1) => {
    setScheduleCalMonth((prev) => {
      let nm = prev + direction;
      if (nm < 0) {
        setScheduleCalYear((y) => y - 1);
        return 11;
      }
      if (nm > 11) {
        setScheduleCalYear((y) => y + 1);
        return 0;
      }
      return nm;
    });
  };

  // Format Thai date for calendar display (full month name, CE year)
  const formatThaiCalendarDate = (isoStr: string) => {
    if (!isoStr) return "เลือกวันที่";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "เลือกวันที่";
    return `${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
  };

  const toggleSelectChapter = (chapterId: number) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    );
  };
  const visibleChapters = manga ? getVisibleChapters() : [];

  const isAllChaptersSelected =
    visibleChapters.length > 0 &&
    visibleChapters.every((c) => selectedChapterIds.includes(c.id));

  const handleToggleSelectAllChapters = () => {
    if (!manga) return;
    if (isAllChaptersSelected) {
      // ยกเลิกติ๊กเฉพาะตอนที่อยู่ในหน้า/ช่วงที่เห็น
      setSelectedChapterIds((prev) =>
        prev.filter((id) => !visibleChapters.some((c) => c.id === id)),
      );
    } else {
      // ติ๊กเพิ่มเฉพาะตอนที่ยังไม่ถูกเลือกในหน้า/ช่วงที่เห็น
      setSelectedChapterIds((prev) => {
        const toAdd = visibleChapters
          .map((c) => c.id)
          .filter((id) => !prev.includes(id));
        return [...prev, ...toAdd];
      });
    }
  };

  const applyLocalChapterUpdates = (
    updater: (chapter: Chapter) => Chapter,
    filterIds?: number[],
  ) => {
    setManga((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((ch) =>
          filterIds && !filterIds.includes(ch.id) ? ch : updater(ch),
        ),
      };
    });
  };

  const handleBulkSetPrice = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    if (selectedChapterIds.length === 0) {
      toast.error("กรุณาเลือกตอนที่ต้องการก่อน");
      return;
    }
    const rawPrice = Number(bulkPriceInput);
    if (Number.isNaN(rawPrice) || rawPrice < 0) {
      toast.error("กรุณากำหนดราคาให้ถูกต้อง");
      return;
    }
    const price = Math.round(rawPrice * 100) / 100;

    try {
      setBulkWorking(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนจัดการตอน");
        router.push("/login");
        return;
      }

      await Promise.all(
        selectedChapterIds.map(async (id) => {
          const res = await fetch(`/api/chapters/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              isLocked: price > 0,
              priceCoins: price,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "ไม่สามารถอัปเดตราคาตอนได้");
          }
        }),
      );

      applyLocalChapterUpdates(
        (ch) => ({
          ...ch,
          isLocked: price > 0,
          priceCoins: price,
        }),
        selectedChapterIds,
      );

      toast.success("อัปเดตราคาตอนที่เลือกสำเร็จ");
      setSelectedChapterIds([]);
      setBulkPriceInput("");
    } catch (error) {
      console.error("Bulk set price failed:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตราคาตอน");
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkPublish = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    if (selectedChapterIds.length === 0) {
      toast.error("กรุณาเลือกตอนที่ต้องการก่อน");
      return;
    }

    try {
      setBulkWorking(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนจัดการตอน");
        router.push("/login");
        return;
      }

      const now = new Date().toISOString();

      await Promise.all(
        selectedChapterIds.map(async (id) => {
          const res = await fetch(`/api/chapters/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              publishedAt: now,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "ไม่สามารถเผยแพร่ตอนได้");
          }
        }),
      );

      applyLocalChapterUpdates(
        (ch) => ({
          ...ch,
          publishedAt: now,
        }),
        selectedChapterIds,
      );

      toast.success("เผยแพร่ตอนที่เลือกสำเร็จ");
      setSelectedChapterIds([]);
    } catch (error) {
      console.error("Bulk publish failed:", error);
      toast.error("เกิดข้อผิดพลาดในการเผยแพร่ตอน");
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    if (selectedChapterIds.length === 0) {
      toast.error("กรุณาเลือกตอนที่ต้องการก่อน");
      return;
    }

    try {
      setBulkWorking(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนจัดการตอน");
        router.push("/login");
        return;
      }

      await Promise.all(
        selectedChapterIds.map(async (id) => {
          const res = await fetch(`/api/chapters/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              publishedAt: null,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "ไม่สามารถตั้งเป็นแบบร่างได้");
          }
        }),
      );

      applyLocalChapterUpdates(
        (ch) => ({
          ...ch,
          publishedAt: null,
        }),
        selectedChapterIds,
      );

      toast.success("ตั้งตอนที่เลือกเป็นแบบร่างสำเร็จ");
      setSelectedChapterIds([]);
    } catch (error) {
      console.error("Bulk unpublish failed:", error);
      toast.error("เกิดข้อผิดพลาดในการตั้งตอนเป็นแบบร่าง");
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    if (selectedChapterIds.length === 0) {
      toast.error("กรุณาเลือกตอนที่ต้องการก่อน");
      return;
    }

    try {
      setBulkWorking(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนจัดการตอน");
        router.push("/login");
        return;
      }

      await Promise.all(
        selectedChapterIds.map(async (id) => {
          const res = await fetch(`/api/chapters/${id}`, {
            method: "DELETE",
            headers: {
              "x-session-token": sessionToken,
            },
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "ไม่สามารถลบตอนบางตอนได้");
          }
        }),
      );

      // ลบออกจาก state ในหน้า
      setManga((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.filter(
            (ch) => !selectedChapterIds.includes(ch.id),
          ),
          _count: {
            ...prev._count,
            chapters: prev._count.chapters - selectedChapterIds.length,
          },
        };
      });

      toast.success("ลบตอนที่เลือกสำเร็จ");
      setSelectedChapterIds([]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("เกิดข้อผิดพลาดในการลบตอน");
    } finally {
      setBulkWorking(false);
    }
  };

  const openBulkDeleteDialog = () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    if (selectedChapterIds.length === 0) {
      toast.error("กรุณาเลือกตอนที่ต้องการก่อน");
      return;
    }
    setDeleteDialog({
      mode: "bulk",
      count: selectedChapterIds.length,
    });
  };

  const openSingleDeleteDialog = (chapterId: number) => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }
    const chapter = manga.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) {
      toast.error("ไม่พบตอนที่ต้องการลบ");
      return;
    }
    setDeleteDialog({
      mode: "single",
      chapterId,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  };

  const handleConfirmDeleteDialog = async () => {
    if (!deleteDialog) return;
    const currentDialog = deleteDialog;
    setDeleteDialog(null);

    if (currentDialog.mode === "bulk") {
      await handleBulkDelete();
    } else {
      await handleDeleteSingleChapter(currentDialog.chapterId);
    }
  };

  const handleDeleteSingleChapter = async (chapterId: number) => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }

    try {
      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนจัดการตอน");
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
        headers: {
          "x-session-token": sessionToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถลบตอนได้");
      }

      // อัปเดต state บนหน้า
      setManga((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.filter((ch) => ch.id !== chapterId),
          _count: {
            ...prev._count,
            chapters: Math.max(prev._count.chapters - 1, 0),
          },
        };
      });
      setSelectedChapterIds((prev) => prev.filter((id) => id !== chapterId));

      toast.success("ลบตอนสำเร็จ");
    } catch (error) {
      console.error("Delete single chapter failed:", error);
      toast.error("เกิดข้อผิดพลาดในการลบตอน");
    }
  };

  // Generate random slug for chapter
  const generateRandomSlug = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Check if chapter slug exists
  const checkChapterSlugExists = async (slug: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/chapters/check-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      return data.success && data.data?.exists;
    } catch {
      return false;
    }
  };

  // Generate unique chapter slug
  const generateUniqueChapterSlug = async (): Promise<string> => {
    let slug = generateRandomSlug();
    let exists = await checkChapterSlugExists(slug);
    let attempts = 0;
    
    while (exists && attempts < 10) {
      slug = generateRandomSlug();
      exists = await checkChapterSlugExists(slug);
      attempts++;
    }
    
    return slug;
  };

  // Helper function to sort files by name (numeric order)
  const sortFilesByName = (files: File[]): File[] => {
    return [...files].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // Load NSFW model for cover checking
  useEffect(() => {
    const loadNsfwModel = async () => {
      try {
        const model = await nsfwjs.load();
        setNsfwModel(model);
        console.log("✅ NSFW model loaded for edit page");
      } catch (error) {
        console.error("❌ Failed to load NSFW model on edit page:", error);
      }
    };
    loadNsfwModel();
  }, []);

  // ป้องกันการออกจากหน้าก่อนอัพโหลดเสร็จ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadingChapter || uploadingProgress || multiUploadProcessing) {
        e.preventDefault();
        e.returnValue = "กำลังอัพโหลดอยู่ หากออกจากหน้านี้ตอนจะเสียรูปจะโหลดไม่ครบ";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploadingChapter, uploadingProgress, multiUploadProcessing]);

  // เลื่อน carousel ไปยังตอนที่กำลังอัพโหลด (processing) อัตโนมัติ
  useEffect(() => {
    if (!multiChapterProgress) return;
    const processingIndex = multiChapterProgress.results.findIndex(
      (r) => r.status === "processing",
    );
    if (processingIndex === -1) return;

    const targetCarouselIndex = Math.floor(
      processingIndex / Math.max(1, Math.min(2, multiChapterProgress.results.length)),
    );

    setCarouselIndex((prev) =>
      prev === targetCarouselIndex ? prev : targetCarouselIndex,
    );
  }, [multiChapterProgress]);

  // Animate processing steps for multi-chapter upload
  useEffect(() => {
    if (!multiUploadProcessing) {
      setMultiUploadStep(0);
      return;
    }
    const steps = [
      "กำลังแตกไฟล์ ZIP...",
      "กำลังตรวจสอบโครงสร้างโฟลเดอร์...",
      "กำลังแปลงรูปภาพเป็น WebP...",
      "กำลังอัพโหลดรูปภาพไปเซิร์ฟเวอร์...",
      "กำลังบันทึกข้อมูลตอน...",
    ];
    const interval = setInterval(() => {
      setMultiUploadStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [multiUploadProcessing]);

  // อัพโหลดรูปปกไป S3 และลบรูปเก่า (โครงสร้าง: manga/{slug}/cover/)
  const uploadCoverToS3 = async (file: File, previewUrl: string, oldUrl: string | null) => {
    try {
      setCheckingNsfw(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      
      // ใช้โครงสร้างโฟลเดอร์ตาม slug ของมังงะ
      const coverFolder = slug ? `manga/${slug}/cover` : "manga-covers";
      
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", coverFolder);
      if (oldUrl) {
        uploadFormData.append("oldUrl", oldUrl);
      }

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        headers: {
          "x-session-token": sessionToken,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        const s3Url = data.data.url;
        setCoverPreview(previewUrl); // เก็บ preview URL สำหรับแสดงผล
        setFormData((prev) => ({ ...prev, coverUrl: s3Url }));
        setCoverBlocked(false);
        setCoverError(null);
        previousCoverRef.current = s3Url;
        toast.success("อัพโหลดรูปปกสำเร็จ");
      } else {
        throw new Error(data.error || "Failed to upload cover");
      }
    } catch (error) {
      console.error("Error uploading cover to S3:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพโหลดรูปปก");
      // คืนค่ารูปเดิม
      const safeUrl = previousCoverRef.current || originalCoverRef.current || "";
      setFormData((prev) => ({ ...prev, coverUrl: safeUrl }));
      if (coverInputRef.current) coverInputRef.current.value = "";
    } finally {
      setCheckingNsfw(false);
    }
  };

  // Handle cover image change (edit mode) with NSFW check
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // เก็บรูปก่อนหน้าไว้ (ใช้ original จาก DB ถ้ามี)
    previousCoverRef.current = formData.coverUrl || originalCoverRef.current || null;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("กรุณาอัพโหลดไฟล์ .jpg, .jpeg, .png หรือ .webp เท่านั้น");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;

      // ถ้ามีโมเดล NSFW ให้ตรวจภาพก่อน
      if (nsfwModel) {
        try {
          setCheckingNsfw(true);
          const img = new Image();
          img.src = dataUrl;

          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const predictions = await nsfwModel.classify(img);
          const pornScore = predictions.find((p: any) => p.className === "Porn")?.probability || 0;
          const hentaiScore = predictions.find((p: any) => p.className === "Hentai")?.probability || 0;
          const sexyScore = predictions.find((p: any) => p.className === "Sexy")?.probability || 0;
          const nsfwScore = Math.max(pornScore, hentaiScore);

          console.log("NSFW Detection (edit page):", {
            porn: pornScore,
            hentai: hentaiScore,
            sexy: sexyScore,
            nsfwScore,
            isMature: formData.isMature,
          });

          // ถ้าตรวจพบเนื้อหา 18+ → ห้ามอัพโหลดเสมอ (ไม่สนใจ isMature)
          if (nsfwScore > 0.5) {
            toast.error("กรุณาทำภาพให้ไม่เป็นเนื้อหา 18+ มากเกินไป", { duration: 2000 });
            // คืนค่ารูปเดิม (ไม่ให้อัพโหลดไป S3)
            const safeUrl = previousCoverRef.current || originalCoverRef.current || "";
            setCoverPreview(null); // เคลียร์ preview
            setFormData((prev) => ({ ...prev, coverUrl: safeUrl }));
            setCoverBlocked(true);
            // แสดง hover เตือน 1-2 วินาที
            setCoverError("18+");
            setTimeout(() => {
              setCoverError(null);
              setCoverBlocked(false);
            }, 2000);
            // Reset file input ทันที
            if (coverInputRef.current) coverInputRef.current.value = "";
            setCheckingNsfw(false);
            return;
          }

          // ถ้า sexy สูงแต่ไม่ถึง porn/hentai → เตือนเบาๆ
          if (sexyScore > 0.7 && nsfwScore <= 0.5 && !formData.isMature) {
            toast.warning("ภาพนี้อาจมีเนื้อหาที่ไม่เหมาะสม กรุณาตรวจสอบอีกครั้ง");
          }

          // ผ่านทุกเงื่อนไข → อัพโหลดไป S3
          const oldUrl = originalCoverRef.current || formData.coverUrl || null;
          await uploadCoverToS3(file, dataUrl, oldUrl);
        } catch (error) {
          console.error("Error checking NSFW content on edit page:", error);
          toast.warning("ไม่สามารถตรวจสอบเนื้อหาภาพได้ กรุณาตรวจสอบภาพด้วยตนเอง");
          setCheckingNsfw(false);
        }
      } else {
        // ถ้าโมเดลยังไม่โหลด → ไม่อนุญาตให้เปลี่ยน
        toast.warning("กำลังโหลดระบบตรวจสอบภาพ 18+ กรุณารอสักครู่");
        if (coverInputRef.current) coverInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function to truncate filename intelligently
  const truncateFileName = (fileName: string, maxLength: number = 15): string => {
    if (fileName.length <= maxLength) return fileName;
    
    // Try to keep extension visible
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot > 0) {
      const name = fileName.substring(0, lastDot);
      const ext = fileName.substring(lastDot);
      const maxNameLength = maxLength - ext.length - 3; // 3 for "..."
      
      if (name.length > maxNameLength) {
        return name.substring(0, maxNameLength) + "..." + ext;
      }
    }
    
    // Fallback: truncate from start to show end
    return "..." + fileName.substring(fileName.length - maxLength + 3);
  };

  const groupSplitPageUrls = (pages: Array<{ pageNo: number; imageUrl: string }>): string[][] => {
    const groups: string[][] = [];
    let i = 0;
    while (i < pages.length) {
      const url1 = pages[i].imageUrl;
      if (i + 1 < pages.length) {
        const url2 = pages[i + 1].imageUrl;
        const m1 = url1.match(/^(.*)-1\.webp/);
        const m2 = url2.match(/^(.*)-2\.webp/);
        if (m1 && m2 && m1[1] === m2[1]) {
          groups.push([url1, url2]);
          i += 2;
          continue;
        }
      }
      groups.push([url1]);
      i++;
    }
    return groups;
  };

  // Handle drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder arrays
    const newImages = [...chapterImages];
    const newPreviews = [...imagePreviews];

    const draggedImage = newImages[draggedIndex];
    const draggedPreview = newPreviews[draggedIndex];

    // Remove dragged item
    newImages.splice(draggedIndex, 1);
    newPreviews.splice(draggedIndex, 1);

    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newImages.splice(insertIndex, 0, draggedImage);
    newPreviews.splice(insertIndex, 0, draggedPreview);

    setChapterImages(newImages);
    setImagePreviews(newPreviews);
    setDraggedIndex(null);
  };

  useEffect(() => {
    if (slug) {
      fetchManga();
      fetchGenres();
    }
  }, [slug]);

  useEffect(() => {
    if (manga && activeTab === "stats" && activeStatsTab === "sales" && !authLoading) {
      fetchSalesData();
      fetchTopChapters();
      fetchRecentPurchases();
    }
  }, [manga, activeTab, activeStatsTab, selectedMonth, selectedYear, authLoading]);

  // ปิด dropdown หมวดหมู่หลัก/รอง, ระดับเนื้อหา, ประเภทเนื้อหา เมื่อคลิกนอกกรอบ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (
        showMainGenreDropdown &&
        mainGenreDropdownRef.current &&
        target &&
        !mainGenreDropdownRef.current.contains(target)
      ) {
        setShowMainGenreDropdown(false);
      }

      if (
        showSubGenreDropdown &&
        subGenreDropdownRef.current &&
        target &&
        !subGenreDropdownRef.current.contains(target)
      ) {
        setShowSubGenreDropdown(false);
      }

      if (
        showRatingDropdown &&
        ratingDropdownRef.current &&
        target &&
        !ratingDropdownRef.current.contains(target)
      ) {
        setShowRatingDropdown(false);
      }

      if (
        showContentTypeDropdown &&
        contentTypeDropdownRef.current &&
        target &&
        !contentTypeDropdownRef.current.contains(target)
      ) {
        setShowContentTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showMainGenreDropdown,
    showSubGenreDropdown,
    showRatingDropdown,
    showContentTypeDropdown,
  ]);

  useEffect(() => {
    if (manga && genres.length > 0) {
      // ใช้ genreSlugs จาก manga (JSON array)
      const genreSlugs: string[] = Array.isArray(manga.genreSlugs)
        ? (manga.genreSlugs as string[])
        : [];

      const currentCoverUrl = manga.coverUrl || "";
      setFormData({
        title: manga.title,
        originalTitle: manga.originalTitle || "",
        description: manga.description || "",
        synopsis: (manga as any).synopsis || "",
        coverUrl: currentCoverUrl,
        status: manga.status,
        visibility: manga.visibility,
        isMature: manga.isMature,
        contentType: manga.contentType || "jp-manga",
        mainGenreSlug: genreSlugs[0] || "",
        subGenreSlug: genreSlugs[1] || "",
      });
      // เก็บ cover URL จาก DB เพื่อกลับไปใช้เมื่อตรวจพบ 18+
      originalCoverRef.current = currentCoverUrl || null;
      previousCoverRef.current = currentCoverUrl || null;
      setCoverPreview(null); // Reset preview เมื่อโหลดข้อมูลจาก DB
      // เก็บเฉพาะ 2 ตัวแรก: [หมวดหมู่หลัก, หมวดหมู่รอง]
      setSelectedGenres(genreSlugs.slice(0, 2));
      // Set tags from manga - convert slugs back to display names
      if (manga.tagSlugs && Array.isArray(manga.tagSlugs) && manga.tagSlugs.length > 0) {
        // For now, use slugs as display names (can be improved later)
        setTags(manga.tagSlugs);
      } else {
        setTags([]);
      }
      setCoverError(null);
      setCoverBlocked(false);
    }
  }, [manga, genres]);

  const fetchManga = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/manga/slug/${slug}`, {
        headers: {
          "x-session-token": sessionToken,
        },
      });
      const data = await response.json();

      if (data.success && data.data?.manga) {
        setManga(data.data.manga);
      } else {
        const errorMessage = data.error || "ไม่พบมังงะ";
        toast.error(errorMessage);
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
        } else {
          router.push("/writer/comics");
        }
      }
    } catch (error) {
      console.error("Failed to fetch manga:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      router.push("/writer/comics");
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres");
      const data = await response.json();
      if (data.success && data.data?.genres) {
        setGenres(data.data.genres);
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error);
    }
  };

  const fetchSalesData = async () => {
    if (!manga) return;
    
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Check if user is authenticated
    if (!authUser) {
      // Don't show error immediately, wait a bit more
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryUser = authUser;
      if (!retryUser) {
        toast.error("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }
    }
    
    try {
      setLoadingSales(true);
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }

      const yearAD = selectedYear - 543; // Convert Buddhist Era to AD
      const response = await fetch(
        `/api/manga/${manga.id}/sales?month=${selectedMonth}&year=${yearAD}`,
        {
          headers: {
            "x-session-token": sessionToken,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setSalesData(data.data);
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลยอดขาย");
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลยอดขาย");
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchTopChapters = async () => {
    if (!manga) return;
    
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    try {
      setLoadingTopChapters(true);
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return;

      const response = await fetch(
        `/api/manga/${manga.id}/sales/top-chapters`,
        {
          headers: {
            "x-session-token": sessionToken,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setTopChapters(data.data.topChapters || []);
      }
    } catch (error) {
      console.error("Failed to fetch top chapters:", error);
    } finally {
      setLoadingTopChapters(false);
    }
  };

  const fetchRecentPurchases = async () => {
    if (!manga) return;
    
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    try {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return;

      const response = await fetch(
        `/api/manga/${manga.id}/sales/recent-purchases`,
        {
          headers: {
            "x-session-token": sessionToken,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setRecentPurchases(data.data.recentPurchases || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent purchases:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manga) return;

    // บล็อกถ้ารูปปกเป็น 18+
    if (coverBlocked || coverError) {
      toast.error("กรุณาเปลี่ยนภาพหน้าปกก่อนอัปเดตข้อมูล");
      return;
    }

    try {
      // รีเซ็ต error เดิม
      setTitleError(null);
      setOriginalTitleError(null);
      setDescriptionError(null);
      setSynopsisError(null);

      // ตรวจคำต้องห้ามในชื่อเรื่อง
      const titleCheck = checkInappropriateContent(formData.title);
      if (titleCheck.isInappropriate) {
        setTitleError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        return;
      }

      // ตรวจคำต้องห้ามในชื่อเรื่องต้นฉบับ
      const originalTitleCheck = checkInappropriateContent(formData.originalTitle);
      if (originalTitleCheck.isInappropriate) {
        setOriginalTitleError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        return;
      }

      // ตรวจคำต้องห้ามในข้อมูลเบื้องต้น / เรื่องย่อ
      const descriptionCheck = checkInappropriateContent(formData.description);
      if (descriptionCheck.isInappropriate) {
        setDescriptionError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        return;
      }

      // ตรวจคำต้องห้ามในเรื่องย่อ (สั้น)
      const synopsisCheck = checkInappropriateContent(formData.synopsis);
      if (synopsisCheck.isInappropriate) {
        setSynopsisError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        return;
      }

      // จำกัดความยาวเรื่องย่อ (สั้น)
      if ((formData.synopsis || "").length > 120) {
        setSynopsisError("จำกัดไม่เกิน 120 คำ");
        toast.error("จำกัดไม่เกิน 120 คำ");
        return;
      }

      // จำกัดความยาวข้อมูลเบื้องต้น/เรื่องย่อ (นับเป็นตัวอักษรจาก plain text)
      const descriptionPlainLen = getPlainTextLengthFromHtml(formData.description || "");
      if (descriptionPlainLen > 750) {
        setDescriptionError("จำกัดไม่เกิน 750 ตัวอักษร");
        toast.error("จำกัดไม่เกิน 750 ตัวอักษร");
        return;
      }

      setLoading(true);
      const sessionToken = localStorage.getItem("session_token") || "";

      const response = await fetch(`/api/manga/${manga.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          title: formData.title,
          originalTitle: formData.originalTitle || null,
          description: formData.description || null,
          synopsis: formData.synopsis || null,
          coverUrl: formData.coverUrl || null,
          status: formData.status,
          visibility: formData.visibility,
          isMature: formData.isMature,
          contentType: formData.contentType || undefined,
          genreSlugs: [formData.mainGenreSlug, formData.subGenreSlug].filter(Boolean),
          tags: tags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("อัปเดตข้อมูลสำเร็จ 👌");
        await fetchManga(); // Refresh data
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการอัปเดต");
      }
    } catch (error) {
      console.error("Failed to update manga:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setLoading(false);
    }
  };

  const mainGenres = genres.filter((g) => g.type === "main");
  const subGenres = genres.filter((g) => g.type === "sub");

  // Tag handlers
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (tags.length < 10 && tagInput.length <= 20) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleImageUpload = (files: File[]) => {
    // Sort new files by name
    const sortedNewFiles = sortFilesByName(Array.from(files));
    
    // Combine with existing files and sort all
    const allFiles = [...chapterImages, ...sortedNewFiles];
    const sortedAllFiles = sortFilesByName(allFiles);
    setChapterImages(sortedAllFiles);

    // Create previews for new files in order
    const previewPromises = sortedNewFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then((newPreviews) => {
      // Rebuild previews array to match sorted files order
      const allPreviews = sortedAllFiles.map((file, index) => {
        // Find if this file is in the new files
        const newFileIndex = sortedNewFiles.findIndex(f => f === file);
        if (newFileIndex !== -1) {
          // It's a new file, use the new preview
          return newPreviews[newFileIndex];
        }
        // It's an existing file, find its preview
        const existingIndex = chapterImages.findIndex(f => f === file);
        return existingIndex !== -1 ? imagePreviews[existingIndex] : "";
      }).filter(p => p !== "");
      
      setImagePreviews(allPreviews);
    });
  };

  const handleCreateChapter = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }

    // ห้ามสร้างตอนถ้าตั้งเวลาเผยแพร่ในอดีต
    if (chapterFormData.scheduleEnabled && chapterFormData.scheduledAt && new Date(chapterFormData.scheduledAt) <= new Date()) {
      toast.error("ไม่สามารถตั้งเวลาเผยแพร่ในอดีตได้ กรุณาเลือกวันเวลาในอนาคต");
      return;
    }
    
    if (chapterImages.length === 0) {
      toast.error("กรุณาเลือกรูปภาพสำหรับตอน");
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!authUser) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!authUser) {
        toast.error("กรุณาเข้าสู่ระบบก่อนสร้างตอน");
        router.push("/login");
        return;
      }
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!authUser) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!authUser) {
        toast.error("กรุณาเข้าสู่ระบบก่อนสร้างตอน");
        router.push("/login");
        return;
      }
    }

    try {
      setUploadingChapter(true);
      const sessionToken = localStorage.getItem("session_token") || "";

      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนสร้างตอน");
        router.push("/login");
        return;
      }

      // Create chapter first with random slug
      const chapterSlug = await generateUniqueChapterSlug();
      // คำนวณหน้าที่ตอนใหม่ควรไปอยู่ (ท้ายรายการเสมอ)
      const newTotalChapters =
        (manga?.chapters?.length ?? 0) + 1;
      const targetPage = Math.max(
        1,
        Math.ceil(newTotalChapters / chapterPageSize),
      );
      const chapterResponse = await fetch(`/api/manga/${manga.id}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          title: chapterFormData.title || `ตอนที่ ${chapterFormData.number}`,
          number: chapterFormData.number,
          slug: chapterSlug,
          isLocked: getCurrentPrice() > 0,
          priceCoins: getCurrentPrice(),
          publishedAt:
            chapterFormData.status === "published"
              ? chapterFormData.scheduleEnabled && chapterFormData.scheduledAt
                ? new Date(chapterFormData.scheduledAt).toISOString()
                : new Date().toISOString()
              : undefined,
        }),
      });

      const chapterData = await chapterResponse.json();
      
      if (!chapterResponse.ok) {
        if (chapterResponse.status === 401) {
          // Wait a bit before showing error in case auth is still loading
          await new Promise(resolve => setTimeout(resolve, 500));
          if (authLoading) {
            return; // Still loading, don't show error
          }
          toast.error("กรุณาเข้าสู่ระบบใหม่");
          router.push("/login");
          return;
        }
        throw new Error(chapterData.error || "Failed to create chapter");
      }
      
      if (!chapterData.success || !chapterData.data?.chapter) {
        throw new Error(chapterData.error || "Failed to create chapter");
      }

      const chapterId = chapterData.data.chapter.id;
      const chapterNumber = chapterFormData.number;

      // อัพโหลดรูปภาพทีละหน้าไป S3 แล้วสร้าง page record
      // โครงสร้าง: manga/{slug}/episodes/{chapterNumber}/
      setUploadingProgress({ current: 0, total: chapterImages.length });
      setUploadedPages(new Set());

      for (let index = 0; index < chapterImages.length; index++) {
        const file = chapterImages[index];

        // 1) อัพโหลดรูปไป S3
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("folder", `manga/${manga.slug}/episodes/${chapterNumber}`);

        const uploadRes = await fetch("/api/uploads/image", {
          method: "POST",
          headers: { "x-session-token": sessionToken },
          body: uploadForm,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success || !uploadData.data?.url) {
          throw new Error(uploadData.error || `Failed to upload page ${index + 1}`);
        }

        const s3Url = uploadData.data.url;

        // 2) สร้าง page record ใน DB
        const pageResponse = await fetch(`/api/chapters/${chapterId}/pages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            pageNo: index + 1,
            imageUrl: s3Url,
          }),
        });

        if (!pageResponse.ok) {
          const errorData = await pageResponse.json();
          throw new Error(errorData.error || `Failed to create page ${index + 1}`);
        }

        // 3) อัพเดท progress และติ๊กถูก
        setUploadingProgress({ current: index + 1, total: chapterImages.length });
        setUploadedPages((prev) => new Set(prev).add(index));
      }

      setUploadingProgress(null);

      toast.success("สร้างตอนสำเร็จ 👌");
      setShowAddChapterModal(false);
      setUploadedPages(new Set());
      // ไปยังหน้าที่มีตอนใหม่ แล้วค่อย refresh ข้อมูล
      setChapterPage(targetPage);
      await fetchManga(); // Refresh manga data
    } catch (error) {
      console.error("Failed to create chapter:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างตอน");
    } finally {
      setUploadingChapter(false);
    }
  };

  const fetchChapterForEdit = async (chapterId: number) => {
    // Prevent multiple simultaneous requests
    if (loadingChapterData) {
      return;
    }

    // Close existing modal if open
    if (showAddChapterModal) {
      setShowAddChapterModal(false);
      setEditingChapterId(null);
      setImagePreviews([]);
      setChapterImages([]);
      setEditPageGroups([]);
      setUploadedPages(new Set());
      // Wait a bit for modal to close
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      setLoadingChapterData(true);
      const response = await fetch(`/api/chapters/${chapterId}`);
      const data = await response.json();

      if (data.success && data.data?.chapter) {
        const chapter = data.data.chapter;
        
        // Set form data — แยก 3 สถานะ: ซ่อน / เผยแพร่แล้ว / ตั้งเวลาในอนาคต
        const pubDate = chapter.publishedAt ? new Date(chapter.publishedAt) : null;
        const isScheduledFuture = pubDate ? pubDate > new Date() : false;

        // Format scheduledAt เป็น local time (YYYY-MM-DDTHH:mm)
        let formattedScheduledAt = "";
        if (isScheduledFuture && pubDate) {
          const year = pubDate.getFullYear();
          const month = String(pubDate.getMonth() + 1).padStart(2, "0");
          const day = String(pubDate.getDate()).padStart(2, "0");
          const hours = String(pubDate.getHours()).padStart(2, "0");
          const minutes = String(pubDate.getMinutes()).padStart(2, "0");
          formattedScheduledAt = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        // ไม่มี publishedAt → ซ่อน (draft)
        // มี publishedAt & อยู่ในอนาคต → ตั้งเวลาเผยแพร่ (schedule)
        // มี publishedAt & ผ่านไปแล้ว → เผยแพร่ทันที (now)
        setChapterFormData({
          title: chapter.title,
          number: chapter.number,
          price: chapter.priceCoins,
          status: chapter.publishedAt ? "published" : "draft",
          scheduleEnabled: isScheduledFuture,
          scheduledAt: formattedScheduledAt,
        });
        // Sync price input value & paid mode
        setPriceInputValue(chapter.priceCoins.toString());
        setIsPaidMode(chapter.priceCoins > 0);

        // Sync calendar view
        if (isScheduledFuture && pubDate) {
          setScheduleCalMonth(pubDate.getMonth());
          setScheduleCalYear(pubDate.getFullYear());
        } else {
          const now = new Date();
          setScheduleCalMonth(now.getMonth());
          setScheduleCalYear(now.getFullYear());
        }

        // จัดกลุ่ม split pages
        const sortedPages = chapter.pages.sort((a: any, b: any) => a.pageNo - b.pageNo);
        const groups = groupSplitPageUrls(sortedPages);
        setEditPageGroups(groups);
        const previews = groups.map((g: string[]) => g[0]);
        setImagePreviews(previews);
        // แสดงสถานะว่ารูปเดิมทั้งหมดถูกอัพโหลดไว้แล้ว (ติ๊กถูกเริ่มต้น)
        setUploadedPages(
          new Set(previews.map((_preview: string, idx: number) => idx)),
        );
        setChapterImages([]); // No files, just previews from existing pages
        setEditingChapterId(chapterId);
        setChapterType("single"); // Edit mode is always single
        setShowAddChapterModal(true);
      } else {
        toast.error("ไม่พบข้อมูลตอน");
      }
    } catch (error) {
      console.error("Failed to fetch chapter:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoadingChapterData(false);
    }
  };

  const handleUpdateChapter = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
      return;
    }

    // ห้ามอัปเดตตอนถ้าตั้งเวลาเผยแพร่ในอดีต
    if (chapterFormData.scheduleEnabled && chapterFormData.scheduledAt && new Date(chapterFormData.scheduledAt) <= new Date()) {
      toast.error("ไม่สามารถตั้งเวลาเผยแพร่ในอดีตได้ กรุณาเลือกวันเวลาในอนาคต");
      return;
    }
    
    if (!editingChapterId) {
      toast.error("ไม่พบข้อมูลตอนที่ต้องการแก้ไข");
      return;
    }
    
    if (imagePreviews.length === 0) {
      toast.error("กรุณาเลือกรูปภาพสำหรับตอน");
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!authUser) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!authUser) {
        toast.error("กรุณาเข้าสู่ระบบก่อนอัปเดตตอน");
        router.push("/login");
        return;
      }
    }

    try {
      setUploadingChapter(true);
      const sessionToken = localStorage.getItem("session_token") || "";

      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนอัปเดตตอน");
        router.push("/login");
        return;
      }

      // Update chapter info
      const chapterResponse = await fetch(`/api/chapters/${editingChapterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          title: chapterFormData.title || `ตอนที่ ${chapterFormData.number}`,
          number: chapterFormData.number,
          isLocked: getCurrentPrice() > 0,
          priceCoins: getCurrentPrice(),
          publishedAt:
            chapterFormData.status === "published"
              ? chapterFormData.scheduleEnabled && chapterFormData.scheduledAt
                ? new Date(chapterFormData.scheduledAt).toISOString()
                : new Date().toISOString()
              : null,
        }),
      });

      const chapterData = await chapterResponse.json();
      if (!chapterData.success || !chapterData.data?.chapter) {
        throw new Error(chapterData.error || "Failed to update chapter");
      }

      // โหลดหน้าปัจจุบันทั้งหมดไว้ก่อน เพื่อใช้ลบ page record เก่า + เคลียร์รูปที่ไม่ได้ใช้แล้ว
      const existingPagesResponse = await fetch(
        `/api/chapters/${editingChapterId}/pages`,
      );
      const existingPagesData = await existingPagesResponse.json();
      const oldPages: Array<{ id: number; imageUrl: string }> =
        existingPagesData.success && existingPagesData.data?.pages
          ? existingPagesData.data.pages.map((p: any) => ({
              id: p.id,
              imageUrl: p.imageUrl as string,
            }))
          : [];

      // ลบ page record เก่าทั้งหมดออกจากฐานข้อมูล (ตอนจะสร้างใหม่จาก imagePreviews ด้านล่าง)
      if (oldPages.length > 0) {
        for (const page of oldPages) {
          try {
            await fetch(`/api/pages/${page.id}`, {
              method: "DELETE",
              headers: {
                "x-session-token": sessionToken,
              },
            });
          } catch (error) {
            console.error(`Failed to delete page ${page.id}:`, error);
          }
        }
      }

      // อัพโหลดรูปภาพทีละหน้าไป S3 แล้วสร้าง page record
      // โครงสร้าง: manga/{slug}/episodes/{chapterNumber}/
      const chapterNumber = chapterFormData.number;
      setUploadingProgress({ current: 0, total: imagePreviews.length });
      setUploadedPages(new Set());
      const newImageUrls: string[] = [];
      let pageNo = 1;

      for (let index = 0; index < imagePreviews.length; index++) {
        const preview = imagePreviews[index];
        const group = editPageGroups[index];

        if (chapterImages[index] instanceof File || (preview.startsWith("data:") && (!group || group.length === 0))) {
          let fileToUpload: Blob;
          if (chapterImages[index] instanceof File) {
            fileToUpload = chapterImages[index];
          } else {
            const blobRes = await fetch(preview);
            fileToUpload = await blobRes.blob();
          }
          const uploadForm = new FormData();
          uploadForm.append("file", fileToUpload, chapterImages[index]?.name || `page-${index + 1}.jpg`);
          uploadForm.append("folder", `manga/${manga.slug}/episodes/${chapterNumber}`);
          const uploadRes = await fetch("/api/uploads/image", {
            method: "POST",
            headers: { "x-session-token": sessionToken },
            body: uploadForm,
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success || !uploadData.data?.urls) {
            throw new Error(uploadData.error || `Failed to upload page ${index + 1}`);
          }
          for (const url of uploadData.data.urls as string[]) {
            const pageRes = await fetch(`/api/chapters/${editingChapterId}/pages`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
              body: JSON.stringify({ pageNo: pageNo++, imageUrl: url }),
            });
            if (!pageRes.ok) { const e = await pageRes.json(); throw new Error(e.error || "Failed to create page record"); }
            newImageUrls.push(url);
          }
        } else if (group && group.length > 0) {
          for (const url of group) {
            const pageRes = await fetch(`/api/chapters/${editingChapterId}/pages`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
              body: JSON.stringify({ pageNo: pageNo++, imageUrl: url }),
            });
            if (!pageRes.ok) { const e = await pageRes.json(); throw new Error(e.error || "Failed to create page record"); }
            newImageUrls.push(url);
          }
        } else {
          const pageRes = await fetch(`/api/chapters/${editingChapterId}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
            body: JSON.stringify({ pageNo: pageNo++, imageUrl: preview }),
          });
          if (!pageRes.ok) { const e = await pageRes.json(); throw new Error(e.error || "Failed to create page record"); }
          newImageUrls.push(preview);
        }
        setUploadingProgress({ current: index + 1, total: imagePreviews.length });
        setUploadedPages((prev) => new Set(prev).add(index));
      }

      setUploadingProgress(null);

      // เคลียร์รูปเก่าที่ไม่ได้ใช้แล้ว (ทั้งใน S3 และไม่ให้ค้างในระบบ)
      if (oldPages.length > 0) {
        const oldImageUrls = oldPages.map((p) => p.imageUrl);
        const urlsToDelete = oldImageUrls.filter(
          (url) => !newImageUrls.includes(url),
        );

        if (urlsToDelete.length > 0) {
          try {
            await fetch("/api/uploads/cleanup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-session-token": sessionToken,
              },
              body: JSON.stringify({ urls: urlsToDelete }),
            });
          } catch (err) {
            console.error("Failed to cleanup old images:", err);
          }
        }
      }

      toast.success("แก้ไขข้อมูลตอนแล้ว 👌");
      setShowAddChapterModal(false);
      setEditingChapterId(null);
      setImagePreviews([]);
      setChapterImages([]);
      setEditPageGroups([]);
      setUploadedPages(new Set());
      await fetchManga(); // Refresh manga data
    } catch (error) {
      console.error("Failed to update chapter:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตตอน");
    } finally {
      setUploadingChapter(false);
    }
  };

  const handleUploadMultiChapters = async () => {
    if (!manga || !zipFile) return;

    // รอให้ auth โหลดเสร็จ
    if (authLoading) return;

    // ต้องล็อกอินก่อน
    if (!authUser) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!authUser) {
        toast.error("กรุณาเข้าสู่ระบบก่อนอัพโหลดหลายตอน");
        router.push("/login");
        return;
      }
    }

    try {
      setUploadingChapter(true);
      setUploadingProgress(null);
      setMultiChapterProgress(null);
      setMultiUploadProcessing(true);
      setMultiUploadStep(0);
      setCarouselIndex(0);

      const sessionToken = localStorage.getItem("session_token") || "";
      if (!sessionToken) {
        toast.error("กรุณาเข้าสู่ระบบก่อนอัพโหลดหลายตอน");
        router.push("/login");
        return;
      }

      // 1) โหลดข้อมูล ZIP ฝั่ง client
      const zip = await JSZip.loadAsync(zipFile);
      const files = Object.keys(zip.files);
      const hasFolders = files.some((file) => zip.files[file].dir);

      type ChapterFromZip = {
        number: number;
        title: string;
        filePaths: string[];
      };

      const chaptersFromZip: ChapterFromZip[] = [];

      // Helper: แปลงชื่อเป็นเลขตอน (เหมือนฝั่ง API)
      const extractChapterNumber = (name: string): number | null => {
        const match = name.match(/ตอนที่\s*(\d+(?:\.\d+)?)/i);
        if (match) return parseFloat(match[1]);
        const filenameMatch = name.match(/(\d+(?:\.\d+)?)/);
        if (filenameMatch) return parseFloat(filenameMatch[1]);
        return null;
      };

      if (hasFolders) {
        // โครงสร้างหลายตอน: แยกตามโฟลเดอร์
        const folders = files.filter((file) => zip.files[file].dir);

        for (const folder of folders) {
          const folderName = folder.replace(/\/$/, "");
          const chapterNumber = extractChapterNumber(folderName);
          if (!chapterNumber) continue;

          const folderFiles = files.filter(
            (file) => file.startsWith(folder) && !zip.files[file].dir,
          );

          const sortedFiles = folderFiles
            .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
            .sort((a, b) => {
              const nameA = a.replace(folder, "").toLowerCase();
              const nameB = b.replace(folder, "").toLowerCase();
              return nameA.localeCompare(nameB, undefined, {
                numeric: true,
                sensitivity: "base",
              });
            });

          if (sortedFiles.length === 0) continue;

          chaptersFromZip.push({
            number: chapterNumber,
            title: `ตอนที่ ${chapterNumber}`,
            filePaths: sortedFiles,
          });
        }
      } else {
        // โครงสร้างตอนเดียว: รูปอยู่ root ของ ZIP
        const imageFiles = files
          .filter(
            (file) =>
              !zip.files[file].dir && /\.(jpg|jpeg|png|webp)$/i.test(file),
          )
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), undefined, {
            numeric: true,
            sensitivity: "base",
          }));

        if (imageFiles.length === 0) {
          throw new Error("ไม่พบไฟล์รูปภาพใน ZIP");
        }

        const chapterNumber = extractChapterNumber(zipFileName || zipFile.name) || 1;

        chaptersFromZip.push({
          number: chapterNumber,
          title: `ตอนที่ ${chapterNumber}`,
          filePaths: imageFiles,
        });
      }

      if (chaptersFromZip.length === 0) {
        toast.error("ไม่พบตอนที่สามารถอัพโหลดได้ใน ZIP");
        setMultiUploadProcessing(false);
        return;
      }

      // 2) โหลดรายการตอนที่มีอยู่แล้วของมังงะ เพื่อเช็คตอนซ้ำ
      const existingRes = await fetch(`/api/manga/${manga.id}/chapters`);
      const existingJson = await existingRes.json();
      const existingChapters: Array<{ number: number }> =
        existingJson?.success && existingJson.data?.chapters
          ? existingJson.data.chapters
          : [];

      const existingNumbers = new Set(existingChapters.map((c) => c.number));

      // 3) สร้าง state เริ่มต้นสำหรับ progress
      setMultiChapterProgress({
        current: 0,
        total: chaptersFromZip.length,
        results: chaptersFromZip.map((ch): MultiChapterResult => {
          const isDuplicate = existingNumbers.has(ch.number);
          return {
            number: ch.number,
            title: ch.title,
            status: isDuplicate ? "skipped" : "pending",
            message: isDuplicate
              ? `ตอนที่ ${ch.number} มีอยู่แล้ว (ซ้ำ)`
              : undefined,
            totalPages: ch.filePaths.length,
            uploadedPages: 0,
          };
        }),
      });

      let successCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // 4) ประมวลผลทีละตอน (เพื่อให้รู้ progress จริง)
      for (const chapterData of chaptersFromZip) {
        const isDuplicate = existingNumbers.has(chapterData.number);

        if (isDuplicate) {
          skippedCount += 1;
          setMultiChapterProgress((prev) => {
            if (!prev) return prev;
            const results: MultiChapterResult[] = prev.results.map((r): MultiChapterResult =>
              r.number === chapterData.number
                ? {
                    ...r,
                    status: "skipped",
                    message: `ตอนที่ ${chapterData.number} มีอยู่แล้ว (ซ้ำ)`,
                  }
                : r,
            );
            return {
              ...prev,
              current: prev.current + 1,
              results,
            };
          });
          continue;
        }

        // อัพเดทสถานะเป็นกำลังประมวลผล
        setMultiChapterProgress((prev) => {
          if (!prev) return prev;
          const results: MultiChapterResult[] = prev.results.map((r): MultiChapterResult =>
            r.number === chapterData.number
              ? { ...r, status: "processing", uploadedPages: 0 }
              : r,
          );
          return { ...prev, results };
        });

        try {
          // 4.1) สร้างตอนใหม่
          const chapterSlug = await generateUniqueChapterSlug();
          const createChapterRes = await fetch(
            `/api/manga/${manga.id}/chapters`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-session-token": sessionToken,
              },
              body: JSON.stringify({
                title: chapterData.title,
                number: chapterData.number,
                slug: chapterSlug,
                isLocked: getCurrentPrice() > 0,
                priceCoins: getCurrentPrice(),
                publishedAt:
                  chapterFormData.status === "published"
                    ? new Date().toISOString()
                    : undefined,
              }),
            },
          );

          const createChapterJson = await createChapterRes.json();
          if (!createChapterRes.ok || !createChapterJson.success || !createChapterJson.data?.chapter) {
            throw new Error(
              createChapterJson.error ||
                `สร้างตอนที่ ${chapterData.number} ไม่สำเร็จ`,
            );
          }

          const chapterId = createChapterJson.data.chapter.id;

          // 4.2) อัพโหลดรูปทีละหน้า + สร้าง page record
          let uploadedPages = 0;
          for (let i = 0; i < chapterData.filePaths.length; i++) {
            const path = chapterData.filePaths[i];
            const entry = zip.files[path];
            if (!entry || entry.dir) continue;

            const blob = await entry.async("blob");
            const fileName = path.split("/").pop() || path;
            const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

            // อัพโหลดรูปไป S3
            const uploadForm = new FormData();
            uploadForm.append("file", file);
            uploadForm.append(
              "folder",
              `manga/${manga.slug}/episodes/${chapterData.number}`,
            );

            const uploadRes = await fetch("/api/uploads/image", {
              method: "POST",
              headers: { "x-session-token": sessionToken },
              body: uploadForm,
            });

            const uploadJson = await uploadRes.json();
            if (
              !uploadRes.ok ||
              !uploadJson.success ||
              !uploadJson.data?.url
            ) {
              throw new Error(
                uploadJson.error ||
                  `อัพโหลดรูปหน้า ${i + 1} ของตอนที่ ${chapterData.number} ไม่สำเร็จ`,
              );
            }

            const imageUrl = uploadJson.data.url;

            // สร้าง page record
            const pageRes = await fetch(`/api/chapters/${chapterId}/pages`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-session-token": sessionToken,
              },
              body: JSON.stringify({
                pageNo: i + 1,
                imageUrl,
              }),
            });

            const pageJson = await pageRes.json().catch(() => ({}));
            if (!pageRes.ok) {
              throw new Error(
                pageJson.error ||
                  `สร้างหน้า ${i + 1} ของตอนที่ ${chapterData.number} ไม่สำเร็จ`,
              );
            }

            uploadedPages += 1;

            // อัพเดท progress ของตอนนี้ (ตามจำนวนรูป)
            setMultiChapterProgress((prev) => {
              if (!prev) return prev;
              const results: MultiChapterResult[] = prev.results.map((r): MultiChapterResult =>
                r.number === chapterData.number
                  ? {
                      ...r,
                      status: "processing",
                      uploadedPages,
                      totalPages:
                        r.totalPages ?? chapterData.filePaths.length,
                    }
                  : r,
              );
              return { ...prev, results };
            });
          }

          // ตอนนี้เสร็จสมบูรณ์
          successCount += 1;
          setMultiChapterProgress((prev) => {
            if (!prev) return prev;
            const results: MultiChapterResult[] = prev.results.map((r): MultiChapterResult =>
              r.number === chapterData.number
                ? {
                    ...r,
                    status: "success",
                    uploadedPages: r.totalPages ?? uploadedPages,
                    message: `ตอนที่ ${chapterData.number} อัพโหลดสำเร็จ (${uploadedPages} หน้า)`,
                  }
                : r,
            );
            return {
              ...prev,
              current: prev.current + 1,
              results,
            };
          });
        } catch (err) {
          console.error(`Error processing chapter ${chapterData.number}:`, err);
          errorCount += 1;
          setMultiChapterProgress((prev) => {
            if (!prev) return prev;
            const results: MultiChapterResult[] = prev.results.map((r): MultiChapterResult =>
              r.number === chapterData.number
                ? {
                    ...r,
                    status: "error",
                    message:
                      err instanceof Error
                        ? err.message
                        : `ตอนที่ ${chapterData.number} เกิดข้อผิดพลาด`,
                  }
                : r,
            );
            return {
              ...prev,
              current: prev.current + 1,
              results,
            };
          });
        }
      }

      setMultiUploadProcessing(false);

      // สรุปผล
      if (multiChapterProgress) {
        setCarouselIndex(0);
      }

      let message = `สร้างตอนสำเร็จ ${successCount} ตอน`;
      if (skippedCount > 0) message += `, ข้าม ${skippedCount} ตอน (ซ้ำ)`;
      if (errorCount > 0) message += `, เกิดข้อผิดพลาด ${errorCount} ตอน`;
      message += " 👌";

      toast.success(message);

      await fetchManga();
    } catch (error) {
      console.error("Failed to upload chapters:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดตอน");
      setMultiUploadProcessing(false);
    } finally {
      setUploadingChapter(false);
    }
  };

  if (authLoading || (loading && !manga)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <p className="text-muted-foreground ml-3">กำลังโหลด...</p>
      </div>
    );
  }

  if (!manga) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/writer/comics"
              className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">แก้ไขการ์ตูน</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{manga.title}</p>
            </div>
          </div>

        </div>

      {/* Tabs + Meta Info */}
      <div className="border-b border-border mt-2 pb-1 flex items-end justify-between gap-4">
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "px-4 py-2 font-medium text-xs transition-colors relative",
              activeTab === "info"
                ? "text-orange-500"
                : "text-muted-foreground hover:text-foreground"
            )}>
            ข้อมูลการ์ตูน
            {activeTab === "info" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={cn(
              "px-4 py-2 font-medium text-xs transition-colors relative",
              activeTab === "episodes"
                ? "text-orange-500"
                : "text-muted-foreground hover:text-foreground"
            )}>
            รายชื่อตอน
            {activeTab === "episodes" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={cn(
              "px-4 py-2 font-medium text-xs transition-colors relative",
              activeTab === "stats"
                ? "text-orange-500"
                : "text-muted-foreground hover:text-foreground"
            )}>
            รายงานและสถิติ
            {activeTab === "stats" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        </div>

        {/* Meta info + public link */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>วันที่สร้าง: {formatThaiDate(manga.createdAt)}</span>
            <span className="text-border">|</span>
            <span>อัปเดต: {formatThaiDate(manga.updatedAt)}</span>
          </div>
          <Link
            href={`/comic/${manga.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-[11px] font-medium transition-colors"
          >
            ไปยังหน้ามังงะ
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
              {/* Cover Preview + Upload */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
                  <div className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground">ภาพหน้าปก</h3>
                    </div>
                <div className={cn(
                  "aspect-[5/7] bg-muted rounded-lg overflow-hidden mb-2 relative group cursor-pointer border-2 transition-all duration-300",
                  coverError ? "border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-500/20" : "border-border"
                )}>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  {checkingNsfw ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <p className="text-sm">กำลังตรวจสอบเนื้อหาภาพ...</p>
                    </div>
                  ) : (coverPreview || formData.coverUrl) ? (
                    <>
                      <img
                        key={coverPreview || formData.coverUrl}
                        src={coverPreview || formData.coverUrl}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                        onClick={() => !coverBlocked && coverInputRef.current?.click()}
                      />
                      {/* Camera overlay - ซ่อนเมื่อถูกบล็อก */}
                      {!coverBlocked && (
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="flex flex-col items-center gap-2 text-white">
                            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">เปลี่ยนภาพหน้าปก</span>
                          </div>
                        </div>
                      )}
                      {/* 18+ warning overlay */}
                      {coverError && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                            ⚠️ ตรวจพบเนื้อหา 18+
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      onClick={() => !coverBlocked && coverInputRef.current?.click()}>
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      {coverError && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                            ⚠️ ตรวจพบเนื้อหา 18+
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-1">ข้อมูลพื้นฐาน</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                      ชื่อเรื่อง <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formData.title.length}/120)
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={formData.title}
                      onChange={(e) => {
                        setTitleError(null);
                        setFormData({ ...formData, title: e.target.value });
                      }}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                        titleError ? "border-red-500" : "border-border"
                      )}
                      placeholder="ชื่อเรื่อง"
                    />
                    {titleError && (
                      <p className="mt-1 text-xs text-red-500">{titleError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      ชื่อเรื่องต้นฉบับ <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formData.originalTitle.length}/120)
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={formData.originalTitle}
                      onChange={(e) => {
                        setOriginalTitleError(null);
                        setFormData({ ...formData, originalTitle: e.target.value });
                      }}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                        originalTitleError ? "border-red-500" : "border-border"
                      )}
                      placeholder="ชื่อเรื่องต้นฉบับ"
                    />
                    {originalTitleError && (
                      <p className="mt-1 text-xs text-red-500">{originalTitleError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div ref={mainGenreDropdownRef}>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      หมวดหมู่หลัก <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowMainGenreDropdown((open) => !open)
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                      >
                        <span className={cn(
                          "text-sm",
                          formData.mainGenreSlug ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {(() => {
                            const selected = mainGenres.find(
                              (g) => g.slug === formData.mainGenreSlug,
                            );
                            return selected ? selected.name : "เลือกหมวดหมู่หลัก";
                          })()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showMainGenreDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
                          {mainGenres.map((genre) => {
                            const isSelected =
                              formData.mainGenreSlug === genre.slug;
                            return (
                              <button
                                key={genre.slug}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    mainGenreSlug: genre.slug,
                                  }));
                                  setShowMainGenreDropdown(false);
                                }}
                                className={cn(
                                  "w-full px-3 py-2.5 flex items-center justify-between text-sm",
                                  "hover:bg-muted/70",
                                  isSelected
                                    ? "bg-muted text-foreground"
                                    : "text-foreground",
                                )}
                              >
                                <span>{genre.name}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-orange-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div ref={subGenreDropdownRef}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      หมวดหมู่รอง
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowSubGenreDropdown((open) => !open)
                        }
                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                      >
                        <span className={cn(
                          "text-sm",
                          formData.subGenreSlug ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {(() => {
                            const selected = subGenres.find(
                              (g) => g.slug === formData.subGenreSlug,
                            );
                            if (!selected) {
                              return subGenres.length === 0
                                ? "กำลังโหลด..."
                                : "เลือกหมวดหมู่รอง";
                            }
                            return selected.name;
                          })()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showSubGenreDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
                          {subGenres.length === 0 ? (
                            <div className="px-3 py-2.5 text-sm text-muted-foreground">
                              ไม่มีข้อมูล กรุณา seed ข้อมูล genres
                            </div>
                          ) : (
                            subGenres.map((genre) => {
                              const isSelected =
                                formData.subGenreSlug === genre.slug;
                              return (
                                <button
                                  key={genre.slug}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      subGenreSlug: genre.slug,
                                    }));
                                    setShowSubGenreDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2.5 flex items-center justify-between text-sm",
                                    "hover:bg-muted/70 text-foreground",
                                    isSelected
                                      ? "bg-muted text-foreground"
                                      : "",
                                  )}
                                >
                                  <span>{genre.name}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-orange-500" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div ref={ratingDropdownRef}>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      ระดับของเนื้อหา <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowRatingDropdown((open) => !open)
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <span className="text-sm text-foreground">
                          {formData.isMature ? "18+" : "ทั่วไป"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showRatingDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                          {[
                            { value: "general", label: "ทั่วไป", isMature: false },
                            { value: "mature", label: "18+", isMature: true },
                          ].map((opt) => {
                            const isSelected =
                              formData.isMature === opt.isMature;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    isMature: opt.isMature,
                                  }));
                                  setShowRatingDropdown(false);
                                }}
                                className={cn(
                                  "w-full px-3 py-2.5 flex items-center justify-between text-sm",
                                  "hover:bg-muted/70",
                                  isSelected
                                    ? "bg-muted text-foreground"
                                    : "text-foreground",
                                )}
                              >
                                <span>{opt.label}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-orange-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div ref={contentTypeDropdownRef}>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      ประเภทเนื้อหา <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowContentTypeDropdown((open) => !open)
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const selected = contentTypeOptions.find(
                              (opt) => opt.value === formData.contentType,
                            );
                            if (!selected) {
                              return (
                                <>
                                  <Globe2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    เลือกประเภทเนื้อหา
                                  </span>
                                </>
                              );
                            }
                            return (
                              <>
                                <img
                                  src={selected.iconUrl}
                                  alt={selected.label}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-sm text-foreground">
                                  {selected.label}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showContentTypeDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
                          {contentTypeOptions.map((opt) => {
                            const isSelected =
                              formData.contentType === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    contentType: opt.value,
                                  }));
                                  setShowContentTypeDropdown(false);
                                }}
                                className={cn(
                                  "w-full px-3 py-2.5 flex items-center gap-2 text-sm",
                                  "hover:bg-muted/70",
                                  isSelected
                                    ? "bg-muted text-foreground"
                                    : "text-foreground",
                                )}
                              >
                                <img
                                  src={opt.iconUrl}
                                  alt={opt.label}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="flex-1 text-left">
                                  {opt.label}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-orange-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Synopsis + Description */}
              <div className="space-y-4">
                {/* Synopsis (short) */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    เรื่องย่อ (สั้น)
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    ใช้สำหรับหน้า Search (จำกัดไม่เกิน 120 คำ)
                  </p>
                  <textarea
                    value={formData.synopsis}
                    maxLength={120}
                    onChange={(e) => {
                      setSynopsisError(null);
                      setFormData((prev) => ({ ...prev, synopsis: e.target.value }));
                    }}
                    className="min-h-[100px] w-full px-3 py-2 text-sm leading-relaxed outline-none bg-background border border-border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                    placeholder="พิมพ์เรื่องย่อแบบสั้น..."
                  />
                  <div className="px-1 py-1 text-xs text-muted-foreground text-right">
                    {(formData.synopsis || "").length}/120
                  </div>
                  {synopsisError && (
                    <p className="mt-1 text-xs text-red-500">{synopsisError}</p>
                  )}
                </div>

                {/* Description */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    แนะนำเรื่อง
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    จำกัดไม่เกิน 750 ตัวอักษร
                  </p>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(html) => {
                      setDescriptionError(null);
                      setFormData((prev) => ({ ...prev, description: html }));
                    }}
                    maxLength={750}
                    placeholder="พิมพ์เนื้อหาตรงนี้"
                  />
                  {descriptionError && (
                    <p className="mt-1 text-xs text-red-500">{descriptionError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Settings */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-base font-semibold text-foreground mb-3">ตั้งค่าเรื่อง</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">สถานะเรื่อง</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.visibility === Visibility.PUBLIC ? "เผยแพร่" : "ไม่เผยแพร่"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.visibility === Visibility.PUBLIC}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              visibility: e.target.checked
                                ? Visibility.PUBLIC
                                : Visibility.PRIVATE,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">สถานะจบ</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.status === MangaStatus.COMPLETED ? "จบแล้ว" : "ยังไม่จบ"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.status === MangaStatus.COMPLETED}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.checked
                                ? MangaStatus.COMPLETED
                                : MangaStatus.ONGOING,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <label className="block text-sm font-medium text-foreground mb-3">
                    แท็ก
                    <span className="text-xs text-muted-foreground ml-2">({tagInput.length}/20)</span>
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      maxLength={20}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                      placeholder="พิมพ์แท็กของคุณตรงนี้ และกด Enter เพื่อเพิ่มแท็ก"
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(index)}
                              className="hover:text-orange-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/writer/comics"
                  className="px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors">
                  ยกเลิก
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                  อัปเดตข้อมูลการ์ตูน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "episodes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">รายชื่อตอน</h2>
            <button
              onClick={() => {
                if (!manga) {
                  toast.error("ไม่พบมังงะ");
                  return;
                }
                // Set default chapter number to next available
                const nextNumber = manga?.chapters.length 
                  ? Math.max(...manga.chapters.map(c => c.number)) + 1 
                  : 1;

                // ค่าเริ่มต้นทุกครั้งที่เปิดเพิ่มตอนใหม่ -> โหมดตอนเดียว
                setChapterType("single");
                setMultiChapterProgress(null);
                setMultiUploadProcessing(false);
                setMultiUploadStep(0);
                setCarouselIndex(0);
                setZipFile(null);
                setZipFileName("");

                setChapterFormData({
                  title: "",
                  number: nextNumber,
                  price: 0,
                  status: "published",
                  scheduleEnabled: false,
                  scheduledAt: "",
                });
                setPriceInputValue("0");
                setIsPaidMode(false);
                setChapterImages([]);
                setImagePreviews([]);
                setShowAddChapterModal(true);
              }}
              disabled={!manga}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                manga
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}>
              <Plus className="w-4 h-4" />
              เพิ่มตอนการ์ตูนใหม่
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* จำนวนรายการต่อหน้า (ใช้ popup แบบเดียวกันทุกที่) */}
                <PageSizeSelect
                  value={chapterPageSize}
                  onChange={(newSize) => {
                    setChapterPageSize(newSize);
                    setChapterPage(1); // เปลี่ยนจำนวนต่อหน้า → กลับไปหน้าแรก
                  }}
                  options={[50, 100, 500, 1000]}
                />

                {/* การเรียงลำดับตอน */}
                <OrderSelect
                  value={chapterSortOrder}
                  onChange={(val) => setChapterSortOrder(val)}
                />
              </div>

              {/* สรุปรายการที่กำลังแสดงอยู่ */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {manga && manga.chapters.length > 0 && (
                  <span>
                    แสดง{" "}
                    {Math.min(
                      manga.chapters.length,
                      (chapterPage - 1) * chapterPageSize + 1,
                    )}{" "}
                    -{" "}
                    {Math.min(chapterPage * chapterPageSize, manga.chapters.length)}{" "}
                    จาก {manga.chapters.length} ตอน
                  </span>
                )}
              </div>
            </div>

            {manga && selectedChapterIds.length > 0 && (
              <div className="px-4 py-3 border-b border-orange-300 bg-orange-50/80 dark:bg-orange-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileStack className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-foreground">
                    เลือกแล้ว {selectedChapterIds.length} ตอน
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 bg-background/80 border border-orange-200 rounded-lg px-2 py-1">
                    <span className="whitespace-nowrap">กำหนดราคา:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={bulkPriceInput}
                      onChange={(e) => {
                        let v = e.target.value;
                        // รองรับทั้ง . และ , เป็นทศนิยม
                        if (v === "" || v === "." || v === ",") {
                          setBulkPriceInput(v);
                          return;
                        }
                        v = v.replace(",", ".");
                        if (v.match(/^\d*\.?\d{0,2}$/)) {
                          setBulkPriceInput(v);
                        }
                      }}
                      className="w-20 px-2 py-1 border border-border rounded-md bg-background text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleBulkSetPrice}
                      disabled={bulkWorking}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs sm:text-sm transition-colors",
                        bulkWorking
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-orange-500 text-white hover:bg-orange-600",
                      )}
                    >
                      {bulkWorking ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      ) : (
                        <Coins className="w-3 h-3" />
                      )}
                      <span>บันทึก</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkPublish}
                    disabled={bulkWorking}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors",
                      bulkWorking
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600",
                    )}
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>เผยแพร่</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkUnpublish}
                    disabled={bulkWorking}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors",
                      bulkWorking
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-yellow-500 text-white hover:bg-yellow-600",
                    )}
                  >
                    <FileText className="w-3 h-3" />
                    <span>ตั้งเป็นแบบร่าง</span>
                  </button>
                  <button
                    type="button"
                    onClick={openBulkDeleteDialog}
                    disabled={bulkWorking}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors",
                      bulkWorking
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600",
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ลบตอน</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">
                      <label className="inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isAllChaptersSelected}
                          onChange={handleToggleSelectAllChapters}
                        />
                        <span
                          className={cn(
                            "w-4 h-4 rounded-md border border-border bg-background flex items-center justify-center transition-colors",
                            "peer-checked:border-orange-500 peer-checked:bg-orange-500",
                          )}
                        >
                          <Check className="w-3 h-3 text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </span>
                      </label>
                    </th>
                    <th className="text-left p-4 font-medium text-sm">ลำดับตอน</th>
                    <th className="text-left p-4 font-medium text-sm">ชื่อตอน</th>
                    <th className="text-left p-4 font-medium text-sm">ยอดวิว</th>
                    <th className="text-left p-4 font-medium text-sm">ยอดคอมเมนต์</th>
                    <th className="text-left p-4 font-medium text-sm">ยอดขายรวม</th>
                    <th className="text-left p-4 font-medium text-sm">การเผยแพร่</th>
                    <th className="text-left p-4 font-medium text-sm">อัปเดตล่าสุด</th>
                    <th className="text-left p-4 font-medium text-sm">กำหนดราคาตอน</th>
                    <th className="text-right p-4 font-medium text-sm">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {manga.chapters.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        ยังไม่มีตอน
                      </td>
                    </tr>
                  ) : (
                    visibleChapters.map((chapter) => (
                      <tr
                        key={chapter.id}
                        className={cn(
                          "border-b border-border transition-colors",
                          selectedChapterIds.includes(chapter.id)
                            ? "bg-orange-50/70 dark:bg-orange-950/40"
                            : "hover:bg-muted/20",
                        )}
                      >
                        <td className="p-4">
                          <label className="inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={selectedChapterIds.includes(chapter.id)}
                              onChange={() => toggleSelectChapter(chapter.id)}
                            />
                            <span
                              className={cn(
                                "w-4 h-4 rounded-md border border-border bg-background flex items-center justify-center transition-colors",
                                "peer-checked:border-orange-500 peer-checked:bg-orange-500",
                              )}
                            >
                              <Check className="w-3 h-3 text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </span>
                          </label>
                        </td>
                        <td className="p-4 text-sm">{chapter.number}</td>
                        <td className="p-4 text-sm font-medium">{chapter.title}</td>
                        <td className="p-4 text-sm">{chapter.views.toLocaleString()}</td>
                        <td className="p-4 text-sm">0</td>
                        <td className="p-4 text-sm text-orange-500 font-medium">0</td>
                        <td className="p-4">
                          {chapter.publishedAt ? (
                            new Date(chapter.publishedAt) > new Date() ? (
                              <div className="flex flex-col items-start gap-1">
                                <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/40 text-xs rounded-full">
                                  รอเผยแพร่
                                </span>
                                <span className="text-[11px] text-yellow-500/70 pl-1">
                                  {formatThaiDate(chapter.publishedAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 bg-green-500 text-white text-xs rounded-full">
                                เผยแพร่
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                              ซ่อน
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {chapter.publishedAt
                            ? formatThaiDate(chapter.publishedAt)
                            : formatThaiDate(chapter.updatedAt)}
                        </td>
                        <td className="p-4 text-sm">
                          {chapter.isLocked ? (
                            <div className="flex items-center gap-1.5 text-orange-500 font-medium">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/10">
                                <Coins className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-[13px] text-foreground">
                                {chapter.priceCoins.toLocaleString("th-TH", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                เหรียญ
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-700 border border-gray-200">
                              อ่านฟรี
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                if (!loadingChapterData) {
                                  fetchChapterForEdit(chapter.id);
                                }
                              }}
                              disabled={loadingChapterData}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-400/60 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20 hover:border-orange-300 transition-colors text-xs sm:text-sm",
                                loadingChapterData && "opacity-50 cursor-not-allowed",
                              )}>
                              {loadingChapterData ? (
                                <>
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-orange-500"></div>
                                  <span>กำลังโหลด...</span>
                                </>
                              ) : (
                                <>
                                  <Pencil className="w-3.5 h-3.5" />
                                  แก้ไข
                                </>
                              )}
                            </button>
                            
                            {/* Separator */}
                            <div className="w-px h-6 bg-border mx-1" />
                            
                            {/* Delete single chapter */}
                            <button
                              onClick={() => openSingleDeleteDialog(chapter.id)}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs sm:text-sm shadow-sm transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            {/* External Link Button */}
                            <button
                              onClick={() => {
                                window.open(`/comic/chapter/${chapter.slug}`, "_blank");
                              }}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm shadow-sm transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {manga.chapters.length > 0 && (() => {
              const totalPages = Math.max(
                1,
                Math.ceil(manga.chapters.length / chapterPageSize),
              );
              const pageItems = getPageItems(totalPages, chapterPage);

              return (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    จำนวนตอนทั้งหมด {manga.chapters.length} ตอน
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                      disabled={chapterPage === 1}
                      className={cn(
                        "px-3 py-1.5 border border-border rounded-lg text-sm",
                        chapterPage === 1
                          ? "text-muted-foreground cursor-not-allowed opacity-50"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      ก่อนหน้า
                    </button>

                    {pageItems.map((item, idx) =>
                      item === "dots" ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 py-1 text-sm text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setChapterPage(item)}
                          className={cn(
                            "min-w-[2rem] px-2.5 py-1.5 rounded-lg text-sm border border-border",
                            chapterPage === item
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-background text-foreground hover:bg-muted",
                          )}
                        >
                          {item}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setChapterPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={chapterPage >= totalPages}
                      className={cn(
                        "px-3 py-1.5 border border-border rounded-lg text-sm",
                        chapterPage >= totalPages
                          ? "text-muted-foreground cursor-not-allowed opacity-50"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      ต่อไป
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Secondary Navigation */}
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <button
              onClick={() => setActiveStatsTab("sales")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                activeStatsTab === "sales"
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              <BarChart3 className="w-4 h-4" />
              รายงานยอดขาย
            </button>
            <button
              onClick={() => setActiveStatsTab("analytics")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                activeStatsTab === "analytics"
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              <TrendingUp className="w-4 h-4" />
              สถิติการ์ตูน
            </button>
          </div>

          {activeStatsTab === "sales" && (
            <div className="space-y-6">
              {/* Total Sales Summary */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 text-lg">
                  <span className="text-muted-foreground">ยอดขายรวม :</span>
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="font-semibold text-foreground">
                    {salesData?.totalSales.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                  </span>
                </div>
              </div>

              {/* Monthly and Yearly Sales Reports - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales Report */}
                <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">รายงานการขายรายเดือน</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ข้อมูลประจำเดือน :</span>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                        {[
                          "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                        ].map((month, index) => (
                          <option key={index} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ปี:</span>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                        {Array.from({ length: getCurrentYearBE() - 2566 + 1 }, (_, i) => 2566 + i).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {loadingSales ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="h-[300px]">
                      <MonthlySalesChart
                        data={salesData?.monthlySales
                          ? Object.entries(salesData.monthlySales).map(([day, sales]) => ({
                              day: Number(day),
                              sales,
                            }))
                          : []}
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">ยอดขายรวมรายเดือน :</span>
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="font-semibold text-foreground">
                        {salesData?.totalSalesThisMonth.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </span>
                    </div>
                    </>
                  )}
                </div>

                {/* Annual Sales Report */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">รายงานการขายรายปี</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">ข้อมูลประจำปี :</span>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                        {Array.from({ length: getCurrentYearBE() - 2566 + 1 }, (_, i) => 2566 + i).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {loadingSales ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <YearlySalesChart
                          data={salesData?.yearlySales
                            ? [
                                { month: "มกราคม", sales: salesData.yearlySales[1] || 0 },
                                { month: "กุมภาพันธ์", sales: salesData.yearlySales[2] || 0 },
                                { month: "มีนาคม", sales: salesData.yearlySales[3] || 0 },
                                { month: "เมษายน", sales: salesData.yearlySales[4] || 0 },
                                { month: "พฤษภาคม", sales: salesData.yearlySales[5] || 0 },
                                { month: "มิถุนายน", sales: salesData.yearlySales[6] || 0 },
                                { month: "กรกฎาคม", sales: salesData.yearlySales[7] || 0 },
                                { month: "สิงหาคม", sales: salesData.yearlySales[8] || 0 },
                                { month: "กันยายน", sales: salesData.yearlySales[9] || 0 },
                                { month: "ตุลาคม", sales: salesData.yearlySales[10] || 0 },
                                { month: "พฤศจิกายน", sales: salesData.yearlySales[11] || 0 },
                                { month: "ธันวาคม", sales: salesData.yearlySales[12] || 0 },
                              ]
                            : []}
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">ยอดขายรวมรายปี :</span>
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="font-semibold text-foreground">
                          {salesData?.totalSalesThisYear.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top Chapters and Recent Purchases - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Chapters with Highest Sales */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <List className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-foreground">10 อันดับตอนที่มียอดขายสูงสุด</h3>
                  </div>
                  {loadingTopChapters ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">อันดับที่</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ชื่อตอน</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">ยอดขาย</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topChapters.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                ไม่มีข้อมูล
                              </td>
                            </tr>
                          ) : (
                            topChapters.map((chapter) => (
                              <tr key={chapter.rank} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-3 text-sm text-foreground">{chapter.rank}</td>
                                <td className="p-3 text-sm text-foreground">{chapter.title}</td>
                                <td className="p-3 text-sm text-foreground text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Coins className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium">
                                      {chapter.sales.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 10 Latest Purchases */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <List className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-foreground">10 รายการตอนที่ผู้อ่านซื้อล่าสุด</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">วันที่ซื้อ</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">ชื่อตอน</th>
                          <th className="text-right p-3 text-sm font-medium text-muted-foreground">ราคา</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-muted-foreground">
                              ไม่มีข้อมูล
                            </td>
                          </tr>
                        ) : (
                          recentPurchases.map((purchase, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="p-3 text-sm text-foreground">{formatThaiDate(purchase.purchaseDate)}</td>
                              <td className="p-3 text-sm text-foreground">{purchase.title}</td>
                              <td className="p-3 text-sm text-foreground text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Coins className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">
                                    {purchase.price.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStatsTab === "analytics" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">สถิติการ์ตูน (Coming Soon)</p>
            </div>
          )}
        </div>
      )}

      {/* Themed Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  {deleteDialog.mode === "single" ? (
                    <>
                      คุณต้องการลบตอน{" "}
                      <span className="text-orange-500">
                        {deleteDialog.chapterTitle ||
                          `ตอนที่ ${deleteDialog.chapterNumber}`}
                      </span>{" "}
                      ใช่หรือไม่?
                    </>
                  ) : (
                    <>
                      คุณต้องการลบตอนที่เลือกทั้งหมด{" "}
                      <span className="text-orange-500">
                        {deleteDialog.count} ตอน
                      </span>{" "}
                      ใช่หรือไม่?
                    </>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  การลบนี้จะไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <div className="border border-red-300/70 bg-red-500/5 rounded-xl px-4 py-3 flex items-start gap-3 mb-5">
              <div className="mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-red-500 mb-0.5">คำเตือน</p>
                <p className="text-muted-foreground">
                  ข้อมูลตอนและรูปภาพทั้งหมดที่เกี่ยวข้องจะถูกลบออกจากระบบถาวร
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 rounded-full bg-red-500/90 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDialog}
                className="px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-4xl max-h-[90vh] mx-4 bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {editingChapterId ? "แก้ไขตอน" : "เพิ่มตอนใหม่"}
              </h2>
              <button
                onClick={() => {
                  if (uploadingChapter || uploadingProgress || multiUploadProcessing) return;
                  setShowAddChapterModal(false);
                  setEditingChapterId(null);
                  setImagePreviews([]);
                  setChapterImages([]);
                  setUploadedPages(new Set());
                  setMultiChapterProgress(null);
                  setMultiUploadProcessing(false);
                  setMultiUploadStep(0);
                  setCarouselIndex(0);
                  setZipFile(null);
                  setZipFileName("");
                  setChapterType("single");
                  setChapterFormData({
                    title: "",
                    number: 1,
                    price: 0,
                    status: "published",
                    scheduleEnabled: false,
                    scheduledAt: "",
                  });
                  setPriceInputValue("0");
                  setIsPaidMode(false);
                }}
                disabled={uploadingChapter || !!uploadingProgress || multiUploadProcessing}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  (uploadingChapter || uploadingProgress || multiUploadProcessing)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted"
                )}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Warning Message - แสดงเมื่อกำลังอัพโหลด (single หรือ multi) */}
              {(uploadingChapter || uploadingProgress) && chapterType === "single" && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mt-0.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-500 mb-1">
                        ⚠️ กำลังอัพโหลดอยู่
                      </p>
                      <p className="text-xs text-muted-foreground">
                        กรุณาอย่าออกจากหน้านี้ก่อนอัพโหลดเสร็จ หากออกจากหน้านี้ตอนจะเสียรูปจะโหลดไม่ครบ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingChapterData && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลตอน...</p>
                  </div>
                </div>
              )}

              {/* Episode Type Selection - Hide in edit mode */}
              {!editingChapterId && !loadingChapterData && (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (uploadingChapter || uploadingProgress || multiUploadProcessing) return;
                      setChapterType("single");
                      // รีเซ็ทสถานะ multi-chapter เมื่อสลับไป single
                      setMultiChapterProgress(null);
                      setMultiUploadProcessing(false);
                      setCarouselIndex(0);
                      setZipFile(null);
                      setZipFileName("");
                    }}
                    disabled={uploadingChapter || !!uploadingProgress || multiUploadProcessing}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2",
                      chapterType === "single"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-background border-border text-foreground hover:bg-muted",
                      (uploadingChapter || uploadingProgress || multiUploadProcessing) && "opacity-50 cursor-not-allowed"
                    )}>
                    <FileText className="w-4 h-4" />
                    ตอนเดียว (Single)
                  </button>
                  <button
                    onClick={() => {
                      if (uploadingChapter || uploadingProgress || multiUploadProcessing) return;
                      setChapterType("multi");
                    }}
                    disabled={uploadingChapter || !!uploadingProgress || multiUploadProcessing}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2",
                      chapterType === "multi"
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-background border-border text-foreground hover:bg-muted",
                      (uploadingChapter || uploadingProgress || multiUploadProcessing) && "opacity-50 cursor-not-allowed"
                    )}>
                    <FileStack className="w-4 h-4" />
                    หลายตอน (Multi)
                  </button>
                </div>
              )}

              {!loadingChapterData && chapterType === "single" ? (
                <>
                  {/* Information Bar - แสดงทั้งโหมดสร้างและแก้ไข */}
                  {manga && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-foreground">
                        ตอนก่อนหน้า : {(() => {
                          const prevChapter = manga.chapters.find(c => c.number === chapterFormData.number - 1);
                          return prevChapter ? `ตอนที่ ${prevChapter.number}` : manga.chapters.length > 0 ? `ตอนที่ ${Math.max(...manga.chapters.map(c => c.number))}` : "ไม่มี";
                        })()}
                      </span>
                      <span className="text-sm text-foreground">
                        จำนวนตอนทั้งหมด : {manga.chapters.length} ตอน
                      </span>
                    </div>
                  )}

                  {/* Form Fields for Single Chapter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          ชื่อตอน
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {chapterFormData.title.length}/120
                        </span>
                      </div>
                      <input
                        type="text"
                        value={chapterFormData.title}
                        onChange={(e) => {
                          if (e.target.value.length <= 120) {
                            setChapterFormData({ ...chapterFormData, title: e.target.value });
                          }
                        }}
                        placeholder={editingChapterId ? "ใส่ชื่อตอน (ว่างได้)" : "ชื่อตอน (ว่างได้ ระบบจะใช้ 'ตอนที่ X' อัตโนมัติ)"}
                        maxLength={120}
                        disabled={uploadingChapter || !!uploadingProgress}
                        className={cn(
                          "w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                          (uploadingChapter || uploadingProgress) && "opacity-50 cursor-not-allowed"
                        )}
                      />
                    </div>
                    {/* ตั้งค่าตอน – ราคา + การแสดงผล อยู่ข้างกัน */}
                    <div className="md:col-span-2 rounded-2xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
                      <div className="px-5 pt-3.5 pb-2 border-b border-border/70">
                        <span className="text-sm font-semibold text-foreground tracking-tight">
                          ตั้งค่าตอน
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-stretch divide-y md:divide-y-0 md:divide-x divide-border/70">
                        {/* ซ้าย: ราคา */}
                        <div className="flex-1 px-4 py-4 md:py-5 space-y-3 flex flex-col justify-center">
                          {/* อ่านฟรี */}
                          <label className="inline-flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              className="sr-only peer"
                              checked={!isPaidMode}
                              onChange={() => {
                                setIsPaidMode(false);
                                setChapterFormData({ ...chapterFormData, price: 0 });
                                setPriceInputValue("0");
                              }}
                              disabled={uploadingChapter || !!uploadingProgress}
                            />
                            <span
                              className={cn(
                                "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                                !isPaidMode
                                  ? "border-orange-500 bg-white"
                                  : "border-muted-foreground/40 bg-background",
                              )}
                            >
                              {!isPaidMode && (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                !isPaidMode ? "text-foreground font-medium" : "text-muted-foreground",
                              )}
                            >
                              อ่านฟรี
                            </span>
                          </label>

                          {/* กำหนดราคาเหรียญ */}
                          <label className="inline-flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              className="sr-only peer"
                              checked={isPaidMode}
                              onChange={() => {
                                setIsPaidMode(true);
                                if (chapterFormData.price === 0) {
                                  setChapterFormData({ ...chapterFormData, price: 1 });
                                  setPriceInputValue("1");
                                }
                              }}
                              disabled={uploadingChapter || !!uploadingProgress}
                            />
                            <span
                              className={cn(
                                "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                                isPaidMode
                                  ? "border-orange-500 bg-white"
                                  : "border-muted-foreground/40 bg-background",
                              )}
                            >
                              {isPaidMode && (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                isPaidMode ? "text-foreground font-medium" : "text-muted-foreground",
                              )}
                            >
                              กำหนดราคาเหรียญ
                            </span>
                            {/* Hint icon - แสดง hint เฉพาะเมื่อ hover ที่ icon */}
                            <span className="relative flex items-center group/icon">
                              <span className="flex items-center justify-center w-4 h-4 rounded-full border border-orange-400/70 text-[10px] text-orange-100 bg-background/80 shadow-sm cursor-help">
                                ?
                              </span>
                              {/* Hover hint */}
                              <span
                                className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 hidden whitespace-nowrap rounded-md bg-background/95 border border-orange-500/70 px-3 py-1 text-[11px] text-foreground shadow-xl group-hover/icon:inline-block z-30"
                              >
                                สามารถกำหนดเป็นเศษสตางค์ได้ เช่น 1.55 เป็นต้น
                              </span>
                            </span>
                          </label>

                          {/* ช่องกรอกราคา – แสดงเมื่อเลือก กำหนดราคา */}
                          {isPaidMode && (
                            <div className="flex items-center gap-2 pl-7">
                              <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                <Coins className="w-3.5 h-3.5" />
                              </span>
                              <input
                                ref={priceInputRef}
                                type="text"
                                inputMode="decimal"
                                value={priceInputValue}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  // อนุญาตให้พิมพ์ตัวเลขและจุดทศนิยมได้ (รองรับทั้ง . และ ,)
                                  if (value === "" || value === "." || value === ",") {
                                    setPriceInputValue(value);
                                    setChapterFormData((prev) => ({ ...prev, price: 0 }));
                                    return;
                                  }
                                  // แปลง , เป็น . เพื่อให้ parseFloat ทำงานได้
                                  value = value.replace(",", ".");
                                  // ตรวจสอบว่าเป็นตัวเลขหรือทศนิยมที่ถูกต้อง (ไม่เกิน 2 ตำแหน่ง)
                                  const numMatch = value.match(/^\d*\.?\d{0,2}$/);
                                  if (numMatch) {
                                    setPriceInputValue(value);
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      const rounded = Math.round(numValue * 100) / 100;
                                      setChapterFormData((prev) => ({ ...prev, price: rounded }));
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  let valueStr = e.target.value.replace(",", ".");
                                  const value = parseFloat(valueStr);
                                  // เมื่อ blur ให้ปัดเศษเป็น 2 ตำแหน่งและ format
                                  if (!isNaN(value) && value >= 0) {
                                    const rounded = Math.round(value * 100) / 100;
                                    setPriceInputValue(rounded.toString());
                                    setChapterFormData((prev) => ({ ...prev, price: rounded }));
                                  } else {
                                    setPriceInputValue("0");
                                    setChapterFormData((prev) => ({ ...prev, price: 0 }));
                                  }
                                }}
                                disabled={uploadingChapter || !!uploadingProgress}
                                className={cn(
                                  "w-28 px-3 py-1.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                                  (uploadingChapter || uploadingProgress) && "opacity-50 cursor-not-allowed",
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* ขวา: การแสดงผลตอน */}
                        <div className="flex-1 px-4 py-4 md:py-5 space-y-3 flex flex-col justify-center">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                            {/* ซ่อน */}
                            <label className="inline-flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="radio"
                                className="sr-only peer"
                                checked={getDisplayMode() === "hidden"}
                                onChange={() => handleDisplayModeChange("hidden")}
                                disabled={uploadingChapter || !!uploadingProgress}
                              />
                              <span
                                className={cn(
                                  "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                                  getDisplayMode() === "hidden"
                                    ? "border-orange-500 bg-white"
                                    : "border-muted-foreground/40 bg-background",
                                )}
                              >
                                {getDisplayMode() === "hidden" && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "text-sm",
                                  getDisplayMode() === "hidden" ? "text-foreground font-medium" : "text-muted-foreground",
                                )}
                              >
                                ซ่อน
                              </span>
                            </label>

                            {/* เผยแพร่ทันที */}
                            <label className="inline-flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="radio"
                                className="sr-only peer"
                                checked={getDisplayMode() === "now"}
                                onChange={() => handleDisplayModeChange("now")}
                                disabled={uploadingChapter || !!uploadingProgress}
                              />
                              <span
                                className={cn(
                                  "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                                  getDisplayMode() === "now"
                                    ? "border-orange-500 bg-white"
                                    : "border-muted-foreground/40 bg-background",
                                )}
                              >
                                {getDisplayMode() === "now" && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "text-sm",
                                  getDisplayMode() === "now" ? "text-foreground font-medium" : "text-muted-foreground",
                                )}
                              >
                                เผยแพร่ทันที
                              </span>
                            </label>

                            {/* ตั้งเวลาเผยแพร่ */}
                            <label className="inline-flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="radio"
                                className="sr-only peer"
                                checked={getDisplayMode() === "schedule"}
                                onChange={() => handleDisplayModeChange("schedule")}
                                disabled={uploadingChapter || !!uploadingProgress}
                              />
                              <span
                                className={cn(
                                  "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                                  getDisplayMode() === "schedule"
                                    ? "border-orange-500 bg-white"
                                    : "border-muted-foreground/40 bg-background",
                                )}
                              >
                                {getDisplayMode() === "schedule" && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "text-sm",
                                  getDisplayMode() === "schedule" ? "text-foreground font-medium" : "text-muted-foreground",
                                )}
                              >
                                ตั้งเวลาเผยแพร่
                              </span>
                            </label>
                          </div>

                          {getDisplayMode() === "schedule" && (
                            <div className="space-y-3 pt-2">
                              {/* ปฏิทินไทย */}
                              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                {/* หัวเดือน + ปุ่มเลื่อน */}
                                <div className="flex items-center justify-between px-4 py-2.5">
                                  <span className="font-semibold text-sm text-foreground">
                                    {THAI_MONTHS_FULL[scheduleCalMonth]} {scheduleCalYear}
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => navigateScheduleCalendar(-1)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigateScheduleCalendar(1)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* วันในสัปดาห์ */}
                                <div className="grid grid-cols-7 px-3 pb-1">
                                  {THAI_DAYS_SHORT.map((d) => (
                                    <div
                                      key={d}
                                      className="text-center text-[11px] font-medium text-muted-foreground py-1"
                                    >
                                      {d}
                                    </div>
                                  ))}
                                </div>

                                {/* ตารางวันที่ */}
                                <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                                  {getCalendarDays(scheduleCalYear, scheduleCalMonth).map(
                                    (day, i) => {
                                      if (day === null) return <div key={`e-${i}`} />;

                                      const isPast = isCalendarDateInPast(
                                        scheduleCalYear,
                                        scheduleCalMonth,
                                        day,
                                      );
                                      const selectedDateStr =
                                        chapterFormData.scheduledAt?.slice(0, 10) || "";
                                      const thisDateStr = `${scheduleCalYear}-${String(scheduleCalMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                      const isSelected = selectedDateStr === thisDateStr;
                                      const todayStr = new Date()
                                        .toISOString()
                                        .slice(0, 10);
                                      const isToday = thisDateStr === todayStr;

                                      return (
                                        <button
                                          key={`d-${day}`}
                                          type="button"
                                          disabled={
                                            isPast ||
                                            uploadingChapter ||
                                            !!uploadingProgress
                                          }
                                          onClick={() =>
                                            handleCalendarDateSelect(day)
                                          }
                                          className={cn(
                                            "w-8 h-8 mx-auto rounded-full text-sm flex items-center justify-center transition-all",
                                            isPast &&
                                              "text-muted-foreground/30 cursor-not-allowed",
                                            !isPast &&
                                              !isSelected &&
                                              "text-foreground cursor-pointer",
                                            isSelected &&
                                              "bg-orange-500 text-white font-semibold shadow-sm",
                                          )}
                                        >
                                          {day}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>

                              {/* แสดงวันที่และเวลาที่เลือก */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-lg bg-background">
                                  <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                                  <span className="text-sm text-foreground">
                                    {formatThaiCalendarDate(chapterFormData.scheduledAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5 border border-border rounded-lg bg-background overflow-hidden">
                                  <div className="flex items-center gap-2.5 px-3 w-full">
                                    <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                                    <input
                                      type="time"
                                      value={
                                        chapterFormData.scheduledAt?.includes("T")
                                          ? chapterFormData.scheduledAt
                                              .split("T")[1]
                                              .slice(0, 5)
                                          : ""
                                      }
                                      onChange={(e) =>
                                        handleScheduledTimeChange(e.target.value)
                                      }
                                      disabled={
                                        uploadingChapter || !!uploadingProgress
                                      }
                                      className={cn(
                                        "w-full py-2.5 bg-transparent text-sm text-foreground focus:outline-none",
                                        (uploadingChapter || uploadingProgress) &&
                                          "opacity-50 cursor-not-allowed",
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* คำเตือนเวลาในอดีต */}
                              {isScheduledInPast && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                  <p className="text-xs text-red-500 font-medium">
                                    กรุณาเลือกวันเวลาที่จะเผยแพร่ให้มากกว่าวันเวลาปัจจุบัน
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload for Single */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">
                        รูปภาพ ({editingChapterId ? imagePreviews.length : chapterImages.length} รูป)
                        {editingChapterId && editPageGroups.some(g => g.length > 1) && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">(รวม split แล้ว)</span>
                        )}
                      </label>
                      {(editingChapterId ? imagePreviews.length > 0 : chapterImages.length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (uploadingChapter || uploadingProgress) return;
                            setChapterImages([]);
                            setImagePreviews([]);
                            setEditPageGroups([]);
                          }}
                          disabled={uploadingChapter || !!uploadingProgress}
                          className={cn(
                            "px-3 py-1.5 border border-red-500/50 rounded-lg text-sm font-medium transition-colors",
                            (uploadingChapter || uploadingProgress)
                              ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                              : "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:border-red-500"
                          )}>
                          ลบทั้งหมด
                        </button>
                      )}
                    </div>

                    {/* Upload Area */}
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        (uploadingChapter || uploadingProgress)
                          ? "border-muted cursor-not-allowed opacity-50"
                          : "border-border cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5"
                      )}
                      onDragOver={(e) => {
                        if (uploadingChapter || uploadingProgress) return;
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        if (uploadingChapter || uploadingProgress) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const allowedExt = /\.(jpg|jpeg|png|webp)$/i;
                        const files = Array.from(e.dataTransfer.files).filter((file) =>
                          file.type.startsWith("image/") || allowedExt.test(file.name)
                        );
                        handleImageUpload(files);
                      }}
                      onClick={() => {
                        if (uploadingChapter || uploadingProgress) return;
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = "image/jpeg,image/jpg,image/png,image/webp";
                        input.onchange = (e) => {
                          const allowedExt = /\.(jpg|jpeg|png|webp)$/i;
                          const files = Array.from((e.target as HTMLInputElement).files || []).filter(
                            (file) => file.type.startsWith("image/") || allowedExt.test(file.name)
                          );
                          handleImageUpload(files);
                        };
                        input.click();
                      }}>
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {(uploadingChapter || uploadingProgress)
                          ? "กำลังอัปโหลด... กรุณารอสักครู่"
                          : "คลิกเพื่อเพิ่มรูปภาพ หรือลากไฟล์มาวางที่นี่"}
                      </p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4 space-y-4">
                        
                        <div className={cn(
                          "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2",
                          (uploadingChapter || uploadingProgress) && "pointer-events-none opacity-60"
                        )}>
                          {imagePreviews.map((preview, index) => {
                            const fileName = chapterImages[index]?.name || `image-${index + 1}`;
                            const truncatedFileName = truncateFileName(fileName, 12);
                            const isDragging = draggedIndex === index;
                            const isCurrentlyUploading = uploadingChapter && uploadingProgress && index === uploadingProgress.current;
                            const isUploaded = uploadedPages.has(index);
                            const isUploading = uploadingChapter || !!uploadingProgress;
                            const isEditMode = !!editingChapterId;
                            const group = editPageGroups[index];
                            const isSplitPair = isEditMode && group && group.length === 2;
                            const canDrag = !isUploading && !isEditMode;
                            
                            return (
                              <div
                                key={index}
                                draggable={canDrag}
                                onDragStart={() => canDrag && handleDragStart(index)}
                                onDragOver={(e) => canDrag && handleDragOver(e, index)}
                                onDrop={(e) => canDrag && handleDrop(e, index)}
                                className={cn(
                                  "relative group",
                                  isUploading || isEditMode ? "cursor-default" : "cursor-move",
                                  isDragging && "opacity-50 scale-95"
                                )}>
                                {/* Image container */}
                                <div className={cn(
                                  "w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted border transition-all relative",
                                  isDragging ? "border-orange-500 border-2" : "border-border",
                                  isUploaded && "ring-2 ring-green-500 border-green-500",
                                  isCurrentlyUploading && "ring-2 ring-orange-500"
                                )}>
                                  {isSplitPair ? (
                                    <>
                                      <img src={group[0]} alt={`Page ${index + 1} top`} className="absolute top-0 left-0 w-full h-1/2 object-cover object-top pointer-events-none" draggable={false} />
                                      <img src={group[1]} alt={`Page ${index + 1} bottom`} className="absolute bottom-0 left-0 w-full h-1/2 object-cover object-bottom pointer-events-none" draggable={false} />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 pointer-events-none">2 parts</div>
                                    </>
                                  ) : (
                                    <img
                                      src={preview}
                                      alt={`Page ${index + 1}`}
                                      className="w-full h-full object-contain pointer-events-none"
                                      draggable={false}
                                    />
                                  )}
                                  {/* กำลังอัพโหลดหน้านี้ */}
                                  {isCurrentlyUploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                    </div>
                                  )}
                                  {/* อัพโหลดสำเร็จ — ติ๊กถูกสีเขียว */}
                                  {isUploaded && !isCurrentlyUploading && (
                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                      <CheckCircle className="w-8 h-8 text-green-500 drop-shadow-lg" />
                                    </div>
                                  )}
                                </div>
                                {/* Page number badge - with hover theme */}
                                <div className={cn(
                                  "absolute top-1 left-1 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-colors pointer-events-none",
                                  isUploaded ? "bg-green-500/90" : "bg-orange-500/90 hover:bg-orange-500"
                                )}>
                                  {isUploaded ? "✓ " : ""}{index + 1}
                                </div>
                                {!isEditMode && (
                                  <div 
                                    className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
                                    title={fileName}>
                                    {truncatedFileName}
                                  </div>
                                )}
                                {!isUploading && !isEditMode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newImages = chapterImages.filter((_, i) => i !== index);
                                      const newPreviews = imagePreviews.filter((_, i) => i !== index);
                                      setChapterImages(newImages);
                                      setImagePreviews(newPreviews);
                                    }}
                                    className="absolute bottom-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Multi Chapter Upload Results */}
                  {multiChapterProgress && (
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-2 border-green-500/50 rounded-lg p-4 shadow-lg mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-muted-foreground">
                          ZIP นี้มี{" "}
                          <span className="font-semibold text-green-500">
                            {multiChapterProgress.total}
                          </span>{" "}
                          ตอน — ประมวลผลแล้ว{" "}
                          <span className="font-semibold text-green-500">
                            {multiChapterProgress.current}
                          </span>{" "}
                          /{" "}
                          <span className="font-semibold">
                            {multiChapterProgress.total}
                          </span>{" "}
                          ตอน
                        </p>
                      </div>
                      
                      {/* Chapter Results List - Horizontal Carousel */}
                      {multiChapterProgress.results.length > 0 && (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            {/* Previous Button */}
                            {multiChapterProgress.results.length > 2 && (
                              <button
                                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                                disabled={carouselIndex === 0}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors flex-shrink-0",
                                  carouselIndex === 0
                                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                                    : "hover:bg-muted text-foreground"
                                )}
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                            )}
                            
                            {/* Results Container */}
                            <div className="flex-1 overflow-hidden">
                              <div
                                className="flex gap-3 transition-transform duration-300 ease-in-out"
                                style={{
                                  transform: `translateX(-${carouselIndex * (100 / Math.min(2, multiChapterProgress.results.length))}%)`,
                                }}
                              >
                                {multiChapterProgress.results.map((result, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex-shrink-0 w-full sm:w-1/2 p-3 rounded-lg text-sm border",
                                      result.status === "success" && "bg-green-500/10 border-green-500/30",
                                      result.status === "skipped" && "bg-yellow-500/10 border-yellow-500/30",
                                      result.status === "error" && "bg-red-500/10 border-red-500/30",
                                      result.status === "processing" && "bg-orange-500/10 border-orange-500/30"
                                    )}
                                    style={{
                                      width: multiChapterProgress.results.length > 2 ? 'calc(50% - 0.375rem)' : '100%',
                                    }}
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                          {result.status === "success" && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                          )}
                                          {result.status === "skipped" && (
                                            <X className="w-4 h-4 text-yellow-500" />
                                          )}
                                          {result.status === "error" && (
                                            <X className="w-4 h-4 text-red-500" />
                                          )}
                                          {result.status === "processing" && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                          )}
                                          {result.status === "pending" && (
                                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30"></div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className={cn(
                                              "font-medium truncate",
                                              result.status === "success" && "text-green-500",
                                              result.status === "skipped" && "text-yellow-500",
                                              result.status === "error" && "text-red-500",
                                              result.status === "processing" && "text-orange-500",
                                              result.status === "pending" && "text-muted-foreground"
                                            )}
                                          >
                                            {result.title}
                                          </p>
                                          {result.message && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                              {result.message}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Per-chapter image upload progress */}
                                      {typeof result.totalPages === "number" &&
                                        result.totalPages > 0 && (
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                              <span>
                                                รูปภาพ:{" "}
                                                <span className="font-medium text-foreground">
                                                  {result.uploadedPages ?? 0}
                                                </span>{" "}
                                                /{" "}
                                                <span className="font-medium">
                                                  {result.totalPages}
                                                </span>
                                              </span>
                                              <span className="font-medium">
                                                {Math.round(
                                                  ((result.uploadedPages ?? 0) /
                                                    result.totalPages) *
                                                    100,
                                                )}
                                                %
                                              </span>
                                            </div>
                                            <div className="w-full bg-background/60 rounded-full h-2 overflow-hidden">
                                              <div
                                                className={cn(
                                                  "h-full rounded-full transition-all duration-300 ease-out",
                                                  result.status === "error"
                                                    ? "bg-red-500"
                                                    : result.status === "skipped"
                                                      ? "bg-yellow-500"
                                                      : "bg-gradient-to-r from-orange-400 via-orange-500 to-green-500",
                                                )}
                                                style={{
                                                  width: `${
                                                    ((result.uploadedPages ?? 0) /
                                                      result.totalPages) *
                                                    100
                                                  }%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Next Button */}
                            {multiChapterProgress.results.length > 2 && (
                              <button
                                onClick={() => setCarouselIndex(Math.min(
                                  Math.ceil(multiChapterProgress.results.length / 2) - 1,
                                  carouselIndex + 1
                                ))}
                                disabled={carouselIndex >= Math.ceil(multiChapterProgress.results.length / 2) - 1}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors flex-shrink-0",
                                  carouselIndex >= Math.ceil(multiChapterProgress.results.length / 2) - 1
                                    ? "opacity-50 cursor-not-allowed text-muted-foreground"
                                    : "hover:bg-muted text-foreground"
                                )}
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          
                          {/* Carousel Indicators */}
                          {multiChapterProgress.results.length > 2 && (
                            <div className="flex justify-center gap-1.5 mt-3">
                              {Array.from({ length: Math.ceil(multiChapterProgress.results.length / 2) }).map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCarouselIndex(index)}
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    carouselIndex === index
                                      ? "bg-orange-500 w-6"
                                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi Chapter Upload Instructions */}
                  <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      อัพโหลดไฟล์ ZIP ที่มีโครงสร้างดังนี้:
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-orange-500 mb-2">Single Chapter:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>1.jpg</li>
                          <li>2.jpg</li>
                        </ul>
                        <p className="text-xs text-orange-500 mt-2">
                          โปรดตั้งชื่อไฟล์ตามชื่อตอน เช่น ตอนที่ 23.zip
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-orange-500 mb-2">Multi Chapter:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                          <li>ตอนที่ 1
                            <ul className="ml-4 mt-1 space-y-1 list-disc">
                              <li>1.jpg</li>
                              <li>2.jpg</li>
                            </ul>
                          </li>
                          <li>ตอนที่ 2
                            <ul className="ml-4 mt-1 space-y-1 list-disc">
                              <li>1.jpg</li>
                              <li>2.jpg</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <p className="text-xs text-orange-500 mt-3">
                        รองรับไฟล์ขนาดสูงสุด: 100MB
                      </p>
                    </div>
                  </div>

                  {/* ZIP File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      เลือกไฟล์ ZIP
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (100MB)
                            if (file.size > 100 * 1024 * 1024) {
                              toast.error("ขนาดไฟล์ต้องไม่เกิน 100MB");
                              return;
                            }
                            // Validate file type
                            if (!file.name.endsWith(".zip")) {
                              toast.error("กรุณาอัปโหลดไฟล์ ZIP เท่านั้น");
                              return;
                            }
                            setZipFile(file);
                            setZipFileName(file.name);
                          }
                        }}
                        className="hidden"
                        id="zip-file-input"
                      />
                      <label
                        htmlFor="zip-file-input"
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-2.5 border border-border rounded-lg transition-colors cursor-pointer",
                          zipFile
                            ? "bg-muted/50 border-orange-500/50"
                            : "bg-background hover:bg-muted/30"
                        )}>
                        <span className="text-sm text-foreground">
                          {zipFileName || "Choose File"}
                        </span>
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      </label>
                    </div>
                    {zipFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ไฟล์: {zipFileName} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-4">
              {chapterType === "multi" && (multiChapterProgress || multiUploadProcessing) ? (
                // โหมดอัปโหลดหลายตอน: กำลังทำงานหรือเสร็จแล้ว
                <button
                  onClick={() => {
                    if (multiUploadProcessing) return; // ยังอัพโหลดอยู่ ห้ามกด
                    setShowAddChapterModal(false);
                    setEditingChapterId(null);
                    setImagePreviews([]);
                    setChapterImages([]);
                    setZipFile(null);
                    setZipFileName("");
                    setUploadingProgress(null);
                    setUploadedPages(new Set());
                    setMultiChapterProgress(null);
                    setMultiUploadProcessing(false);
                    setMultiUploadStep(0);
                    setCarouselIndex(0);
                    setChapterType("single");
                    setChapterFormData({
                      title: "",
                      number: 1,
                      price: 0,
                      status: "published",
                      scheduleEnabled: false,
                      scheduledAt: "",
                    });
                    setPriceInputValue("0");
                    setIsPaidMode(false);
                  }}
                  disabled={multiUploadProcessing || uploadingChapter}
                  className={cn(
                    "px-6 py-2.5 rounded-lg transition-colors",
                    multiUploadProcessing || uploadingChapter
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  )}
                >
                  {multiUploadProcessing || uploadingChapter ? "กำลังอัพโหลด..." : "เสร็จสิ้น"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (uploadingChapter || uploadingProgress) return;
                      setShowAddChapterModal(false);
                      setEditingChapterId(null);
                      setImagePreviews([]);
                      setChapterImages([]);
                      setZipFile(null);
                      setZipFileName("");
                      setUploadingProgress(null);
                      setUploadedPages(new Set());
                      setMultiChapterProgress(null);
                      setMultiUploadProcessing(false);
                      setMultiUploadStep(0);
                      setCarouselIndex(0);
                      setChapterFormData({
                        title: "",
                        number: 1,
                        price: 0,
                        status: "published",
                        scheduleEnabled: false,
                        scheduledAt: "",
                      });
                      setPriceInputValue("0");
                      setIsPaidMode(false);
                      setCarouselIndex(0);
                      setChapterFormData({
                        title: "",
                        number: 1,
                        price: 0,
                        status: "published",
                        scheduleEnabled: false,
                        scheduledAt: "",
                      });
                      setPriceInputValue("0");
                      setIsPaidMode(false);
                    }}
                    disabled={uploadingChapter || !!uploadingProgress}
                    className={cn(
                      "px-6 py-2.5 border border-red-500/50 rounded-lg transition-colors",
                      uploadingChapter || uploadingProgress
                        ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:border-red-500"
                    )}>
                    ยกเลิก
                  </button>
                  <button
                    onClick={
                      editingChapterId
                        ? handleUpdateChapter
                        : chapterType === "single"
                          ? handleCreateChapter
                          : handleUploadMultiChapters
                    }
                    disabled={
                      uploadingChapter ||
                      isScheduledInPast ||
                      (editingChapterId
                        ? imagePreviews.length === 0
                        : chapterType === "single"
                          ? chapterImages.length === 0
                          : !zipFile)
                    }
                    className={cn(
                      "px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      isScheduledInPast
                        ? "bg-red-500/20 text-red-500 border border-red-500/30"
                        : "bg-orange-500 text-white hover:bg-orange-600",
                    )}>
                    {uploadingChapter
                      ? editingChapterId
                        ? "กำลังอัปเดต..."
                        : chapterType === "single"
                          ? "กำลังสร้างตอน..."
                          : "กำลังอัปโหลดหลายตอน..."
                      : isScheduledInPast
                        ? "ไม่สามารถบันทึกได้ — เวลาเผยแพร่ไม่ถูกต้อง"
                        : editingChapterId
                          ? "อัปเดตตอน"
                          : chapterType === "single"
                            ? "สร้างตอน"
                            : "อัปโหลดหลายตอน"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}