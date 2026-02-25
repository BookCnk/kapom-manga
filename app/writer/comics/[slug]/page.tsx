"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  FileText,
  BarChart3,
  List,
  Trash2,
  FileStack,
  Edit,
  Download,
  ExternalLink,
  Pencil,
  TrendingUp,
  Coins,
  Settings,
  Search,
  Menu,
} from "lucide-react";
import dynamic from "next/dynamic";
import { MangaStatus, Visibility } from "@/lib/types/client-enums";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AuthGuard from "@/components/writer/AuthGuard";
import { checkInappropriateContent } from "@/lib/utils/content-filter";
import { useAuth } from "@/contexts/AuthContext";
import * as nsfwjs from "nsfwjs";

// Helper function for Buddhist Era
const getCurrentYearBE = () => new Date().getFullYear() + 543;

// Dynamically import recharts to avoid SSR issues
const MonthlySalesChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const {
        BarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
      } = mod;
      return ({ data }: { data: Array<{ day: number; sales: number }> }) => {
        const CustomTooltip = ({ active, payload, label }: any) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground mb-1">
                  วันที่ {label}
                </p>
                <p className="text-sm text-muted-foreground">
                  ยอดขาย:{" "}
                  <span className="font-semibold text-orange-500">
                    {payload[0].value.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ReadCoin
                  </span>
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
              style={{ pointerEvents: "none" }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `วันที่ ${value}`}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "ยอดขาย (ReadCoin)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "hsl(var(--foreground))" },
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
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
  { ssr: false },
);

const YearlySalesChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const {
        BarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
      } = mod;
      return ({ data }: { data: Array<{ month: string; sales: number }> }) => {
        const CustomTooltip = ({ active, payload, label }: any) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg p-3 z-50 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground mb-1">
                  {label}
                </p>
                <p className="text-sm text-muted-foreground">
                  ยอดขาย:{" "}
                  <span className="font-semibold text-orange-500">
                    {payload[0].value.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ReadCoin
                  </span>
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
              style={{ pointerEvents: "none" }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "ยอดขาย (ReadCoin)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "hsl(var(--foreground))" },
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
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
  { ssr: false },
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
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
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
  views: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  genres: Array<{
    genre: Genre;
  }>;
  tags: Array<{
    tag: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
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
  const [topChapters, setTopChapters] = useState<
    Array<{
      rank: number;
      chapterNumber: number;
      title: string;
      sales: number;
    }>
  >([]);
  const [recentPurchases, setRecentPurchases] = useState<
    Array<{
      purchaseDate: string;
      chapterNumber: number;
      title: string;
      price: number;
    }>
  >([]);
  const [loadingTopChapters, setLoadingTopChapters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear() + 543,
  ); // Buddhist Era
  const [formData, setFormData] = useState<{
    title: string;
    originalTitle: string;
    description: string;
    coverUrl: string;
    status: MangaStatus;
    visibility: Visibility;
    isMature: boolean;
    mainGenreSlug: string;
    subGenreSlug: string;
  }>({
    title: "",
    originalTitle: "",
    description: "",
    coverUrl: "",
    status: MangaStatus.ONGOING,
    visibility: Visibility.PUBLIC,
    isMature: false,
    mainGenreSlug: "",
    subGenreSlug: "",
  });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [originalTitleError, setOriginalTitleError] = useState<string | null>(
    null,
  );
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
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
  });
  const [chapterImages, setChapterImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingChapter, setUploadingChapter] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [nsfwModel, setNsfwModel] = useState<any>(null);
  const [checkingNsfw, setCheckingNsfw] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const previousCoverRef = useRef<string | null>(null);

  // Generate random slug for chapter
  const generateRandomSlug = (): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
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

  // Handle cover image change (edit mode) with NSFW check
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // เก็บรูปก่อนหน้าไว้เพื่อย้อนกลับได้ถ้าตรวจพบ 18+
    previousCoverRef.current = formData.coverUrl || null;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("กรุณาอัพโหลดไฟล์ .jpg, .jpeg, .png หรือ .webp เท่านั้น");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;

      // เช็คขนาดรูปก่อน (ต้องไม่เกิน 500x700 px)
      const dimOk = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          if (width > 500 || height > 700) {
            toast.error("ขนาดรูปต้องไม่เกิน 500x700 พิกเซล");
            // ย้อนกลับไปใช้ภาพก่อนหน้า และโชว์ขอบแดงชั่วคราว
            setFormData((prev) => ({
              ...prev,
              coverUrl: previousCoverRef.current || "",
            }));
            setCoverError("size");
            setTimeout(() => setCoverError(null), 1000);
            if (coverInputRef.current) coverInputRef.current.value = "";
            resolve(false);
          } else {
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
        img.src = dataUrl;
      });

      if (!dimOk) {
        return;
      }

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
          const pornScore =
            predictions.find((p: any) => p.className === "Porn")?.probability ||
            0;
          const hentaiScore =
            predictions.find((p: any) => p.className === "Hentai")
              ?.probability || 0;
          const sexyScore =
            predictions.find((p: any) => p.className === "Sexy")?.probability ||
            0;
          const nsfwScore = Math.max(pornScore, hentaiScore);

          console.log("NSFW Detection (edit page):", {
            porn: pornScore,
            hentai: hentaiScore,
            sexy: sexyScore,
            nsfwScore,
            isMature: formData.isMature,
          });

          // ถ้าเป็นภาพ 18+ ชัดเจน และเรื่องไม่ได้ตั้งเป็น 18+ → บล็อก
          if (nsfwScore > 0.5 && !formData.isMature) {
            toast.error("ตรวจพบเนื้อหา 18+ ในภาพ กรุณาเปลี่ยนภาพหน้าปก");
            // ย้อนกลับไปใช้ภาพก่อนหน้า และโชว์ขอบแดงชั่วคราว 1 วินาที
            setFormData((prev) => ({
              ...prev,
              coverUrl: previousCoverRef.current || "",
            }));
            setCoverError("18+");
            setTimeout(() => setCoverError(null), 1000);
            setCheckingNsfw(false);
            return;
          }

          // ถ้าเป็น 18+ แต่เรื่องตั้งเป็น 18+ อยู่แล้ว → อนุญาตแต่เตือน
          if (nsfwScore > 0.5 && formData.isMature) {
            toast.warning(
              "ตรวจพบเนื้อหา 18+ ในภาพ เนื่องจากตั้งค่าระดับเนื้อหาเป็น 18+ แล้ว จึงอนุญาตให้ใช้ได้",
            );
          }

          // ถ้า sexy สูงแต่ไม่ถึง porn/hentai → เตือนเบาๆ
          if (sexyScore > 0.7 && nsfwScore <= 0.5 && !formData.isMature) {
            toast.warning(
              "ภาพนี้อาจมีเนื้อหาที่ไม่เหมาะสม กรุณาตรวจสอบอีกครั้ง",
            );
          }

          setFormData((prev) => ({ ...prev, coverUrl: dataUrl }));
          setCoverError(null);
        } catch (error) {
          console.error("Error checking NSFW content on edit page:", error);
          setFormData((prev) => ({ ...prev, coverUrl: dataUrl }));
          toast.warning(
            "ไม่สามารถตรวจสอบเนื้อหาภาพได้ กรุณาตรวจสอบภาพด้วยตนเอง",
          );
        } finally {
          setCheckingNsfw(false);
        }
      } else {
        // ถ้าโมเดลยังไม่โหลด อนุญาตให้เปลี่ยนแต่เตือนว่าไม่ตรวจ
        setFormData((prev) => ({ ...prev, coverUrl: dataUrl }));
        toast.warning("กำลังโหลดระบบตรวจสอบภาพ 18+ กรุณารอสักครู่");
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function to truncate filename intelligently
  const truncateFileName = (
    fileName: string,
    maxLength: number = 15,
  ): string => {
    if (fileName.length <= maxLength) return fileName;

    // Try to keep extension visible
    const lastDot = fileName.lastIndexOf(".");
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
    if (
      manga &&
      activeTab === "stats" &&
      activeStatsTab === "sales" &&
      !authLoading
    ) {
      fetchSalesData();
      fetchTopChapters();
      fetchRecentPurchases();
    }
  }, [
    manga,
    activeTab,
    activeStatsTab,
    selectedMonth,
    selectedYear,
    authLoading,
  ]);

  useEffect(() => {
    if (manga && genres.length > 0) {
      const mainGenresConfig = genres.filter((g) => !g.slug.startsWith("sub-"));
      const subGenresConfig = genres.filter((g) => g.slug.startsWith("sub-"));

      // manga.genres ถูก map จาก API ให้เป็น [{ slug, name, ... }]
      const genreSlugs: string[] =
        (manga.genres as any[])?.map((g) => g.slug || g.id) || [];

      const currentMainGenre = genreSlugs.find((slug) =>
        mainGenresConfig.some((g) => g.slug === slug),
      );
      const currentSubGenre = genreSlugs.find((slug) =>
        subGenresConfig.some((g) => g.slug === slug),
      );

      setFormData({
        title: manga.title,
        originalTitle: manga.originalTitle || "",
        description: manga.description || "",
        coverUrl: manga.coverUrl || "",
        status: manga.status,
        visibility: manga.visibility,
        isMature: manga.isMature,
        mainGenreSlug: currentMainGenre || "",
        subGenreSlug: currentSubGenre || "",
      });
      setSelectedGenres(genreSlugs);
      // Set tags from manga
      if (manga.tags) {
        setTags((manga.tags as any[]).map((t) => t.tag.name));
      }
      setCoverError(null);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
        },
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
        },
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
        },
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

    try {
      // รีเซ็ต error เดิม
      setTitleError(null);
      setOriginalTitleError(null);
      setDescriptionError(null);

      // ตรวจคำต้องห้ามในชื่อเรื่อง
      const titleCheck = checkInappropriateContent(formData.title);
      if (titleCheck.isInappropriate) {
        setTitleError("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        toast.error("ไม่สามารถใช้ได้เนื่องจากคำ 18+");
        return;
      }

      // ตรวจคำต้องห้ามในชื่อเรื่องต้นฉบับ
      const originalTitleCheck = checkInappropriateContent(
        formData.originalTitle,
      );
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

      setLoading(true);
      const sessionToken = localStorage.getItem("session_token") || "";

      // Build genreSlugs array from selected genres
      const genreSlugs: string[] = [];
      if (formData.mainGenreSlug) {
        genreSlugs.push(formData.mainGenreSlug);
      }
      if (formData.subGenreSlug) {
        genreSlugs.push(formData.subGenreSlug);
      }

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
          coverUrl: formData.coverUrl || null,
          status: formData.status,
          visibility: formData.visibility,
          isMature: formData.isMature,
          genreSlugs: genreSlugs,
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

  const mainGenres = genres.filter((g) => !g.slug.startsWith("sub-"));
  const subGenres = genres.filter((g) => g.slug.startsWith("sub-"));

  // Tag handlers
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && !tags.includes(value) && tags.length < 10) {
        setTags([...tags, value]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
      const allPreviews = sortedAllFiles
        .map((file, index) => {
          // Find if this file is in the new files
          const newFileIndex = sortedNewFiles.findIndex((f) => f === file);
          if (newFileIndex !== -1) {
            // It's a new file, use the new preview
            return newPreviews[newFileIndex];
          }
          // It's an existing file, find its preview
          const existingIndex = chapterImages.findIndex((f) => f === file);
          return existingIndex !== -1 ? imagePreviews[existingIndex] : "";
        })
        .filter((p) => p !== "");

      setImagePreviews(allPreviews);
    });
  };

  const handleCreateChapter = async () => {
    if (!manga) {
      toast.error("ไม่พบมังงะ");
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
          isLocked: chapterFormData.price > 0,
          priceCoins: chapterFormData.price,
          publishedAt:
            chapterFormData.status === "published"
              ? new Date().toISOString()
              : undefined,
        }),
      });

      const chapterData = await chapterResponse.json();

      if (!chapterResponse.ok) {
        if (chapterResponse.status === 401) {
          // Wait a bit before showing error in case auth is still loading
          await new Promise((resolve) => setTimeout(resolve, 500));
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

      // Upload images and create pages
      // Convert all images to base64 first
      setUploadingProgress({ current: 0, total: chapterImages.length });

      const pagePromises = chapterImages.map(async (file, index) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Update progress
        setUploadingProgress({
          current: index + 1,
          total: chapterImages.length,
        });

        // Create page
        const pageResponse = await fetch(`/api/chapters/${chapterId}/pages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            pageNo: index + 1,
            imageUrl: base64, // In production, upload to storage service and use the URL
          }),
        });

        if (!pageResponse.ok) {
          const errorData = await pageResponse.json();
          throw new Error(errorData.error || "Failed to create page");
        }

        return pageResponse.json();
      });

      // Wait for all pages to be created
      await Promise.all(pagePromises);
      setUploadingProgress(null);

      toast.success("สร้างตอนสำเร็จ 👌");
      setShowAddChapterModal(false);
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
      // Wait a bit for modal to close
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      setLoadingChapterData(true);
      const response = await fetch(`/api/chapters/${chapterId}`);
      const data = await response.json();

      if (data.success && data.data?.chapter) {
        const chapter = data.data.chapter;

        // Set form data
        setChapterFormData({
          title: chapter.title,
          number: chapter.number,
          price: chapter.priceCoins,
          status: chapter.publishedAt ? "published" : "draft",
        });

        // Load existing pages as previews
        const previews = chapter.pages
          .sort((a: any, b: any) => a.pageNo - b.pageNo)
          .map((page: any) => page.imageUrl);

        setImagePreviews(previews);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
          isLocked: chapterFormData.price > 0,
          priceCoins: chapterFormData.price,
          publishedAt:
            chapterFormData.status === "published"
              ? new Date().toISOString()
              : undefined,
        }),
      });

      const chapterData = await chapterResponse.json();
      if (!chapterData.success || !chapterData.data?.chapter) {
        throw new Error(chapterData.error || "Failed to update chapter");
      }

      // Delete all existing pages
      const existingPagesResponse = await fetch(
        `/api/chapters/${editingChapterId}/pages`,
      );
      const existingPagesData = await existingPagesResponse.json();

      if (existingPagesData.success && existingPagesData.data?.pages) {
        for (const page of existingPagesData.data.pages) {
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

      // Create new pages from previews (existing images or new uploads)
      setUploadingProgress({ current: 0, total: imagePreviews.length });

      const pagePromises = imagePreviews.map(async (preview, index) => {
        // If it's a data URL (new upload), use it directly
        // If it's an existing image URL, fetch and convert to base64
        let base64 = preview;

        if (!preview.startsWith("data:")) {
          // It's an existing image URL, fetch it
          try {
            const imageResponse = await fetch(preview);
            const blob = await imageResponse.blob();
            base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error("Failed to fetch existing image:", error);
            // Use original URL as fallback
            base64 = preview;
          }
        }

        // Update progress
        setUploadingProgress({
          current: index + 1,
          total: imagePreviews.length,
        });

        // Create page
        const pageResponse = await fetch(
          `/api/chapters/${editingChapterId}/pages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              pageNo: index + 1,
              imageUrl: base64,
            }),
          },
        );

        if (!pageResponse.ok) {
          const errorData = await pageResponse.json();
          throw new Error(errorData.error || "Failed to create page");
        }

        return pageResponse.json();
      });

      await Promise.all(pagePromises);
      setUploadingProgress(null);

      toast.success("แก้ไขข้อมูลตอนแล้ว 👌");
      setShowAddChapterModal(false);
      setEditingChapterId(null);
      setImagePreviews([]);
      setChapterImages([]);
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

    try {
      setUploadingChapter(true);
      const sessionToken = localStorage.getItem("session_token") || "";

      // Convert ZIP to base64
      const zipBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(zipFile);
      });

      // Upload ZIP to API
      const response = await fetch(
        `/api/manga/${manga.id}/chapters/upload-zip`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            zipFile: zipBase64,
            zipFileName: zipFileName,
            defaultPrice: chapterFormData.price,
            defaultStatus: chapterFormData.status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Wait a bit before showing error in case auth is still loading
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (authLoading) {
            return; // Still loading, don't show error
          }
          toast.error("กรุณาเข้าสู่ระบบใหม่");
          router.push("/login");
          return;
        }
        throw new Error(data.error || "Failed to upload chapters");
      }

      if (data.success) {
        toast.success(
          `สร้างตอนสำเร็จ ${data.data?.chaptersCreated || 0} ตอน 👌`,
        );
        setShowAddChapterModal(false);
        setZipFile(null);
        setZipFileName("");
        await fetchManga(); // Refresh manga data
      } else {
        throw new Error(data.error || "Failed to upload chapters");
      }
    } catch (error) {
      console.error("Failed to upload chapters:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดตอน");
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
              <h1 className="text-xl font-semibold text-foreground">
                แก้ไขการ์ตูน
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {manga.title}
              </p>
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
                  : "text-muted-foreground hover:text-foreground",
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
                  : "text-muted-foreground hover:text-foreground",
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
                  : "text-muted-foreground hover:text-foreground",
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
              href={`/manga/${manga.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-[11px] font-medium transition-colors">
              ไปยังหน้ามังงะ
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {/* Cover Preview + Upload */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground">
                      ภาพหน้าปก
                    </h3>
                  </div>
                  <div
                    className={cn(
                      "aspect-[5/7] bg-muted rounded-lg overflow-hidden mb-3 relative group cursor-pointer border transition-colors",
                      coverError && "border-red-500",
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
                    ) : formData.coverUrl ? (
                      <>
                        <img
                          src={formData.coverUrl}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                          onClick={() => coverInputRef.current?.click()}
                        />
                        {/* Camera overlay */}
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="flex flex-col items-center gap-2 text-white">
                            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">
                              เปลี่ยนภาพหน้าปก
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        onClick={() => coverInputRef.current?.click()}>
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
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
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    ข้อมูลพื้นฐาน
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ชื่อเรื่อง <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => {
                          setTitleError(null);
                          setFormData({ ...formData, title: e.target.value });
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                          titleError ? "border-red-500" : "border-border",
                        )}
                        placeholder="ชื่อเรื่อง"
                      />
                      {titleError && (
                        <p className="mt-1 text-xs text-red-500">
                          {titleError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ชื่อเรื่องต้นฉบับ{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.originalTitle}
                        onChange={(e) => {
                          setOriginalTitleError(null);
                          setFormData({
                            ...formData,
                            originalTitle: e.target.value,
                          });
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                          originalTitleError
                            ? "border-red-500"
                            : "border-border",
                        )}
                        placeholder="ชื่อเรื่องต้นฉบับ"
                      />
                      {originalTitleError && (
                        <p className="mt-1 text-xs text-red-500">
                          {originalTitleError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        หมวดหมู่หลัก <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.mainGenreSlug}
                        onChange={(e) => {
                          const newMainGenreSlug = e.target.value;
                          setFormData({
                            ...formData,
                            mainGenreSlug: newMainGenreSlug,
                          });
                          // Update selectedGenres
                          const newSelectedGenres = selectedGenres.filter(
                            (slug) => !mainGenres.some((g) => g.slug === slug),
                          );
                          if (newMainGenreSlug) {
                            newSelectedGenres.push(newMainGenreSlug);
                          }
                          setSelectedGenres(newSelectedGenres);
                        }}
                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                        <option value="">เลือกหมวดหมู่หลัก</option>
                        {mainGenres.map((genre) => (
                          <option key={genre.slug} value={genre.slug}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        หมวดหมู่รอง
                      </label>
                      <select
                        value={formData.subGenreSlug}
                        onChange={(e) => {
                          const newSubGenreSlug = e.target.value;
                          setFormData({
                            ...formData,
                            subGenreSlug: newSubGenreSlug,
                          });
                          // Update selectedGenres
                          const newSelectedGenres = selectedGenres.filter(
                            (slug) => !subGenres.some((g) => g.slug === slug),
                          );
                          if (newSubGenreSlug) {
                            newSelectedGenres.push(newSubGenreSlug);
                          }
                          setSelectedGenres(newSelectedGenres);
                        }}
                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                        <option value="">เลือกหมวดหมู่รอง</option>
                        {subGenres.map((genre) => (
                          <option key={genre.slug} value={genre.slug}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ระดับของเนื้อหา <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.isMature ? "mature" : "general"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isMature: e.target.value === "mature",
                          })
                        }
                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                        <option value="general">ทั่วไป (PG)</option>
                        <option value="mature">18+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ประเภทเนื้อหา <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                        <option value="translated">การ์ตูนแปล</option>
                        <option value="original">การ์ตูนต้นฉบับ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    ข้อมูลเบื้องต้น/แนะนำเรื่อง/เรื่องย่อ
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    จำกัดไม่เกิน 2000 ตัวอักษร ({formData.description.length}
                    /2000)
                  </p>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setDescriptionError(null);
                      setFormData({ ...formData, description: e.target.value });
                    }}
                    maxLength={2000}
                    rows={8}
                    placeholder="พิมพ์เนื้อหาตรงนี้"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none",
                      descriptionError ? "border-red-500" : "border-border",
                    )}
                  />
                  {descriptionError && (
                    <p className="mt-1 text-xs text-red-500">
                      {descriptionError}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    แท็ก
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      maxLength={20}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      placeholder="พิมพ์แท็กของคุณตรงนี้ และกด Enter หรือ , เพื่อเพิ่มแท็ก"
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-orange-700">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-base font-semibold text-foreground mb-3">
                    ตั้งค่าเรื่อง
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          สถานะเรื่อง
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.visibility === Visibility.PUBLIC
                            ? "เผยแพร่"
                            : "ไม่เผยแพร่"}
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
                        <p className="font-medium text-foreground text-sm">
                          สถานะจบ
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.status === MangaStatus.COMPLETED
                            ? "จบแล้ว"
                            : "ยังไม่จบ"}
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
              <h2 className="text-xl font-semibold text-foreground">
                รายชื่อตอน
              </h2>
              <button
                onClick={() => {
                  if (!manga) {
                    toast.error("ไม่พบมังงะ");
                    return;
                  }
                  // Set default chapter number to next available
                  const nextNumber = manga?.chapters.length
                    ? Math.max(...manga.chapters.map((c) => c.number)) + 1
                    : 1;
                  setChapterFormData({
                    title: "",
                    number: nextNumber,
                    price: 0,
                    status: "published",
                  });
                  setChapterImages([]);
                  setImagePreviews([]);
                  setShowAddChapterModal(true);
                }}
                disabled={!manga}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  manga
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}>
                <Plus className="w-4 h-4" />
                เพิ่มตอนการ์ตูนใหม่
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    <option value="50">แสดง 50 รายการ</option>
                    <option value="20">แสดง 20 รายการ</option>
                    <option value="10">แสดง 10 รายการ</option>
                  </select>
                  <select className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
                    <option value="asc">เรียงลำดับตอนจากน้อยไปมาก</option>
                    <option value="desc">เรียงลำดับตอนจากมากไปน้อย</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        ลำดับตอน
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        ชื่อตอน
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        ยอดวิว
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        ยอดคอมเมนต์
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        ยอดขายรวม
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        การเผยแพร่
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        อัปเดตล่าสุด
                      </th>
                      <th className="text-left p-4 font-medium text-sm">
                        กำหนดราคาตอน
                      </th>
                      <th className="text-right p-4 font-medium text-sm">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {manga.chapters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-muted-foreground">
                          ยังไม่มีตอน
                        </td>
                      </tr>
                    ) : (
                      manga.chapters.map((chapter) => (
                        <tr
                          key={chapter.id}
                          className="border-b border-border hover:bg-muted/20">
                          <td className="p-4">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="p-4 text-sm">{chapter.number}</td>
                          <td className="p-4 text-sm font-medium">
                            {chapter.title}
                          </td>
                          <td className="p-4 text-sm">
                            {chapter.views.toLocaleString()}
                          </td>
                          <td className="p-4 text-sm">0</td>
                          <td className="p-4 text-sm text-orange-500 font-medium">
                            0
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-green-500 text-white text-xs rounded-full">
                              เผยแพร่
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatThaiDate(chapter.updatedAt)}
                          </td>
                          <td className="p-4 text-sm">
                            {chapter.isLocked
                              ? `${chapter.priceCoins} เหรียญ`
                              : "อ่านฟรี"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  if (!loadingChapterData) {
                                    fetchChapterForEdit(chapter.id);
                                  }
                                }}
                                disabled={loadingChapterData}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 border border-purple-500/30 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors text-sm",
                                  loadingChapterData &&
                                    "opacity-50 cursor-not-allowed",
                                )}>
                                {loadingChapterData ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-purple-600"></div>
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

                              {/* Download ZIP Button */}
                              <button
                                onClick={async () => {
                                  try {
                                    const sessionToken =
                                      localStorage.getItem("session_token") ||
                                      "";
                                    const response = await fetch(
                                      `/api/chapters/${chapter.id}/download-zip`,
                                      {
                                        method: "GET",
                                        headers: {
                                          "x-session-token": sessionToken,
                                        },
                                      },
                                    );

                                    if (response.ok) {
                                      const blob = await response.blob();
                                      const url =
                                        window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `${manga.title}-ตอนที่-${chapter.number}.zip`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                      toast.success("ดาวน์โหลดสำเร็จ 👌");
                                    } else {
                                      toast.error(
                                        "เกิดข้อผิดพลาดในการดาวน์โหลด",
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Failed to download chapter:",
                                      error,
                                    );
                                    toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
                                  }
                                }}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
                                <Download className="w-4 h-4" />
                              </button>

                              {/* External Link Button */}
                              <button
                                onClick={() => {
                                  window.open(
                                    `/comic/chapter/${chapter.slug}`,
                                    "_blank",
                                  );
                                }}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
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

              {manga.chapters.length > 0 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    จำนวนตอนทั้งหมด {manga.chapters.length} ตอน
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-sm">
                      ก่อนหน้า
                    </button>
                    <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm">
                      1
                    </button>
                    <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-sm">
                      ต่อไป
                    </button>
                  </div>
                </div>
              )}
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
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                <BarChart3 className="w-4 h-4" />
                รายงานยอดขาย
              </button>
              <button
                onClick={() => setActiveStatsTab("analytics")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  activeStatsTab === "analytics"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground",
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
                      {salesData?.totalSales.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </span>
                  </div>
                </div>

                {/* Monthly and Yearly Sales Reports - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Sales Report */}
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        รายงานการขายรายเดือน
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ข้อมูลประจำเดือน :
                          </span>
                          <select
                            value={selectedMonth}
                            onChange={(e) =>
                              setSelectedMonth(Number(e.target.value))
                            }
                            className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                            {[
                              "มกราคม",
                              "กุมภาพันธ์",
                              "มีนาคม",
                              "เมษายน",
                              "พฤษภาคม",
                              "มิถุนายน",
                              "กรกฎาคม",
                              "สิงหาคม",
                              "กันยายน",
                              "ตุลาคม",
                              "พฤศจิกายน",
                              "ธันวาคม",
                            ].map((month, index) => (
                              <option key={index} value={index + 1}>
                                {month}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ปี:
                          </span>
                          <select
                            value={selectedYear}
                            onChange={(e) =>
                              setSelectedYear(Number(e.target.value))
                            }
                            className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                            {Array.from(
                              { length: getCurrentYearBE() - 2566 + 1 },
                              (_, i) => 2566 + i,
                            ).map((year) => (
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
                            data={
                              salesData?.monthlySales
                                ? Object.entries(salesData.monthlySales).map(
                                    ([day, sales]) => ({
                                      day: Number(day),
                                      sales,
                                    }),
                                  )
                                : []
                            }
                          />
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            ยอดขายรวมรายเดือน :
                          </span>
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="font-semibold text-foreground">
                            {salesData?.totalSalesThisMonth.toLocaleString(
                              "th-TH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || "0.00"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Annual Sales Report */}
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        รายงานการขายรายปี
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          ข้อมูลประจำปี :
                        </span>
                        <select
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm">
                          {Array.from(
                            { length: getCurrentYearBE() - 2566 + 1 },
                            (_, i) => 2566 + i,
                          ).map((year) => (
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
                            data={
                              salesData?.yearlySales
                                ? [
                                    {
                                      month: "มกราคม",
                                      sales: salesData.yearlySales[1] || 0,
                                    },
                                    {
                                      month: "กุมภาพันธ์",
                                      sales: salesData.yearlySales[2] || 0,
                                    },
                                    {
                                      month: "มีนาคม",
                                      sales: salesData.yearlySales[3] || 0,
                                    },
                                    {
                                      month: "เมษายน",
                                      sales: salesData.yearlySales[4] || 0,
                                    },
                                    {
                                      month: "พฤษภาคม",
                                      sales: salesData.yearlySales[5] || 0,
                                    },
                                    {
                                      month: "มิถุนายน",
                                      sales: salesData.yearlySales[6] || 0,
                                    },
                                    {
                                      month: "กรกฎาคม",
                                      sales: salesData.yearlySales[7] || 0,
                                    },
                                    {
                                      month: "สิงหาคม",
                                      sales: salesData.yearlySales[8] || 0,
                                    },
                                    {
                                      month: "กันยายน",
                                      sales: salesData.yearlySales[9] || 0,
                                    },
                                    {
                                      month: "ตุลาคม",
                                      sales: salesData.yearlySales[10] || 0,
                                    },
                                    {
                                      month: "พฤศจิกายน",
                                      sales: salesData.yearlySales[11] || 0,
                                    },
                                    {
                                      month: "ธันวาคม",
                                      sales: salesData.yearlySales[12] || 0,
                                    },
                                  ]
                                : []
                            }
                          />
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            ยอดขายรวมรายปี :
                          </span>
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="font-semibold text-foreground">
                            {salesData?.totalSalesThisYear.toLocaleString(
                              "th-TH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || "0.00"}
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
                      <h3 className="text-lg font-semibold text-foreground">
                        10 อันดับตอนที่มียอดขายสูงสุด
                      </h3>
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
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                อันดับที่
                              </th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                ชื่อตอน
                              </th>
                              <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                                ยอดขาย
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {topChapters.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="p-8 text-center text-muted-foreground">
                                  ไม่มีข้อมูล
                                </td>
                              </tr>
                            ) : (
                              topChapters.map((chapter) => (
                                <tr
                                  key={chapter.rank}
                                  className="border-b border-border hover:bg-muted/30 transition-colors">
                                  <td className="p-3 text-sm text-foreground">
                                    {chapter.rank}
                                  </td>
                                  <td className="p-3 text-sm text-foreground">
                                    {chapter.title}
                                  </td>
                                  <td className="p-3 text-sm text-foreground text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Coins className="w-4 h-4 text-orange-500" />
                                      <span className="font-medium">
                                        {chapter.sales.toLocaleString("th-TH", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
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
                      <h3 className="text-lg font-semibold text-foreground">
                        10 รายการตอนที่ผู้อ่านซื้อล่าสุด
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                              วันที่ซื้อ
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                              ชื่อตอน
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                              ราคา
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPurchases.length === 0 ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="p-8 text-center text-muted-foreground">
                                ไม่มีข้อมูล
                              </td>
                            </tr>
                          ) : (
                            recentPurchases.map((purchase, index) => (
                              <tr
                                key={index}
                                className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-3 text-sm text-foreground">
                                  {formatThaiDate(purchase.purchaseDate)}
                                </td>
                                <td className="p-3 text-sm text-foreground">
                                  {purchase.title}
                                </td>
                                <td className="p-3 text-sm text-foreground text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Coins className="w-4 h-4 text-orange-500" />
                                    <span className="font-medium">
                                      {purchase.price.toLocaleString("th-TH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
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
                <p className="text-muted-foreground">
                  สถิติการ์ตูน (Coming Soon)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Chapter Modal */}
        {showAddChapterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] mx-4 bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingChapterId ? "แก้ไขตอน" : "เพิ่มตอนใหม่"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddChapterModal(false);
                    setEditingChapterId(null);
                    setImagePreviews([]);
                    setChapterImages([]);
                    setChapterFormData({
                      title: "",
                      number: 1,
                      price: 0,
                      status: "published",
                    });
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Loading State */}
                {loadingChapterData && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        กำลังโหลดข้อมูลตอน...
                      </p>
                    </div>
                  </div>
                )}

                {/* Episode Type Selection - Hide in edit mode */}
                {!editingChapterId && !loadingChapterData && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setChapterType("single")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2",
                        chapterType === "single"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-background border-border text-foreground hover:bg-muted",
                      )}>
                      <FileText className="w-4 h-4" />
                      ตอนเดียว (Single)
                    </button>
                    <button
                      onClick={() => setChapterType("multi")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2",
                        chapterType === "multi"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-background border-border text-foreground hover:bg-muted",
                      )}>
                      <FileStack className="w-4 h-4" />
                      หลายตอน (Multi)
                    </button>
                  </div>
                )}

                {!loadingChapterData && chapterType === "single" ? (
                  <>
                    {/* Form Fields for Single Chapter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          ชื่อตอน
                        </label>
                        <input
                          type="text"
                          value={chapterFormData.title}
                          onChange={(e) =>
                            setChapterFormData({
                              ...chapterFormData,
                              title: e.target.value,
                            })
                          }
                          placeholder="ใส่ชื่อตอน (ว่างได้)"
                          className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          ตอนที่
                        </label>
                        <input
                          type="number"
                          value={chapterFormData.number}
                          onChange={(e) =>
                            setChapterFormData({
                              ...chapterFormData,
                              number: Number(e.target.value),
                            })
                          }
                          min="1"
                          step="0.5"
                          className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          ราคา (0 = ฟรี)
                        </label>
                        <input
                          type="number"
                          value={chapterFormData.price}
                          onChange={(e) =>
                            setChapterFormData({
                              ...chapterFormData,
                              price: Number(e.target.value),
                            })
                          }
                          min="0"
                          className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          สถานะ
                        </label>
                        <select
                          value={chapterFormData.status}
                          onChange={(e) =>
                            setChapterFormData({
                              ...chapterFormData,
                              status: e.target.value as "published" | "draft",
                            })
                          }
                          className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                          <option value="published">เผยแพร่</option>
                          <option value="draft">แบบร่าง</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Upload for Single */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          รูปภาพ ({chapterImages.length} รูป)
                        </label>
                        {chapterImages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (uploadingChapter) return;
                              setChapterImages([]);
                              setImagePreviews([]);
                            }}
                            disabled={uploadingChapter}
                            className={cn(
                              "px-3 py-1.5 border border-red-500 rounded-lg text-sm font-medium transition-colors",
                              uploadingChapter
                                ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                : "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:border-red-600",
                            )}>
                            ลบทั้งหมด
                          </button>
                        )}
                      </div>

                      {/* Upload Area */}
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                          uploadingChapter
                            ? "border-muted cursor-not-allowed opacity-50"
                            : "border-border cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5",
                        )}
                        onDragOver={(e) => {
                          if (uploadingChapter) return;
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          if (uploadingChapter) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const files = Array.from(e.dataTransfer.files).filter(
                            (file) => file.type.startsWith("image/"),
                          );
                          handleImageUpload(files);
                        }}
                        onClick={() => {
                          if (uploadingChapter) return;
                          const input = document.createElement("input");
                          input.type = "file";
                          input.multiple = true;
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const files = Array.from(
                              (e.target as HTMLInputElement).files || [],
                            ).filter((file) => file.type.startsWith("image/"));
                            handleImageUpload(files);
                          };
                          input.click();
                        }}>
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingChapter
                            ? "กำลังอัปโหลด... กรุณารอสักครู่"
                            : "คลิกเพื่อเพิ่มรูปภาพ หรือลากไฟล์มาวางที่นี่"}
                        </p>
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {/* Upload Progress */}
                          {uploadingProgress && (
                            <div className="bg-muted/50 border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                  กำลังอัปโหลดรูปภาพ...
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {uploadingProgress.current} /{" "}
                                  {uploadingProgress.total}
                                </span>
                              </div>
                              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-orange-500 h-full transition-all duration-300"
                                  style={{
                                    width: `${(uploadingProgress.current / uploadingProgress.total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div
                            className={cn(
                              "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2",
                              uploadingChapter &&
                                "pointer-events-none opacity-60",
                            )}>
                            {imagePreviews.map((preview, index) => {
                              const fileName =
                                chapterImages[index]?.name ||
                                `image-${index + 1}`;
                              const truncatedFileName = truncateFileName(
                                fileName,
                                12,
                              );
                              const isDragging = draggedIndex === index;
                              const isUploading =
                                uploadingChapter &&
                                uploadingProgress &&
                                index < uploadingProgress.current;

                              return (
                                <div
                                  key={index}
                                  draggable={!uploadingChapter}
                                  onDragStart={() =>
                                    !uploadingChapter && handleDragStart(index)
                                  }
                                  onDragOver={(e) =>
                                    !uploadingChapter &&
                                    handleDragOver(e, index)
                                  }
                                  onDrop={(e) =>
                                    !uploadingChapter && handleDrop(e, index)
                                  }
                                  className={cn(
                                    "relative group",
                                    uploadingChapter
                                      ? "cursor-not-allowed"
                                      : "cursor-move",
                                    isDragging && "opacity-50 scale-95",
                                  )}>
                                  {/* Image container - fixed height, full image visible */}
                                  <div
                                    className={cn(
                                      "w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted border transition-all relative",
                                      isDragging
                                        ? "border-orange-500 border-2"
                                        : "border-border",
                                      isUploading && "ring-2 ring-orange-500",
                                    )}>
                                    <img
                                      src={preview}
                                      alt={`Page ${index + 1}`}
                                      className="w-full h-full object-contain pointer-events-none"
                                      draggable={false}
                                    />
                                    {/* Uploading overlay */}
                                    {isUploading && (
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                      </div>
                                    )}
                                  </div>
                                  {/* Page number badge - with hover theme */}
                                  <div className="absolute top-1 left-1 bg-orange-500/90 hover:bg-orange-500 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-colors pointer-events-none">
                                    {index + 1}
                                  </div>
                                  {/* File name badge - right side */}
                                  <div
                                    className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
                                    title={fileName}>
                                    {truncatedFileName}
                                  </div>
                                  {/* Delete button - hidden when uploading */}
                                  {!uploadingChapter && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newImages = chapterImages.filter(
                                          (_, i) => i !== index,
                                        );
                                        const newPreviews =
                                          imagePreviews.filter(
                                            (_, i) => i !== index,
                                          );
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
                    {/* Multi Chapter Upload Instructions */}
                    <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        อัพโหลดไฟล์ ZIP ที่มีโครงสร้างดังนี้:
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-orange-500 mb-2">
                            Single Chapter:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>1.jpg</li>
                            <li>2.jpg</li>
                          </ul>
                          <p className="text-xs text-orange-500 mt-2">
                            โปรดตั้งชื่อไฟล์ตามชื่อตอน เช่น ตอนที่ 23.zip
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-orange-500 mb-2">
                            Multi Chapter:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              ตอนที่ 1
                              <ul className="ml-4 mt-1 space-y-1 list-disc">
                                <li>1.jpg</li>
                                <li>2.jpg</li>
                              </ul>
                            </li>
                            <li>
                              ตอนที่ 2
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
                            "flex items-center justify-between w-full px-4 py-2.5 border border-border rounded-lg cursor-pointer transition-colors",
                            zipFile
                              ? "bg-muted/50 border-orange-500/50"
                              : "bg-background hover:bg-muted/30",
                          )}>
                          <span className="text-sm text-foreground">
                            {zipFileName || "Choose File"}
                          </span>
                          <Upload className="w-4 h-4 text-muted-foreground" />
                        </label>
                      </div>
                      {zipFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ไฟล์: {zipFileName} (
                          {(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex justify-end gap-4">
                <button
                  onClick={() => {
                    if (uploadingChapter) return;
                    setShowAddChapterModal(false);
                    setEditingChapterId(null);
                    setImagePreviews([]);
                    setChapterImages([]);
                    setZipFile(null);
                    setZipFileName("");
                    setUploadingProgress(null);
                    setChapterFormData({
                      title: "",
                      number: 1,
                      price: 0,
                      status: "published",
                    });
                  }}
                  disabled={uploadingChapter}
                  className={cn(
                    "px-6 py-2.5 border border-border rounded-lg transition-colors",
                    uploadingChapter
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted",
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
                    (editingChapterId
                      ? imagePreviews.length === 0
                      : chapterType === "single"
                        ? chapterImages.length === 0
                        : !zipFile)
                  }
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingChapter
                    ? editingChapterId
                      ? "กำลังอัปเดต..."
                      : "กำลังสร้าง..."
                    : editingChapterId
                      ? "อัปเดต"
                      : "สร้าง"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
