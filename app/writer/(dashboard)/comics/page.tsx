"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, X, Eye, Heart, MessageCircle, Coins, Bookmark, FileText, ExternalLink } from "lucide-react";
import { MangaStatus, Visibility } from "@/lib/types/client-enums";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Genre = {
  id: string; // slug
  slug: string;
  name: string;
  type: "main" | "sub";
};

type Manga = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  status: MangaStatus;
  visibility: Visibility;
  isMature: boolean;
  views: number;
  likesCount: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
  genres: Genre[];
  _count: {
    chapters: number;
    bookmarks: number;
    likes: number;
    comments: number;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default function WriterComicsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MangaStatus | "">("");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "">("");
  const [genreFilter, setGenreFilter] = useState<string | "">("");
  const [matureFilter, setMatureFilter] = useState<"all" | "mature" | "general">("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (user?.id) {
        fetchMangas();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user, pagination.page, itemsPerPage, search, statusFilter, visibilityFilter, genreFilter, matureFilter]);

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

  const fetchMangas = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: itemsPerPage.toString(),
        creatorId: user.id.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(visibilityFilter && { visibility: visibilityFilter }),
        ...(genreFilter && { genreId: genreFilter }),
        ...(matureFilter !== "all" && { isMature: matureFilter === "mature" ? "true" : "false" }),
      });

      const response = await fetch(`/api/manga?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        setMangas(data.data.mangas || []);
        if (data.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            ...data.data.pagination,
            limit: itemsPerPage,
          }));
        }
      } else {
        setMangas([]);
      }
    } catch (error) {
      console.error("Failed to fetch mangas:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setVisibilityFilter("");
    setGenreFilter("");
    setMatureFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (mangaId: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบมังงะนี้?")) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem("session_token") || "";
      const response = await fetch(`/api/manga/${mangaId}`, {
        method: "DELETE",
        headers: {
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        toast.success("ลบมังงะสำเร็จ 👌");
        fetchMangas();
      } else {
        toast.error("เกิดข้อผิดพลาดในการลบมังงะ");
      }
    } catch (error) {
      console.error("Failed to delete manga:", error);
      toast.error("เกิดข้อผิดพลาดในการลบมังงะ");
    }
  };

  const mainGenres = genres.filter((g) => g.type === "main");

  const getStatusLabel = (status: MangaStatus) => {
    const labels = {
      ONGOING: "ยังไม่จบ",
      COMPLETED: "จบแล้ว",
      HIATUS: "พักชั่วคราว",
    };
    return labels[status];
  };

  const getVisibilityLabel = (visibility: Visibility) => {
    const labels = {
      PUBLIC: "เผยแพร่",
      UNLISTED: "ไม่ระบุ",
      PRIVATE: "ไม่เผยแพร่",
    };
    return labels[visibility];
  };

  const hasActiveFilters = search || statusFilter || visibilityFilter || genreFilter || matureFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">การ์ตูนของฉัน</h1>
        </div>
        <Link
          href="/writer/comics/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          สร้างการ์ตูนเรื่องใหม่
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">ค้นหาการ์ตูน</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="ชื่อเรื่อง"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">หมวดหมู่</label>
            <div className="relative">
              <select
                value={genreFilter}
                onChange={(e) => {
                  setGenreFilter(e.target.value || "");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={cn(
                  "w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground",
                  "appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                  "text-sm"
                )}>
                <option value="">ทั้งหมด</option>
                {mainGenres.map((genre) => (
                  <option key={genre.slug} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">ระดับเนื้อหา</label>
            <div className="relative">
              <select
                value={matureFilter}
                onChange={(e) => {
                  setMatureFilter(e.target.value as "all" | "mature" | "general");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={cn(
                  "w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground",
                  "appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                  "text-sm"
                )}>
                <option value="all">ทั้งหมด</option>
                <option value="general">ทั่วไป</option>
                <option value="mature">18+</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">สถานะ</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as MangaStatus | "");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={cn(
                  "w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground",
                  "appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                  "text-sm"
                )}>
                <option value="">ทั้งหมด</option>
                <option value={MangaStatus.ONGOING}>ยังไม่จบ</option>
                <option value={MangaStatus.COMPLETED}>จบแล้ว</option>
                <option value={MangaStatus.HIATUS}>พักชั่วคราว</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">การเผยแพร่</label>
            <div className="relative">
              <select
                value={visibilityFilter}
                onChange={(e) => {
                  setVisibilityFilter(e.target.value as Visibility | "");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={cn(
                  "w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground",
                  "appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50",
                  "text-sm"
                )}>
                <option value="">ทั้งหมด</option>
                <option value={Visibility.PUBLIC}>เผยแพร่</option>
                <option value={Visibility.UNLISTED}>ไม่ระบุ</option>
                <option value={Visibility.PRIVATE}>ไม่เผยแพร่</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
              ล้างค่าการค้นหา
            </button>
          </div>
        )}
      </div>

      {/* Items Per Page */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">แสดง</span>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPagination((prev) => ({ ...prev, page: 1, limit: Number(e.target.value) }));
              }}
              className={cn(
                "px-3 py-1.5 pr-8 border border-border rounded-lg bg-background text-foreground",
                "appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                "text-sm"
              )}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">รายการ</span>
        </div>
      </div>

      {/* Manga List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {authLoading || loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-muted-foreground mt-2">กำลังโหลด...</p>
          </div>
        ) : mangas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">ไม่พบผลงานมังงะ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[28%]">ชื่อเรื่อง</th>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[18%]">หมวดหมู่</th>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[10%]">ระดับเนื้อหา</th>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[12%]">สถานะ</th>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[12%]">การเผยแพร่</th>
                  <th className="text-left px-5 py-4 font-medium text-sm text-foreground w-[12%]">ยอดขาย</th>
                  <th className="text-right px-5 py-4 font-medium text-sm text-foreground w-[8%]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {mangas.map((manga) => {
                  const genreNames = manga.genres.map((g) => g.name).join(" X ");
                  return (
                    <tr key={manga.id} className="border-b border-border group hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-5">
                        <Link
                          href={`/writer/comics/${manga.slug}`}
                          className="flex items-center gap-4 cursor-pointer">
                          <div className="w-16 h-22 rounded-lg overflow-hidden bg-muted flex-shrink-0" style={{ height: "88px" }}>
                            {manga.coverUrl ? (
                              <img
                                src={manga.coverUrl}
                                alt={manga.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">ไม่มีภาพ</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[15px] text-foreground truncate group-hover:text-orange-500 transition-colors">
                              {manga.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{formatNumber(manga._count.chapters)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{formatNumber(manga.views)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>{formatNumber(manga._count.bookmarks)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-sm text-foreground">{genreNames || "-"}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-sm text-foreground">{manga.isMature ? "18+" : "ทั่วไป"}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="text-sm text-foreground">{getStatusLabel(manga.status)}</span>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
                            manga.visibility === Visibility.PUBLIC
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                          {getVisibilityLabel(manga.visibility)}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-foreground">
                            {formatNumber(manga.sales || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/manga/${manga.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-muted-foreground hover:text-orange-500 transition-colors rounded hover:bg-orange-500/10">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(manga.id);
                            }}
                            className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                จำนวนการ์ตูนที่พบ {pagination.total} เรื่อง
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ก่อนหน้า
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-colors",
                        pagination.page === pageNum
                          ? "bg-orange-500 text-white"
                          : "border border-border hover:bg-muted"
                      )}>
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ต่อไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}